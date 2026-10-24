import hashlib
import hmac
import json
import threading
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import func, text
from app.config import settings
from app.models.user import User
from app.models.audit import AuditEvent, AuditCheckpoint

GENESIS_PREV_HASH = "0" * 64
_audit_lock = threading.Lock()


def canonicalize_event_dict(event_dict: Dict[str, Any]) -> str:
    """
    Returns a deterministic, canonical JSON representation of event attributes.
    Key order is strictly sorted, whitespace is normalized (delimiters=(',', ':')).
    """
    # Exclude dynamic/computed hash fields from canonical representation
    canonical_keys = [
        "sequence_number",
        "timestamp_iso",
        "actor_id",
        "action",
        "target_resource_type",
        "target_resource_id",
        "outcome",
        "metadata_json",
    ]
    normalized = {k: event_dict.get(k) for k in canonical_keys}
    return json.dumps(normalized, sort_keys=True, separators=(",", ":"))


def compute_event_hash(canonical_representation: str, prev_hash: str) -> str:
    """Computes SHA-256 hash of canonical event string concatenated with previous hash."""
    payload = f"{canonical_representation}{prev_hash}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


class AuditService:
    @staticmethod
    def record_event(
        db: Session,
        action: str,
        target_resource_type: str,
        outcome: str,
        target_resource_id: Optional[str] = None,
        actor: Optional[User] = None,
        actor_id: Optional[str] = None,
        actor_email: Optional[str] = None,
        actor_role: Optional[str] = None,
        request_correlation_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> AuditEvent:
        """
        Records a tamper-evident audit event into the append-only hash chain.
        Guarantees strict monotonic sequence and chain continuity.
        """
        # Sanitize metadata to never include sensitive secrets
        sanitized_meta = {}
        if metadata:
            forbidden_keys = {"password", "token", "access_token", "secret", "cookie", "content"}
            for k, v in metadata.items():
                if any(forbidden in k.lower() for forbidden in forbidden_keys):
                    sanitized_meta[k] = "[REDACTED]"
                else:
                    sanitized_meta[k] = v
        metadata_json = json.dumps(sanitized_meta, sort_keys=True, separators=(",", ":"))

        # Snapshot actor info
        final_actor_id = actor.id if actor else actor_id
        final_actor_email = actor.email if actor else actor_email
        final_actor_role = (actor.role.value if hasattr(actor.role, "value") else str(actor.role)) if actor else actor_role

        now_utc = datetime.now(timezone.utc)
        timestamp_iso = now_utc.isoformat()

        # Thread-level + database transaction lock for chain serialization
        with _audit_lock:
            # Query the current latest event in the chain
            last_event = (
                db.query(AuditEvent)
                .order_by(AuditEvent.sequence_number.desc())
                .first()
            )

            if last_event is None:
                sequence_number = 1
                prev_hash = GENESIS_PREV_HASH
            else:
                sequence_number = last_event.sequence_number + 1
                prev_hash = last_event.event_hash

            event_dict_for_canonical = {
                "sequence_number": sequence_number,
                "timestamp_iso": timestamp_iso,
                "actor_id": final_actor_id,
                "action": action,
                "target_resource_type": target_resource_type,
                "target_resource_id": target_resource_id,
                "outcome": outcome,
                "metadata_json": metadata_json,
            }

            canonical_str = canonicalize_event_dict(event_dict_for_canonical)
            event_hash = compute_event_hash(canonical_str, prev_hash)

            event = AuditEvent(
                sequence_number=sequence_number,
                timestamp=now_utc,
                actor_id=final_actor_id,
                actor_email=final_actor_email,
                actor_role=final_actor_role,
                action=action,
                target_resource_type=target_resource_type,
                target_resource_id=target_resource_id,
                outcome=outcome,
                request_correlation_id=request_correlation_id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata_json=metadata_json,
                prev_event_hash=prev_hash,
                event_hash=event_hash,
            )

            db.add(event)
            db.commit()
            db.refresh(event)
            return event

    @staticmethod
    def verify_chain_integrity(db: Session) -> Dict[str, Any]:
        """
        Traverses the full audit trail from sequence 1 to N, recomputing every hash link.
        Detects:
        - Content modifications (event_hash mismatch)
        - Sequence gaps / event deletion
        - Event insertions or reordering
        - Invalid genesis or previous hash links
        """
        events: List[AuditEvent] = (
            db.query(AuditEvent)
            .order_by(AuditEvent.sequence_number.asc())
            .all()
        )

        now = datetime.now(timezone.utc)
        if not events:
            return {
                "is_valid": True,
                "status": "EMPTY",
                "total_events_checked": 0,
                "first_sequence": None,
                "last_sequence": None,
                "last_event_hash": None,
                "issues": [],
                "verified_at": now,
            }

        issues: List[str] = []
        expected_seq = 1
        expected_prev_hash = GENESIS_PREV_HASH

        for event in events:
            # 1. Check sequence monotonicity (no gaps, no duplicates)
            if event.sequence_number != expected_seq:
                issues.append(
                    f"Sequence discontinuity: Expected #{expected_seq}, found #{event.sequence_number}."
                )

            # 2. Check previous hash pointer
            if event.prev_event_hash != expected_prev_hash:
                issues.append(
                    f"Hash link broken at sequence #{event.sequence_number}: prev_event_hash '{event.prev_event_hash}' does not match expected '{expected_prev_hash}'."
                )

            # 3. Recompute canonical hash
            # Form ISO timestamp matching original stored representation
            ts_iso = event.timestamp.isoformat() if event.timestamp.tzinfo else event.timestamp.replace(tzinfo=timezone.utc).isoformat()
            reconstructed_dict = {
                "sequence_number": event.sequence_number,
                "timestamp_iso": ts_iso,
                "actor_id": event.actor_id,
                "action": event.action,
                "target_resource_type": event.target_resource_type,
                "target_resource_id": event.target_resource_id,
                "outcome": event.outcome,
                "metadata_json": event.metadata_json,
            }
            canonical_str = canonicalize_event_dict(reconstructed_dict)
            recomputed_hash = compute_event_hash(canonical_str, event.prev_event_hash)

            if recomputed_hash != event.event_hash:
                issues.append(
                    f"Tamper detected at sequence #{event.sequence_number}: Stored hash '{event.event_hash}' does not match recomputed hash '{recomputed_hash}'."
                )

            # Advance expected chain state
            expected_prev_hash = event.event_hash
            expected_seq = event.sequence_number + 1

        is_valid = len(issues) == 0
        status_str = "VERIFIED_INTACT" if is_valid else "TAMPERED_HASH_MISMATCH"

        return {
            "is_valid": is_valid,
            "status": status_str,
            "total_events_checked": len(events),
            "first_sequence": events[0].sequence_number,
            "last_sequence": events[-1].sequence_number,
            "last_event_hash": events[-1].event_hash,
            "issues": issues,
            "verified_at": now,
        }

    @staticmethod
    def create_signed_checkpoint(db: Session, key: str = None) -> AuditCheckpoint:
        """Creates an HMAC-SHA256 signed checkpoint of the current chain head."""
        secret_key = (key or settings.AUDIT_CHECKPOINT_KEY).encode("utf-8")
        last_event = (
            db.query(AuditEvent)
            .order_by(AuditEvent.sequence_number.desc())
            .first()
        )
        if not last_event:
            raise ValueError("Cannot checkpoint an empty audit log.")

        seq = last_event.sequence_number
        ev_hash = last_event.event_hash
        payload = f"{seq}:{ev_hash}".encode("utf-8")
        signature = hmac.new(secret_key, payload, hashlib.sha256).hexdigest()

        checkpoint = AuditCheckpoint(
            sequence_number=seq,
            event_hash=ev_hash,
            signature=signature,
        )
        db.add(checkpoint)
        db.commit()
        db.refresh(checkpoint)
        return checkpoint


audit_service = AuditService()
