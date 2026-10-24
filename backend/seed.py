import sys
import os
from datetime import datetime, timezone
from app.database import SessionLocal, Base, engine
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.version import DocumentVersion
from app.models.permission import DocumentPermission
from app.models.audit import AuditEvent
from app.security.hasher import hash_password
from app.storage.storage import file_storage
from app.services.audit import audit_service


def seed_database():
    print("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if users already seeded
        if db.query(User).count() > 0:
            print("Database already contains users. Skipping seed.")
            return

        print("Creating seed accounts...")
        users_data = [
            {
                "email": "admin@trustvault.com",
                "password": "AdminPassword123!",
                "full_name": "Security Administrator",
                "role": UserRole.ADMIN.value,
                "is_active": True,
            },
            {
                "email": "alice@trustvault.com",
                "password": "AlicePassword123!",
                "full_name": "Alice Richardson (Owner A)",
                "role": UserRole.OWNER.value,
                "is_active": True,
            },
            {
                "email": "bob@trustvault.com",
                "password": "BobPassword123!",
                "full_name": "Bob Martinez (Owner B)",
                "role": UserRole.OWNER.value,
                "is_active": True,
            },
            {
                "email": "carol@trustvault.com",
                "password": "CarolPassword123!",
                "full_name": "Carol Danvers (Viewer A)",
                "role": UserRole.VIEWER.value,
                "is_active": True,
            },
            {
                "email": "dave@trustvault.com",
                "password": "DavePassword123!",
                "full_name": "Dave Bowman (Viewer B)",
                "role": UserRole.VIEWER.value,
                "is_active": True,
            },
            {
                "email": "eve.disabled@trustvault.com",
                "password": "EvePassword123!",
                "full_name": "Eve Compromised (Disabled)",
                "role": UserRole.VIEWER.value,
                "is_active": False,
            },
        ]

        created_users = {}
        for u in users_data:
            user = User(
                email=u["email"],
                hashed_password=hash_password(u["password"]),
                full_name=u["full_name"],
                role=u["role"],
                is_active=u["is_active"],
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            created_users[u["email"]] = user
            
            # Record audit event for user creation
            audit_service.record_event(
                db=db,
                action="SEED_USER_CREATED",
                target_resource_type="USER",
                target_resource_id=user.id,
                outcome="SUCCESS",
                actor_email="system@trustvault.com",
                actor_role="SYSTEM",
                metadata={"email": user.email, "role": user.role, "is_active": user.is_active},
            )
            print(f"Created user: {user.email} [{user.role}]")

        alice = created_users["alice@trustvault.com"]
        bob = created_users["bob@trustvault.com"]
        carol = created_users["carol@trustvault.com"]

        # Create Alice's private documents
        print("Uploading seed confidential documents for Alice...")
        doc1_content = b"%PDF-1.5 Q4 Confidential Financial Audit Report for TrustVault Inc.\nTotal Revenue: $14.2M\nNet Margin: 28%\nApproved by CFO."
        k1, h1, s1 = file_storage.save(doc1_content)
        doc1 = Document(
            title="Q4 2026 Financial Audit Report",
            description="Audited quarterly financials and executive compensation schedules.",
            category="Financial",
            tags="financial,audit,q4,confidential",
            sensitivity="Confidential",
            owner_id=alice.id,
            storage_key=k1,
            original_filename="Q4_2026_Financial_Audit.pdf",
            file_size_bytes=s1,
            mime_type="application/pdf",
            sha256_hash=h1,
            current_version=1,
        )
        db.add(doc1)
        db.commit()
        db.refresh(doc1)

        v1 = DocumentVersion(
            document_id=doc1.id,
            version_number=1,
            storage_key=k1,
            original_filename="Q4_2026_Financial_Audit.pdf",
            file_size_bytes=s1,
            mime_type="application/pdf",
            sha256_hash=h1,
            change_summary="Initial upload of Q4 financials",
            created_by=alice.id,
        )
        db.add(v1)
        db.commit()

        audit_service.record_event(
            db=db,
            action="DOCUMENT_UPLOAD",
            target_resource_type="DOCUMENT",
            target_resource_id=doc1.id,
            outcome="SUCCESS",
            actor=alice,
            metadata={"title": doc1.title, "filename": doc1.original_filename, "sha256": h1},
        )

        # Grant Carol READ permission on Alice's doc1
        grant1 = DocumentPermission(
            document_id=doc1.id,
            user_id=carol.id,
            permission="READ",
            granted_by=alice.id,
            granted_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(grant1)
        db.commit()
        db.refresh(grant1)

        audit_service.record_event(
            db=db,
            action="PERMISSION_GRANT",
            target_resource_type="PERMISSION",
            target_resource_id=grant1.id,
            outcome="SUCCESS",
            actor=alice,
            metadata={"recipient_email": carol.email, "permission": "READ", "document_id": doc1.id},
        )
        print(f"Granted READ permission on '{doc1.title}' to {carol.email}")

        # Create Bob's private document (Alice and Carol cannot access)
        print("Uploading seed confidential documents for Bob...")
        doc2_content = b"%PDF-1.5 Project Aegis: Quantum Resistance Infrastructure Specifications.\nClearance Level: Top Secret."
        k2, h2, s2 = file_storage.save(doc2_content)
        doc2 = Document(
            title="Project Aegis Quantum Architecture",
            description="Proprietary encryption protocols and zero-trust key management architecture.",
            category="Engineering",
            tags="engineering,cryptography,top-secret",
            sensitivity="Restricted",
            owner_id=bob.id,
            storage_key=k2,
            original_filename="Project_Aegis_Architecture.pdf",
            file_size_bytes=s2,
            mime_type="application/pdf",
            sha256_hash=h2,
            current_version=1,
        )
        db.add(doc2)
        db.commit()
        db.refresh(doc2)

        v2 = DocumentVersion(
            document_id=doc2.id,
            version_number=1,
            storage_key=k2,
            original_filename="Project_Aegis_Architecture.pdf",
            file_size_bytes=s2,
            mime_type="application/pdf",
            sha256_hash=h2,
            change_summary="Initial architecture draft",
            created_by=bob.id,
        )
        db.add(v2)
        db.commit()

        audit_service.record_event(
            db=db,
            action="DOCUMENT_UPLOAD",
            target_resource_type="DOCUMENT",
            target_resource_id=doc2.id,
            outcome="SUCCESS",
            actor=bob,
            metadata={"title": doc2.title, "filename": doc2.original_filename, "sha256": h2},
        )
        print(f"Uploaded Bob's private document: '{doc2.title}'")

        # Verify initial audit trail
        integrity = audit_service.verify_chain_integrity(db)
        print("Audit chain integrity check:", integrity["status"], f"(Checked {integrity['total_events_checked']} events)")

        print("Database seed completed successfully!")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
