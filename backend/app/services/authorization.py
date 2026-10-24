from typing import Optional, Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.permission import DocumentPermission, PermissionType


class AuthorizationService:
    @staticmethod
    def get_effective_permission(db: Session, user: User, document: Document) -> Optional[str]:
        """
        Determines the user's current effective permission for a document.
        Returns: 'OWNER', 'EDIT', 'READ', or None.
        Enforces live database check: revoked_at IS NULL.
        """
        if not user or not user.is_active:
            return None

        # 1. Owner has full OWNER rights
        if document.owner_id == user.id:
            return "OWNER"

        # 2. Check active explicit permission grant
        # Note: revoked_at IS NULL ensures immediate revocation
        grant = (
            db.query(DocumentPermission)
            .filter(
                DocumentPermission.document_id == document.id,
                DocumentPermission.user_id == user.id,
                DocumentPermission.revoked_at.is_(None),
            )
            .first()
        )

        if grant:
            return grant.permission  # "READ" or "EDIT"

        # 3. Administrators do NOT automatically gain confidential document content access.
        # Least privilege: Admins manage accounts and audits, but are not implicit document readers.
        return None

    @classmethod
    def can_read(cls, db: Session, user: User, document: Document) -> Tuple[bool, str]:
        """Checks if the user can read metadata and download the document."""
        if document.is_deleted and document.owner_id != user.id:
            return False, "Document has been deleted."

        perm = cls.get_effective_permission(db, user, document)
        if perm in ("OWNER", "EDIT", "READ"):
            return True, "Authorized"
        return False, "You do not have READ permission for this document."

    @classmethod
    def can_edit(cls, db: Session, user: User, document: Document) -> Tuple[bool, str]:
        """Checks if the user can modify metadata or replace content."""
        if document.is_deleted:
            return False, "Cannot edit a deleted document."

        perm = cls.get_effective_permission(db, user, document)
        if perm in ("OWNER", "EDIT"):
            return True, "Authorized"
        return False, "You do not have EDIT permission for this document."

    @classmethod
    def can_delete(cls, db: Session, user: User, document: Document) -> Tuple[bool, str]:
        """Only the document owner can delete the document."""
        if document.owner_id == user.id:
            return True, "Authorized"
        return False, "Only the document owner can delete this document."

    @classmethod
    def can_manage_permissions(cls, db: Session, user: User, document: Document) -> Tuple[bool, str]:
        """Only the document owner can grant or revoke permissions."""
        if document.owner_id == user.id:
            return True, "Authorized"
        return False, "Only the document owner can manage permissions."

    @classmethod
    def enforce_read(cls, db: Session, user: User, document: Document):
        allowed, reason = cls.can_read(db, user, document)
        if not allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    @classmethod
    def enforce_edit(cls, db: Session, user: User, document: Document):
        allowed, reason = cls.can_edit(db, user, document)
        if not allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    @classmethod
    def enforce_delete(cls, db: Session, user: User, document: Document):
        allowed, reason = cls.can_delete(db, user, document)
        if not allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)

    @classmethod
    def enforce_manage_permissions(cls, db: Session, user: User, document: Document):
        allowed, reason = cls.can_manage_permissions(db, user, document)
        if not allowed:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=reason)


auth_service = AuthorizationService()
