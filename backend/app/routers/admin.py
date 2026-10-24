from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.permission import DocumentPermission
from app.models.audit import AuditEvent
from app.security.auth import require_admin
from app.services.audit import audit_service
from app.schemas.audit import AuditEventResponse

router = APIRouter(prefix="/api/admin", tags=["Administration"])


@router.get("/stats")
def get_admin_dashboard_stats(
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
) -> Dict[str, Any]:
    """Returns real database-backed aggregate metrics for the security administration dashboard."""
    # User counts
    total_users = db.query(func.count(User.id)).scalar() or 0
    active_users = db.query(func.count(User.id)).filter(User.is_active.is_(True)).scalar() or 0
    disabled_users = db.query(func.count(User.id)).filter(User.is_active.is_(False)).scalar() or 0

    # Document counts
    total_documents = db.query(func.count(Document.id)).filter(Document.is_deleted.is_(False)).scalar() or 0
    deleted_documents = db.query(func.count(Document.id)).filter(Document.is_deleted.is_(True)).scalar() or 0

    # Activity counts in last 24 hours
    since_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    uploads_24h = (
        db.query(func.count(AuditEvent.id))
        .filter(AuditEvent.action == "DOCUMENT_UPLOAD", AuditEvent.timestamp >= since_24h)
        .scalar() or 0
    )
    downloads_24h = (
        db.query(func.count(AuditEvent.id))
        .filter(AuditEvent.action == "DOCUMENT_DOWNLOAD_SUCCESS", AuditEvent.timestamp >= since_24h)
        .scalar() or 0
    )
    denied_24h = (
        db.query(func.count(AuditEvent.id))
        .filter(AuditEvent.outcome == "DENIED", AuditEvent.timestamp >= since_24h)
        .scalar() or 0
    )
    permission_changes_24h = (
        db.query(func.count(AuditEvent.id))
        .filter(
            AuditEvent.action.in_(["PERMISSION_GRANT", "PERMISSION_CHANGE", "PERMISSION_REVOKE"]),
            AuditEvent.timestamp >= since_24h,
        )
        .scalar() or 0
    )

    # Cryptographic integrity check
    integrity_status = audit_service.verify_chain_integrity(db)

    # Activity breakdown by day for chart (last 7 days)
    activity_chart = []
    for i in range(6, -1, -1):
        day_start = (datetime.now(timezone.utc) - timedelta(days=i)).replace(hour=0, minute=0, second=0, microsecond=0)
        day_end = day_start + timedelta(days=1)
        day_str = day_start.strftime("%b %d")

        success_count = (
            db.query(func.count(AuditEvent.id))
            .filter(AuditEvent.outcome == "SUCCESS", AuditEvent.timestamp >= day_start, AuditEvent.timestamp < day_end)
            .scalar() or 0
        )
        denied_count = (
            db.query(func.count(AuditEvent.id))
            .filter(AuditEvent.outcome == "DENIED", AuditEvent.timestamp >= day_start, AuditEvent.timestamp < day_end)
            .scalar() or 0
        )
        activity_chart.append({
            "date": day_str,
            "success": success_count,
            "denied": denied_count,
        })

    return {
        "users": {
            "total": total_users,
            "active": active_users,
            "disabled": disabled_users,
        },
        "documents": {
            "total": total_documents,
            "deleted": deleted_documents,
        },
        "activity_24h": {
            "uploads": uploads_24h,
            "downloads": downloads_24h,
            "denied_attempts": denied_24h,
            "permission_changes": permission_changes_24h,
        },
        "integrity": {
            "is_valid": integrity_status["is_valid"],
            "status": integrity_status["status"],
            "total_events": integrity_status["total_events_checked"],
            "last_event_hash": integrity_status["last_event_hash"],
        },
        "activity_chart": activity_chart,
    }


@router.get("/alerts", response_model=List[AuditEventResponse])
def get_security_alerts(
    limit: int = 15,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Returns recent security-relevant events (access denials, blocked disabled logins, etc.)."""
    alerts = (
        db.query(AuditEvent)
        .filter(
            AuditEvent.outcome.in_(["DENIED", "FAILED"])
        )
        .order_by(AuditEvent.sequence_number.desc())
        .limit(limit)
        .all()
    )
    return [AuditEventResponse.model_validate(a) for a in alerts]
