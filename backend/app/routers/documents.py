import io
import math
from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Request, Response, UploadFile, File, Form, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_
from app.database import get_db
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.version import DocumentVersion
from app.models.permission import DocumentPermission
from app.schemas.document import (
    DocumentResponse,
    DocumentDetailResponse,
    DocumentUpdate,
    DocumentListResponse,
    DocumentVersionResponse,
)
from app.schemas.permission import PermissionResponse
from app.security.auth import get_current_user
from app.services.authorization import auth_service
from app.services.audit import audit_service
from app.storage.validation import validate_file_upload
from app.storage.storage import file_storage

router = APIRouter(prefix="/api/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    request: Request,
    title: str = Form(...),
    description: Optional[str] = Form(None),
    category: str = Form("General"),
    tags: Optional[str] = Form(None),
    sensitivity: str = Form("Confidential"),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Uploads a new confidential document.
    Enforces upload validation (size, magic bytes, extension allowlist).
    Stores file in private storage with random key and SHA-256 hash.
    Assigns ownership strictly on server-side to current_user.
    """
    # Viewers cannot upload documents; only Owners and Admins
    if current_user.role not in (UserRole.OWNER.value, UserRole.ADMIN.value):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers are not permitted to upload documents. Please contact an administrator.",
        )

    # Read and validate file content
    content = await file.read()
    clean_filename, mime_type = validate_file_upload(
        filename=file.filename or "uploaded_file",
        content=content,
        client_content_type=file.content_type or "",
    )

    # Save to private storage
    storage_key, sha256_hash, file_size = file_storage.save(content)

    # Create Document record
    document = Document(
        title=title.strip(),
        description=description.strip() if description else None,
        category=category.strip(),
        tags=tags.strip() if tags else None,
        sensitivity=sensitivity,
        owner_id=current_user.id,
        storage_key=storage_key,
        original_filename=clean_filename,
        file_size_bytes=file_size,
        mime_type=mime_type,
        sha256_hash=sha256_hash,
        current_version=1,
    )
    db.add(document)
    db.commit()
    db.refresh(document)

    # Create Version 1 record
    version_1 = DocumentVersion(
        document_id=document.id,
        version_number=1,
        storage_key=storage_key,
        original_filename=clean_filename,
        file_size_bytes=file_size,
        mime_type=mime_type,
        sha256_hash=sha256_hash,
        change_summary="Initial document upload",
        created_by=current_user.id,
    )
    db.add(version_1)
    db.commit()

    # Record Audit Event
    correlation_id = getattr(request.state, "correlation_id", None)
    audit_service.record_event(
        db=db,
        action="DOCUMENT_UPLOAD",
        target_resource_type="DOCUMENT",
        target_resource_id=document.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        ip_address=request.client.host if request.client else None,
        user_agent=request.headers.get("user-agent"),
        metadata={
            "filename": clean_filename,
            "file_size": file_size,
            "sha256": sha256_hash,
            "category": category,
            "sensitivity": sensitivity,
        },
    )

    resp = DocumentResponse.model_validate(document)
    resp.owner_email = current_user.email
    resp.owner_name = current_user.full_name
    resp.user_effective_permission = "OWNER"
    return resp


@router.get("", response_model=DocumentListResponse)
def list_documents(
    search: Optional[str] = Query(None, description="Search term for title or tags"),
    category: Optional[str] = Query(None, description="Filter by category"),
    sensitivity: Optional[str] = Query(None, description="Filter by sensitivity"),
    include_deleted: bool = Query(False, description="Include soft-deleted documents (owner only)"),
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns only documents the current user is strictly authorized to discover.
    - Owner can see their documents.
    - Users can see documents shared with them with active (unrevoked) permission grants.
    Administrators do NOT implicitly see confidential documents they do not own or have grants to.
    """
    # Find all document IDs shared actively with user
    from sqlalchemy import select
    active_shared_doc_ids = (
        select(DocumentPermission.document_id)
        .filter(
            DocumentPermission.user_id == current_user.id,
            DocumentPermission.revoked_at.is_(None),
        )
    )

    # Base query: owned by user OR shared actively with user
    query = db.query(Document).filter(
        or_(
            Document.owner_id == current_user.id,
            Document.id.in_(active_shared_doc_ids),
        )
    )

    # Soft delete filtering
    if not include_deleted:
        query = query.filter(Document.is_deleted.is_(False))
    else:
        # Non-owners can never see deleted documents even if shared
        query = query.filter(
            or_(
                Document.is_deleted.is_(False),
                and_(Document.is_deleted.is_(True), Document.owner_id == current_user.id),
            )
        )

    # Filters
    if category:
        query = query.filter(Document.category == category)
    if sensitivity:
        query = query.filter(Document.sensitivity == sensitivity)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Document.title.ilike(search_fmt),
                Document.description.ilike(search_fmt),
                Document.tags.ilike(search_fmt),
            )
        )

    total = query.count()
    offset = (page - 1) * page_size
    documents = query.order_by(Document.updated_at.desc()).offset(offset).limit(page_size).all()

    items = []
    for doc in documents:
        eff_perm = auth_service.get_effective_permission(db, current_user, doc)
        item = DocumentResponse.model_validate(doc)
        item.owner_email = doc.owner.email if doc.owner else None
        item.owner_name = doc.owner.full_name if doc.owner else None
        item.user_effective_permission = eff_perm
        items.append(item)

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return DocumentListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{document_id}", response_model=DocumentDetailResponse)
def get_document_details(
    document_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns document metadata, active permissions, and version history.
    Enforces authorization check. If unauthorized, records denial in audit log.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    allowed, reason = auth_service.can_read(db, current_user, doc)
    if not allowed:
        audit_service.record_event(
            db=db,
            action="DOCUMENT_VIEW_DENIED",
            target_resource_type="DOCUMENT",
            target_resource_id=doc.id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            ip_address=client_ip,
            user_agent=user_agent,
            metadata={"reason": reason},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    # Record view audit event
    audit_service.record_event(
        db=db,
        action="DOCUMENT_VIEW",
        target_resource_type="DOCUMENT",
        target_resource_id=doc.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    eff_perm = auth_service.get_effective_permission(db, current_user, doc)
    resp = DocumentDetailResponse.model_validate(doc)
    resp.owner_email = doc.owner.email if doc.owner else None
    resp.owner_name = doc.owner.full_name if doc.owner else None
    resp.user_effective_permission = eff_perm

    # Attach permissions (only document owner or admin can see full grant list; viewers see empty list)
    if eff_perm == "OWNER" or current_user.role == UserRole.ADMIN.value:
        perms = (
            db.query(DocumentPermission)
            .filter(DocumentPermission.document_id == doc.id)
            .order_by(DocumentPermission.granted_at.desc())
            .all()
        )
        perm_list = []
        for p in perms:
            p_resp = PermissionResponse.model_validate(p)
            p_resp.user_email = p.user.email if p.user else None
            p_resp.user_full_name = p.user.full_name if p.user else None
            p_resp.granter_email = p.granter.email if p.granter else None
            perm_list.append(p_resp)
        resp.permissions = perm_list
    else:
        resp.permissions = []

    # Attach versions
    versions = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == doc.id)
        .order_by(DocumentVersion.version_number.desc())
        .all()
    )
    resp.versions = [DocumentVersionResponse.model_validate(v) for v in versions]

    return resp


@router.get("/{document_id}/download")
def download_document(
    document_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Downloads confidential document content.
    Rechecks live authorization on EVERY request (immediate revocation enforcement).
    Logs SUCCESS or DENIED in the tamper-evident audit trail.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    client_ip = request.client.host if request.client else None
    user_agent = request.headers.get("user-agent")

    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    allowed, reason = auth_service.can_read(db, current_user, doc)
    if not allowed:
        # Audit denial
        audit_service.record_event(
            db=db,
            action="DOCUMENT_DOWNLOAD_DENIED",
            target_resource_type="DOCUMENT",
            target_resource_id=doc.id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            ip_address=client_ip,
            user_agent=user_agent,
            metadata={"reason": reason, "filename": doc.original_filename},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    # Read from secure private storage
    file_bytes = file_storage.read(doc.storage_key)

    # Audit successful download
    audit_service.record_event(
        db=db,
        action="DOCUMENT_DOWNLOAD_SUCCESS",
        target_resource_type="DOCUMENT",
        target_resource_id=doc.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        ip_address=client_ip,
        user_agent=user_agent,
        metadata={
            "filename": doc.original_filename,
            "version": doc.current_version,
            "sha256": doc.sha256_hash,
        },
    )

    headers = {
        "Content-Disposition": f'attachment; filename="{doc.original_filename}"',
        "X-Content-SHA256": doc.sha256_hash,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    }
    return Response(
        content=file_bytes,
        media_type=doc.mime_type,
        headers=headers,
    )


@router.patch("/{document_id}", response_model=DocumentResponse)
def update_document_metadata(
    document_id: str,
    payload: DocumentUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Modifies document metadata.
    Requires EDIT or OWNER permission.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    allowed, reason = auth_service.can_edit(db, current_user, doc)
    if not allowed:
        audit_service.record_event(
            db=db,
            action="DOCUMENT_EDIT_DENIED",
            target_resource_type="DOCUMENT",
            target_resource_id=doc.id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={"reason": reason},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    changes = {}
    if payload.title is not None and payload.title.strip() != doc.title:
        changes["title"] = {"old": doc.title, "new": payload.title.strip()}
        doc.title = payload.title.strip()
    if payload.description is not None:
        doc.description = payload.description.strip()
    if payload.category is not None:
        doc.category = payload.category.strip()
    if payload.tags is not None:
        doc.tags = payload.tags.strip()
    if payload.sensitivity is not None:
        doc.sensitivity = payload.sensitivity

    doc.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(doc)

    audit_service.record_event(
        db=db,
        action="DOCUMENT_EDIT",
        target_resource_type="DOCUMENT",
        target_resource_id=doc.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        metadata={"changes": changes},
    )

    resp = DocumentResponse.model_validate(doc)
    resp.owner_email = doc.owner.email if doc.owner else None
    resp.owner_name = doc.owner.full_name if doc.owner else None
    resp.user_effective_permission = auth_service.get_effective_permission(db, current_user, doc)
    return resp


@router.post("/{document_id}/replace", response_model=DocumentResponse)
async def replace_document_content(
    document_id: str,
    request: Request,
    change_summary: Optional[str] = Form(None),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Replaces document content and creates a new version record.
    Requires EDIT or OWNER permission.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    allowed, reason = auth_service.can_edit(db, current_user, doc)
    if not allowed:
        audit_service.record_event(
            db=db,
            action="DOCUMENT_REPLACE_DENIED",
            target_resource_type="DOCUMENT",
            target_resource_id=doc.id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={"reason": reason},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    content = await file.read()
    clean_filename, mime_type = validate_file_upload(
        filename=file.filename or "replaced_file",
        content=content,
        client_content_type=file.content_type or "",
    )

    new_storage_key, new_sha256, new_size = file_storage.save(content)
    new_version_num = doc.current_version + 1

    # Update document head
    doc.storage_key = new_storage_key
    doc.original_filename = clean_filename
    doc.file_size_bytes = new_size
    doc.mime_type = mime_type
    doc.sha256_hash = new_sha256
    doc.current_version = new_version_num
    doc.updated_at = datetime.now(timezone.utc)
    db.commit()

    # Record version
    version_record = DocumentVersion(
        document_id=doc.id,
        version_number=new_version_num,
        storage_key=new_storage_key,
        original_filename=clean_filename,
        file_size_bytes=new_size,
        mime_type=mime_type,
        sha256_hash=new_sha256,
        change_summary=change_summary or f"Updated to version {new_version_num}",
        created_by=current_user.id,
    )
    db.add(version_record)
    db.commit()

    # Record audit events
    audit_service.record_event(
        db=db,
        action="VERSION_CREATE",
        target_resource_type="DOCUMENT_VERSION",
        target_resource_id=version_record.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        metadata={"document_id": doc.id, "version_number": new_version_num, "sha256": new_sha256},
    )

    resp = DocumentResponse.model_validate(doc)
    resp.owner_email = doc.owner.email if doc.owner else None
    resp.owner_name = doc.owner.full_name if doc.owner else None
    resp.user_effective_permission = auth_service.get_effective_permission(db, current_user, doc)
    return resp


@router.delete("/{document_id}")
def delete_document(
    document_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Soft-deletes document. Only document owner can delete.
    Preserves audit history and version records.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    allowed, reason = auth_service.can_delete(db, current_user, doc)
    if not allowed:
        audit_service.record_event(
            db=db,
            action="DOCUMENT_DELETE_DENIED",
            target_resource_type="DOCUMENT",
            target_resource_id=doc.id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={"reason": reason},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    doc.is_deleted = True
    doc.deleted_at = datetime.now(timezone.utc)
    db.commit()

    audit_service.record_event(
        db=db,
        action="DOCUMENT_DELETE",
        target_resource_type="DOCUMENT",
        target_resource_id=doc.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        metadata={"title": doc.title},
    )

    return {"message": "Document successfully deleted."}


@router.post("/{document_id}/restore")
def restore_document(
    document_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Restores soft-deleted document. Only document owner can restore.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if doc.owner_id != current_user.id:
        audit_service.record_event(
            db=db,
            action="DOCUMENT_RESTORE_DENIED",
            target_resource_type="DOCUMENT",
            target_resource_id=doc.id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={"reason": "Only owner can restore document"},
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner can restore this document.",
        )

    doc.is_deleted = False
    doc.deleted_at = None
    db.commit()

    audit_service.record_event(
        db=db,
        action="DOCUMENT_RESTORE",
        target_resource_type="DOCUMENT",
        target_resource_id=doc.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        metadata={"title": doc.title},
    )

    return {"message": "Document successfully restored."}


@router.get("/{document_id}/versions", response_model=List[DocumentVersionResponse])
def list_document_versions(
    document_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists all historical versions of a document. Requires READ or EDIT authorization."""
    correlation_id = getattr(request.state, "correlation_id", None)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    allowed, reason = auth_service.can_read(db, current_user, doc)
    if not allowed:
        audit_service.record_event(
            db=db,
            action="DOCUMENT_VERSIONS_VIEW_DENIED",
            target_resource_type="DOCUMENT",
            target_resource_id=doc.id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={"reason": reason},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    versions = (
        db.query(DocumentVersion)
        .filter(DocumentVersion.document_id == doc.id)
        .order_by(DocumentVersion.version_number.desc())
        .all()
    )
    return [DocumentVersionResponse.model_validate(v) for v in versions]


@router.get("/{document_id}/versions/{version_number}/download")
def download_document_version(
    document_id: str,
    version_number: int,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Downloads a specific historical version. Requires READ or EDIT authorization."""
    correlation_id = getattr(request.state, "correlation_id", None)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    allowed, reason = auth_service.can_read(db, current_user, doc)
    if not allowed:
        audit_service.record_event(
            db=db,
            action="DOCUMENT_VERSION_DOWNLOAD_DENIED",
            target_resource_type="DOCUMENT",
            target_resource_id=doc.id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={"reason": reason, "version_number": version_number},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    version_rec = (
        db.query(DocumentVersion)
        .filter(
            DocumentVersion.document_id == doc.id,
            DocumentVersion.version_number == version_number,
        )
        .first()
    )
    if not version_rec:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Version not found.")

    file_bytes = file_storage.read(version_rec.storage_key)

    audit_service.record_event(
        db=db,
        action="DOCUMENT_VERSION_DOWNLOAD_SUCCESS",
        target_resource_type="DOCUMENT_VERSION",
        target_resource_id=version_rec.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        metadata={
            "document_id": doc.id,
            "version_number": version_number,
            "sha256": version_rec.sha256_hash,
        },
    )

    headers = {
        "Content-Disposition": f'attachment; filename="v{version_number}_{version_rec.original_filename}"',
        "X-Content-SHA256": version_rec.sha256_hash,
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    }
    return Response(
        content=file_bytes,
        media_type=version_rec.mime_type,
        headers=headers,
    )
