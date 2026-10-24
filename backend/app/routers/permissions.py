from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.document import Document
from app.models.permission import DocumentPermission, PermissionType
from app.schemas.permission import (
    PermissionGrantRequest,
    PermissionUpdateRequest,
    PermissionResponse,
)
from app.security.auth import get_current_user
from app.services.authorization import auth_service
from app.services.audit import audit_service

router = APIRouter(prefix="/api/documents", tags=["Permissions"])


@router.post("/{document_id}/permissions", response_model=PermissionResponse, status_code=status.HTTP_201_CREATED)
def grant_permission(
    document_id: str,
    payload: PermissionGrantRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Grants explicit READ or EDIT permission on a document to a named recipient.
    Only the document owner can grant permissions.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    allowed, reason = auth_service.can_manage_permissions(db, current_user, doc)
    if not allowed:
        audit_service.record_event(
            db=db,
            action="PERMISSION_GRANT_DENIED",
            target_resource_type="DOCUMENT",
            target_resource_id=doc.id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={"reason": reason, "target_user_id": payload.user_id},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    # Validate grantee exists and is active
    recipient = db.query(User).filter(User.id == payload.user_id).first()
    if not recipient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipient user not found.")
    if not recipient.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot grant permissions to a disabled user.")

    # Owner cannot grant permissions to themselves
    if recipient.id == doc.owner_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Document owner already has full rights and cannot be granted permissions.",
        )

    # Check if active grant already exists
    existing = (
        db.query(DocumentPermission)
        .filter(
            DocumentPermission.document_id == doc.id,
            DocumentPermission.user_id == recipient.id,
            DocumentPermission.revoked_at.is_(None),
        )
        .first()
    )

    now = datetime.now(timezone.utc)
    if existing:
        # Update existing grant
        old_perm = existing.permission
        existing.permission = payload.permission
        existing.updated_at = now
        db.commit()
        db.refresh(existing)
        target_grant = existing

        audit_service.record_event(
            db=db,
            action="PERMISSION_CHANGE",
            target_resource_type="PERMISSION",
            target_resource_id=existing.id,
            outcome="SUCCESS",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={
                "document_id": doc.id,
                "recipient_id": recipient.id,
                "recipient_email": recipient.email,
                "old_permission": old_perm,
                "new_permission": payload.permission,
            },
        )
    else:
        # Create new grant
        new_grant = DocumentPermission(
            document_id=doc.id,
            user_id=recipient.id,
            permission=payload.permission,
            granted_by=current_user.id,
            granted_at=now,
            updated_at=now,
            revoked_at=None,
        )
        db.add(new_grant)
        db.commit()
        db.refresh(new_grant)
        target_grant = new_grant

        audit_service.record_event(
            db=db,
            action="PERMISSION_GRANT",
            target_resource_type="PERMISSION",
            target_resource_id=new_grant.id,
            outcome="SUCCESS",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={
                "document_id": doc.id,
                "recipient_id": recipient.id,
                "recipient_email": recipient.email,
                "permission": payload.permission,
            },
        )

    resp = PermissionResponse.model_validate(target_grant)
    resp.user_email = recipient.email
    resp.user_full_name = recipient.full_name
    resp.granter_email = current_user.email
    return resp


@router.get("/{document_id}/permissions", response_model=List[PermissionResponse])
def list_permissions(
    document_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Lists permissions for a document. Owner and Admin only."""
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if doc.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner or an administrator can view permission grants.",
        )

    grants = (
        db.query(DocumentPermission)
        .filter(DocumentPermission.document_id == doc.id)
        .order_by(DocumentPermission.granted_at.desc())
        .all()
    )

    results = []
    for g in grants:
        p_resp = PermissionResponse.model_validate(g)
        p_resp.user_email = g.user.email if g.user else None
        p_resp.user_full_name = g.user.full_name if g.user else None
        p_resp.granter_email = g.granter.email if g.granter else None
        results.append(p_resp)
    return results


@router.patch("/{document_id}/permissions/{permission_id}", response_model=PermissionResponse)
def update_permission(
    document_id: str,
    permission_id: str,
    payload: PermissionUpdateRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Updates an existing permission level (READ <-> EDIT). Owner only."""
    correlation_id = getattr(request.state, "correlation_id", None)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    allowed, reason = auth_service.can_manage_permissions(db, current_user, doc)
    if not allowed:
        audit_service.record_event(
            db=db,
            action="PERMISSION_CHANGE_DENIED",
            target_resource_type="PERMISSION",
            target_resource_id=permission_id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={"reason": reason},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    grant = (
        db.query(DocumentPermission)
        .filter(
            DocumentPermission.id == permission_id,
            DocumentPermission.document_id == doc.id,
            DocumentPermission.revoked_at.is_(None),
        )
        .first()
    )
    if not grant:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active permission grant not found.")

    old_perm = grant.permission
    grant.permission = payload.permission
    grant.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(grant)

    audit_service.record_event(
        db=db,
        action="PERMISSION_CHANGE",
        target_resource_type="PERMISSION",
        target_resource_id=grant.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        metadata={
            "document_id": doc.id,
            "user_id": grant.user_id,
            "old_permission": old_perm,
            "new_permission": payload.permission,
        },
    )

    resp = PermissionResponse.model_validate(grant)
    resp.user_email = grant.user.email if grant.user else None
    resp.user_full_name = grant.user.full_name if grant.user else None
    resp.granter_email = current_user.email
    return resp


@router.delete("/{document_id}/permissions/{permission_id}")
def revoke_permission(
    document_id: str,
    permission_id: str,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Immediately revokes a permission grant.
    Enforces that subsequent download/read/edit requests by grantee are immediately denied.
    """
    correlation_id = getattr(request.state, "correlation_id", None)
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    allowed, reason = auth_service.can_manage_permissions(db, current_user, doc)
    if not allowed:
        audit_service.record_event(
            db=db,
            action="PERMISSION_REVOKE_DENIED",
            target_resource_type="PERMISSION",
            target_resource_id=permission_id,
            outcome="DENIED",
            actor=current_user,
            request_correlation_id=correlation_id,
            metadata={"reason": reason},
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    grant = (
        db.query(DocumentPermission)
        .filter(
            DocumentPermission.id == permission_id,
            DocumentPermission.document_id == doc.id,
        )
        .first()
    )
    if not grant or grant.revoked_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Active permission grant not found.")

    now = datetime.now(timezone.utc)
    grant.revoked_at = now
    grant.updated_at = now
    db.commit()

    recipient = db.query(User).filter(User.id == grant.user_id).first()
    recipient_email = recipient.email if recipient else "unknown"

    audit_service.record_event(
        db=db,
        action="PERMISSION_REVOKE",
        target_resource_type="PERMISSION",
        target_resource_id=grant.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        metadata={
            "document_id": doc.id,
            "revoked_user_id": grant.user_id,
            "revoked_user_email": recipient_email,
            "revoked_permission": grant.permission,
        },
    )

    return {"message": "Permission grant successfully revoked."}
