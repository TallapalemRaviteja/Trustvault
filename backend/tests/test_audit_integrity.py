import concurrent.futures
import json
import pytest
from app.models.audit import AuditEvent
from app.services.audit import audit_service, GENESIS_PREV_HASH


def test_audit_records_sanitized_against_secrets(db_session, seed_actors):
    actor = seed_actors["owner_a"]
    event = audit_service.record_event(
        db=db_session,
        action="TEST_ACTION",
        target_resource_type="DOCUMENT",
        outcome="SUCCESS",
        actor=actor["user"],
        metadata={
            "filename": "confidential.pdf",
            "password": "SuperSecretPassword123!",
            "access_token": "eyJhbGciOi...",
            "session_secret": "sensitive_data",
            "document_content": "This is secret document body",
        },
    )

    stored_meta = json.loads(event.metadata_json)
    assert stored_meta["filename"] == "confidential.pdf"
    assert stored_meta["password"] == "[REDACTED]"
    assert stored_meta["access_token"] == "[REDACTED]"
    assert stored_meta["session_secret"] == "[REDACTED]"
    assert stored_meta["document_content"] == "[REDACTED]"


def test_audit_chain_verification_succeeds_on_intact_chain(db_session, seed_actors):
    actor = seed_actors["owner_a"]

    # Record 5 sequential events
    for i in range(5):
        audit_service.record_event(
            db=db_session,
            action=f"ACTION_{i}",
            target_resource_type="DOCUMENT",
            outcome="SUCCESS",
            actor=actor["user"],
            metadata={"step": i},
        )

    report = audit_service.verify_chain_integrity(db_session)
    assert report["is_valid"] is True
    assert report["status"] == "VERIFIED_INTACT"
    assert report["total_events_checked"] == 5
    assert len(report["issues"]) == 0


def test_audit_integrity_fails_when_event_modified(db_session, seed_actors):
    actor = seed_actors["owner_a"]

    for i in range(4):
        audit_service.record_event(
            db=db_session,
            action=f"ACTION_{i}",
            target_resource_type="DOCUMENT",
            outcome="SUCCESS",
            actor=actor["user"],
        )

    # Malicious actor directly modifies event #2 in database
    ev = db_session.query(AuditEvent).filter(AuditEvent.sequence_number == 2).first()
    ev.outcome = "DENIED"  # Tamper with stored field
    db_session.commit()

    report = audit_service.verify_chain_integrity(db_session)
    assert report["is_valid"] is False
    assert report["status"] == "TAMPERED_HASH_MISMATCH"
    assert any("Tamper detected at sequence #2" in issue for issue in report["issues"])


def test_audit_integrity_fails_when_event_deleted(db_session, seed_actors):
    actor = seed_actors["owner_a"]

    for i in range(4):
        audit_service.record_event(
            db=db_session,
            action=f"ACTION_{i}",
            target_resource_type="DOCUMENT",
            outcome="SUCCESS",
            actor=actor["user"],
        )

    # Malicious actor deletes event #3
    ev = db_session.query(AuditEvent).filter(AuditEvent.sequence_number == 3).first()
    db_session.delete(ev)
    db_session.commit()

    report = audit_service.verify_chain_integrity(db_session)
    assert report["is_valid"] is False
    assert any("Sequence discontinuity" in issue or "Hash link broken" in issue for issue in report["issues"])


def test_audit_integrity_fails_when_events_reordered(db_session, seed_actors):
    actor = seed_actors["owner_a"]

    for i in range(3):
        audit_service.record_event(
            db=db_session,
            action=f"ACTION_{i}",
            target_resource_type="DOCUMENT",
            outcome="SUCCESS",
            actor=actor["user"],
        )

    # Malicious actor swaps sequence numbers between 1 and 2
    ev1 = db_session.query(AuditEvent).filter(AuditEvent.sequence_number == 1).first()
    ev2 = db_session.query(AuditEvent).filter(AuditEvent.sequence_number == 2).first()
    ev1.sequence_number = 999  # Temporary to bypass unique constraint
    db_session.commit()
    ev2.sequence_number = 1
    db_session.commit()
    ev1.sequence_number = 2
    db_session.commit()

    report = audit_service.verify_chain_integrity(db_session)
    assert report["is_valid"] is False
    assert len(report["issues"]) > 0


def test_concurrent_audit_writes_preserve_chain_integrity(db_session, seed_actors, session_factory):
    actor = seed_actors["owner_a"]

    def write_worker(idx):
        local_db = session_factory()
        try:
            audit_service.record_event(
                db=local_db,
                action=f"CONCURRENT_ACTION_{idx}",
                target_resource_type="SYSTEM",
                outcome="SUCCESS",
                actor_id=actor["user"].id,
                metadata={"thread_idx": idx},
            )
        finally:
            local_db.close()

    # Execute concurrent writes
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        futures = [executor.submit(write_worker, i) for i in range(8)]
        for f in concurrent.futures.as_completed(futures):
            f.result()

    # Re-verify the full chain with main db_session
    report = audit_service.verify_chain_integrity(db_session)
    assert report["is_valid"] is True
    assert report["total_events_checked"] >= 8
    assert len(report["issues"]) == 0
