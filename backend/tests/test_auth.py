import pytest
from app.models.audit import AuditEvent


def test_login_successful(client, seed_actors, db_session):
    actor = seed_actors["owner_a"]
    resp = client.post(
        "/api/auth/login",
        json={"email": actor["user"].email, "password": actor["raw_password"]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert data["user"]["email"] == actor["user"].email
    assert data["user"]["role"] == "owner"

    # Verify audit event recorded
    audit = db_session.query(AuditEvent).filter(AuditEvent.action == "AUTH_LOGIN_SUCCESS").first()
    assert audit is not None
    assert audit.actor_id == actor["user"].id
    assert audit.outcome == "SUCCESS"


def test_login_invalid_password_rejected(client, seed_actors, db_session):
    actor = seed_actors["owner_a"]
    resp = client.post(
        "/api/auth/login",
        json={"email": actor["user"].email, "password": "WrongPassword123!"},
    )
    assert resp.status_code == 401
    assert "Incorrect email or password" in resp.json()["detail"]

    # Verify audit denial recorded
    audit = db_session.query(AuditEvent).filter(AuditEvent.action == "AUTH_LOGIN_FAILED").first()
    assert audit is not None
    assert audit.outcome == "FAILED"


def test_login_nonexistent_email_rejected(client, db_session):
    resp = client.post(
        "/api/auth/login",
        json={"email": "nobody@nowhere.com", "password": "SomePassword123!"},
    )
    assert resp.status_code == 401
    assert "Incorrect email or password" in resp.json()["detail"]


def test_disabled_account_cannot_login(client, seed_actors, db_session):
    disabled_actor = seed_actors["disabled"]
    resp = client.post(
        "/api/auth/login",
        json={"email": disabled_actor["user"].email, "password": disabled_actor["raw_password"]},
    )
    assert resp.status_code == 401
    assert "disabled" in resp.json()["detail"].lower()

    # Verify audit denial
    audit = db_session.query(AuditEvent).filter(AuditEvent.action == "AUTH_LOGIN_BLOCKED_DISABLED").first()
    assert audit is not None
    assert audit.outcome == "DENIED"


def test_disabled_account_bearer_token_blocked(client, seed_actors):
    disabled_actor = seed_actors["disabled"]
    headers = {"Authorization": f"Bearer {disabled_actor['token']}"}
    
    # Attempt to access protected /api/auth/me
    resp = client.get("/api/auth/me", headers=headers)
    assert resp.status_code == 401
    assert "disabled" in resp.json()["detail"].lower()

    # Attempt to list documents
    resp = client.get("/api/documents", headers=headers)
    assert resp.status_code == 401


def test_unauthenticated_request_rejected(client):
    resp = client.get("/api/documents")
    assert resp.status_code == 401
    assert "Authentication required" in resp.json()["detail"]
