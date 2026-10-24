import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Text, Index
from app.database import Base


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sequence_number = Column(Integer, primary_key=False, nullable=False, unique=True, index=True)
    timestamp = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False, index=True)
    
    actor_id = Column(String(36), nullable=True, index=True)
    actor_email = Column(String(255), nullable=True)
    actor_role = Column(String(32), nullable=True)
    
    action = Column(String(64), nullable=False, index=True)
    target_resource_type = Column(String(32), nullable=False, index=True)  # DOCUMENT, USER, PERMISSION, SYSTEM
    target_resource_id = Column(String(36), nullable=True, index=True)
    outcome = Column(String(16), nullable=False, index=True)  # SUCCESS, DENIED, FAILED
    
    request_correlation_id = Column(String(64), nullable=True, index=True)
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(String(255), nullable=True)
    
    metadata_json = Column(Text, nullable=False, default="{}")
    
    # Hash Chaining
    prev_event_hash = Column(String(64), nullable=False)
    event_hash = Column(String(64), nullable=False, unique=True, index=True)

    __table_args__ = (
        Index("ix_audit_action_outcome", "action", "outcome"),
        Index("ix_audit_target", "target_resource_type", "target_resource_id"),
    )


class AuditCheckpoint(Base):
    __tablename__ = "audit_checkpoints"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sequence_number = Column(Integer, nullable=False, index=True)
    event_hash = Column(String(64), nullable=False)
    signature = Column(String(128), nullable=False)  # HMAC-SHA256
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
