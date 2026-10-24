from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel


class AuditEventResponse(BaseModel):
    id: str
    sequence_number: int
    timestamp: datetime
    actor_id: Optional[str] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    action: str
    target_resource_type: str
    target_resource_id: Optional[str] = None
    outcome: str
    request_correlation_id: Optional[str] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    metadata_json: str
    prev_event_hash: str
    event_hash: str

    class Config:
        from_attributes = True


class AuditExplorerResponse(BaseModel):
    items: List[AuditEventResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class AuditIntegrityVerificationResponse(BaseModel):
    is_valid: bool
    status: str  # "VERIFIED_INTACT" | "TAMPERED_HASH_MISMATCH" | "SEQUENCE_GAP" | "EMPTY"
    total_events_checked: int
    first_sequence: Optional[int] = None
    last_sequence: Optional[int] = None
    last_event_hash: Optional[str] = None
    issues: List[str] = []
    verified_at: datetime
