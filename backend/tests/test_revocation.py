import pytest
from app.models.document import Document
from app.models.permission import DocumentPermission
from app.models.audit import AuditEvent
from app.storage.storage import file_storage


def test_immediate_permission_revocation_lifecycle(client, seed_actors, db_session):
    owner_a = seed_actors["owner_a"]
    viewer_a = seed_actors["viewer_a"]

    # 1. Owner A creates confidential document
    content = b"%PDF-1.4 Strictly Confidential Project Roadmaps"
    key, sha, size = file_storage.save(content)
    doc = Document(
        title="Project Roadmap",
        category="Roadmap",
        sensitivity="Confidential",
        owner_id=owner_a["user"].id,
        storage_key=key,
        original_filename="roadmap.pdf",
        file_size_bytes=size,
        mime_type="application/pdf",
        sha256_hash=sha,
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    headers_owner = {"Authorization": f"Bearer {owner_a['token']}"}
    headers_viewer = {"Authorization": f"Bearer {viewer_a['token']}"}

    # Verify Viewer A initially cannot access
    r_init = client.get(f"/api/documents/{doc.id}", headers=headers_viewer)
    assert r_init.status_code == 403

    # 2. Owner A grants READ access to Viewer A
    r_grant = client.post(
        f"/api/documents/{doc.id}/permissions",
        json={"user_id": viewer_a["user"].id, "permission": "READ"},
        headers=headers_owner,
    )
    assert r_grant.status_code == 201
    perm_id = r_grant.json()["id"]

    # 3. Viewer A now successfully views metadata and downloads
    r_view = client.get(f"/api/documents/{doc.id}", headers=headers_viewer)
    assert r_view.status_code == 200
    assert r_view.json()["user_effective_permission"] == "READ"

    r_download = client.get(f"/api/documents/{doc.id}/download", headers=headers_viewer)
    assert r_download.status_code == 200
    assert r_download.content == content

    # 4. Owner A revokes access immediately
    r_revoke = client.delete(
        f"/api/documents/{doc.id}/permissions/{perm_id}",
        headers=headers_owner,
    )
    assert r_revoke.status_code == 200

    # 5. Viewer A's immediate subsequent requests are strictly DENIED
    r_next_view = client.get(f"/api/documents/{doc.id}", headers=headers_viewer)
    assert r_next_view.status_code == 403

    r_next_download = client.get(f"/api/documents/{doc.id}/download", headers=headers_viewer)
    assert r_next_download.status_code == 403

    # Verify audit event for revocation recorded
    revocation_audit = (
        db_session.query(AuditEvent)
        .filter(AuditEvent.action == "PERMISSION_REVOKE", AuditEvent.target_resource_id == perm_id)
        .first()
    )
    assert revocation_audit is not None
    assert revocation_audit.outcome == "SUCCESS"

    # Verify subsequent download denial recorded in audit trail
    denial_audit = (
        db_session.query(AuditEvent)
        .filter(
            AuditEvent.action == "DOCUMENT_DOWNLOAD_DENIED",
            AuditEvent.actor_id == viewer_a["user"].id,
            AuditEvent.target_resource_id == doc.id,
        )
        .first()
    )
    assert denial_audit is not None
