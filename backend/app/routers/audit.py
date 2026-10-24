import math
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.audit import AuditEvent
from app.schemas.audit import (
    AuditEventResponse,
    AuditExplorerResponse,
    AuditIntegrityVerificationResponse,
)
from app.security.auth import get_current_user, require_admin
from app.services.audit import audit_service

router = APIRouter(prefix="/api/audit", tags=["Audit Trail"])


@router.get("", response_model=AuditExplorerResponse)
def get_audit_explorer(
    actor_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    resource_type: Optional[str] = Query(None),
    outcome: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Searchable audit explorer.
    Administrators have global visibility across all system events.
    Document owners have visibility strictly restricted to events on documents they own or initiated by themselves.
    Viewers cannot access the audit explorer.
    """
    if current_user.role == UserRole.VIEWER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Viewers are not permitted to inspect system audit logs.",
        )

    query = db.query(AuditEvent)

    # Restrict Document Owner visibility to only their owned documents or their own actions
    if current_user.role == UserRole.OWNER.value:
        owned_doc_ids = [d.id for d in db.query(Document.id).filter(Document.owner_id == current_user.id).all()]
        query = query.filter(
            or_(
                AuditEvent.actor_id == current_user.id,
                AuditEvent.target_resource_id.in_(owned_doc_ids),
            )
        )

    # Filters
    if actor_id:
        query = query.filter(AuditEvent.actor_id == actor_id)
    if action:
        query = query.filter(AuditEvent.action == action)
    if resource_type:
        query = query.filter(AuditEvent.target_resource_type == resource_type)
    if outcome:
        query = query.filter(AuditEvent.outcome == outcome)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            or_(
                AuditEvent.action.ilike(search_fmt),
                AuditEvent.actor_email.ilike(search_fmt),
                AuditEvent.target_resource_id.ilike(search_fmt),
                AuditEvent.metadata_json.ilike(search_fmt),
            )
        )

    total = query.count()
    offset = (page - 1) * page_size
    events = query.order_by(AuditEvent.sequence_number.desc()).offset(offset).limit(page_size).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return AuditExplorerResponse(
        items=[AuditEventResponse.model_validate(e) for e in events],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/document/{document_id}", response_model=List[AuditEventResponse])
def get_document_audit_history(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns audit timeline for a specific document.
    Only the document owner or an administrator can access this endpoint.
    """
    doc = db.query(Document).filter(Document.id == document_id).first()
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if doc.owner_id != current_user.id and current_user.role != UserRole.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the document owner or an administrator can view document audit history.",
        )

    events = (
        db.query(AuditEvent)
        .filter(AuditEvent.target_resource_id == document_id)
        .order_by(AuditEvent.sequence_number.desc())
        .limit(100)
        .all()
    )

    return [AuditEventResponse.model_validate(e) for e in events]


@router.get("/verify", response_model=AuditIntegrityVerificationResponse)
def verify_audit_integrity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Performs full SHA-256 hash-chain verification from sequence #1 to latest.
    Detects any modification, deletion, reordering, or broken link.
    """
    # Available to Admins and Owners
    if current_user.role == UserRole.VIEWER.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized to run audit verification.",
        )

    report = audit_service.verify_chain_integrity(db)
    return AuditIntegrityVerificationResponse(**report)


@router.post("/checkpoint")
def create_audit_checkpoint(
    request: Request,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin-only: computes and records a signed HMAC checkpoint for the audit log head."""
    checkpoint = audit_service.create_signed_checkpoint(db)
    correlation_id = getattr(request.state, "correlation_id", None)
    
    audit_service.record_event(
        db=db,
        action="AUDIT_CHECKPOINT_CREATED",
        target_resource_type="SYSTEM",
        target_resource_id=checkpoint.id,
        outcome="SUCCESS",
        actor=current_admin,
        request_correlation_id=correlation_id,
        metadata={
            "sequence_number": checkpoint.sequence_number,
            "event_hash": checkpoint.event_hash,
        },
    )

    return {
        "id": checkpoint.id,
        "sequence_number": checkpoint.sequence_number,
        "event_hash": checkpoint.event_hash,
        "signature": checkpoint.signature,
        "created_at": checkpoint.created_at,
    }
