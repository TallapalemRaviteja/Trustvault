import pytest
from app.models.user import User


def test_admin_can_access_dashboard_stats(client, seed_actors):
    admin = seed_actors["admin"]
    headers = {"Authorization": f"Bearer {admin['token']}"}

    resp = client.get("/api/admin/stats", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert "users" in data
    assert "documents" in data
    assert "activity_24h" in data
    assert "integrity" in data
    assert data["users"]["total"] >= 6


def test_non_admin_cannot_access_dashboard_stats(client, seed_actors):
    owner_a = seed_actors["owner_a"]
    headers = {"Authorization": f"Bearer {owner_a['token']}"}

    resp = client.get("/api/admin/stats", headers=headers)
    assert resp.status_code == 403


def test_admin_can_disable_and_enable_user_account(client, seed_actors, db_session):
    admin = seed_actors["admin"]
    viewer_b = seed_actors["viewer_b"]
    headers_admin = {"Authorization": f"Bearer {admin['token']}"}

    # Disable Viewer B
    r_disable = client.patch(
        f"/api/users/{viewer_b['user'].id}/status",
        json={"is_active": False},
        headers=headers_admin,
    )
    assert r_disable.status_code == 200
    assert r_disable.json()["is_active"] is False

    # Verify Viewer B is now blocked from logging in
    r_login = client.post(
        "/api/auth/login",
        json={"email": viewer_b["user"].email, "password": viewer_b["raw_password"]},
    )
    assert r_login.status_code == 401
    assert "disabled" in r_login.json()["detail"].lower()

    # Admin re-enables Viewer B
    r_enable = client.patch(
        f"/api/users/{viewer_b['user'].id}/status",
        json={"is_active": True},
        headers=headers_admin,
    )
    assert r_enable.status_code == 200
    assert r_enable.json()["is_active"] is True

    # Viewer B can log in again
    r_login_again = client.post(
        "/api/auth/login",
        json={"email": viewer_b["user"].email, "password": viewer_b["raw_password"]},
    )
    assert r_login_again.status_code == 200


def test_admin_cannot_disable_own_account(client, seed_actors):
    admin = seed_actors["admin"]
    headers_admin = {"Authorization": f"Bearer {admin['token']}"}

    resp = client.patch(
        f"/api/users/{admin['user'].id}/status",
        json={"is_active": False},
        headers=headers_admin,
    )
    assert resp.status_code == 400
    assert "Administrators cannot disable their own account" in resp.json()["detail"]
