import io
import pytest
from app.models.document import Document
from app.models.version import DocumentVersion
from app.models.permission import DocumentPermission
from app.models.audit import AuditEvent
from app.storage.storage import file_storage


def create_sample_doc(db_session, owner, title="Confidential Plan"):
    content = b"%PDF-1.4 Secret Top Secret Plan for TrustVault"
    key, sha, size = file_storage.save(content)
    doc = Document(
        title=title,
        description="Top secret internal document",
        category="Executive",
        sensitivity="Confidential",
        owner_id=owner["user"].id,
        storage_key=key,
        original_filename="secret_plan.pdf",
        file_size_bytes=size,
        mime_type="application/pdf",
        sha256_hash=sha,
        current_version=1,
    )
    db_session.add(doc)
    db_session.commit()
    db_session.refresh(doc)

    v1 = DocumentVersion(
        document_id=doc.id,
        version_number=1,
        storage_key=key,
        original_filename="secret_plan.pdf",
        file_size_bytes=size,
        mime_type="application/pdf",
        sha256_hash=sha,
        change_summary="Initial upload",
        created_by=owner["user"].id,
    )
    db_session.add(v1)
    db_session.commit()
    return doc, content


def test_owner_can_access_own_document(client, seed_actors, db_session):
    owner_a = seed_actors["owner_a"]
    doc, _ = create_sample_doc(db_session, owner_a)

    headers = {"Authorization": f"Bearer {owner_a['token']}"}
    resp = client.get(f"/api/documents/{doc.id}", headers=headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["id"] == doc.id
    assert data["user_effective_permission"] == "OWNER"


def test_owner_b_cannot_access_owner_a_private_document(client, seed_actors, db_session):
    owner_a = seed_actors["owner_a"]
    owner_b = seed_actors["owner_b"]
    doc, _ = create_sample_doc(db_session, owner_a)

    headers_b = {"Authorization": f"Bearer {owner_b['token']}"}
    
    # Metadata view
    resp_view = client.get(f"/api/documents/{doc.id}", headers=headers_b)
    assert resp_view.status_code == 403

    # Direct download attempt
    resp_dl = client.get(f"/api/documents/{doc.id}/download", headers=headers_b)
    assert resp_dl.status_code == 403

    # Verify audit denial recorded
    denial = (
        db_session.query(AuditEvent)
        .filter(
            AuditEvent.action == "DOCUMENT_DOWNLOAD_DENIED",
            AuditEvent.actor_id == owner_b["user"].id,
            AuditEvent.outcome == "DENIED",
        )
        .first()
    )
    assert denial is not None


def test_viewer_without_permission_cannot_access_or_download(client, seed_actors, db_session):
    owner_a = seed_actors["owner_a"]
    viewer_a = seed_actors["viewer_a"]
    doc, _ = create_sample_doc(db_session, owner_a)

    headers_viewer = {"Authorization": f"Bearer {viewer_a['token']}"}

    # Metadata attempt
    resp_meta = client.get(f"/api/documents/{doc.id}", headers=headers_viewer)
    assert resp_meta.status_code == 403

    # Download attempt
    resp_dl = client.get(f"/api/documents/{doc.id}/download", headers=headers_viewer)
    assert resp_dl.status_code == 403

    # Version history attempt
    resp_ver = client.get(f"/api/documents/{doc.id}/versions", headers=headers_viewer)
    assert resp_ver.status_code == 403


def test_search_results_exclude_unauthorized_documents(client, seed_actors, db_session):
    owner_a = seed_actors["owner_a"]
    viewer_a = seed_actors["viewer_a"]
    create_sample_doc(db_session, owner_a, title="Quarterly Alpha Report")

    headers_viewer = {"Authorization": f"Bearer {viewer_a['token']}"}
    resp = client.get("/api/documents?search=Alpha", headers=headers_viewer)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert len(data["items"]) == 0


def test_viewer_cannot_edit_read_only_document(client, seed_actors, db_session):
    owner_a = seed_actors["owner_a"]
    viewer_a = seed_actors["viewer_a"]
    doc, _ = create_sample_doc(db_session, owner_a)

    # Grant READ permission
    perm = DocumentPermission(
        document_id=doc.id,
        user_id=viewer_a["user"].id,
        permission="READ",
        granted_by=owner_a["user"].id,
    )
    db_session.add(perm)
    db_session.commit()

    headers_viewer = {"Authorization": f"Bearer {viewer_a['token']}"}

    # Read should succeed
    resp_read = client.get(f"/api/documents/{doc.id}", headers=headers_viewer)
    assert resp_read.status_code == 200
    assert resp_read.json()["user_effective_permission"] == "READ"

    # Edit metadata attempt must be denied
    resp_edit = client.patch(
        f"/api/documents/{doc.id}",
        json={"title": "Hacked Title"},
        headers=headers_viewer,
    )
    assert resp_edit.status_code == 403

    # Replace content attempt must be denied
    files = {"file": ("new.pdf", b"%PDF-1.4 updated content", "application/pdf")}
    resp_replace = client.post(
        f"/api/documents/{doc.id}/replace",
        files=files,
        headers=headers_viewer,
    )
    assert resp_replace.status_code == 403


def test_unauthorized_user_cannot_delete_document(client, seed_actors, db_session):
    owner_a = seed_actors["owner_a"]
    viewer_a = seed_actors["viewer_a"]
    doc, _ = create_sample_doc(db_session, owner_a)

    headers_viewer = {"Authorization": f"Bearer {viewer_a['token']}"}
    resp_del = client.delete(f"/api/documents/{doc.id}", headers=headers_viewer)
    assert resp_del.status_code == 403

    # Document must still be present
    db_doc = db_session.query(Document).filter(Document.id == doc.id).first()
    assert db_doc.is_deleted is False


def test_unauthorized_user_cannot_grant_self_permissions(client, seed_actors, db_session):
    owner_a = seed_actors["owner_a"]
    viewer_a = seed_actors["viewer_a"]
    doc, _ = create_sample_doc(db_session, owner_a)

    headers_viewer = {"Authorization": f"Bearer {viewer_a['token']}"}
    resp = client.post(
        f"/api/documents/{doc.id}/permissions",
        json={"user_id": viewer_a["user"].id, "permission": "EDIT"},
        headers=headers_viewer,
    )
    assert resp.status_code == 403


def test_viewer_cannot_escalate_role_to_admin(client, seed_actors, db_session):
    viewer_a = seed_actors["viewer_a"]
    headers_viewer = {"Authorization": f"Bearer {viewer_a['token']}"}

    resp = client.patch(
        f"/api/users/{viewer_a['user'].id}/role",
        json={"role": "admin"},
        headers=headers_viewer,
    )
    assert resp.status_code == 403

    # Verify database role is unchanged
    refreshed_user = db_session.query(DocumentPermission).filter(DocumentPermission.user_id == viewer_a["user"].id).first()
    assert viewer_a["user"].role == "viewer"


def test_administrator_cannot_automatically_download_confidential_document(client, seed_actors, db_session):
    owner_a = seed_actors["owner_a"]
    admin = seed_actors["admin"]
    doc, _ = create_sample_doc(db_session, owner_a)

    headers_admin = {"Authorization": f"Bearer {admin['token']}"}

    # Direct download attempt by Admin must be denied (least privilege content isolation)
    resp_dl = client.get(f"/api/documents/{doc.id}/download", headers=headers_admin)
    assert resp_dl.status_code == 403
    assert "READ permission" in resp_dl.json()["detail"]


def test_unauthorized_user_cannot_read_protected_audit_history(client, seed_actors, db_session):
    viewer_a = seed_actors["viewer_a"]
    headers_viewer = {"Authorization": f"Bearer {viewer_a['token']}"}

    resp = client.get("/api/audit", headers=headers_viewer)
    assert resp.status_code == 403
