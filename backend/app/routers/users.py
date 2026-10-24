from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.user import UserCreate, UserResponse, UserRoleUpdate, UserStatusUpdate
from app.security.hasher import hash_password
from app.security.auth import get_current_user, require_admin
from app.services.audit import audit_service

router = APIRouter(prefix="/api/users", tags=["Users"])


@router.get("", response_model=List[UserResponse])
def list_users(
    search: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns list of users.
    Used by Document Owners to search recipients when granting permissions,
    and by Administrators to manage user accounts.
    """
    query = db.query(User)
    if search:
        search_fmt = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(search_fmt)) | (User.full_name.ilike(search_fmt))
        )
    users = query.order_by(User.full_name.asc()).all()
    return [UserResponse.model_validate(u) for u in users]


@router.get("/{user_id}", response_model=UserResponse)
def get_user_profile(
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return UserResponse.model_validate(user)


@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    request: Request,
    payload: UserCreate,
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Account creation endpoint.
    If called by non-admin or public, role defaults to 'viewer' and cannot be escalated.
    Only active Admins can assign 'admin' or 'owner' roles during creation.
    """
    existing = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )

    # Privilege escalation defense: non-admins cannot create admin/owner accounts
    assigned_role = payload.role
    if assigned_role in (UserRole.ADMIN.value, UserRole.OWNER.value):
        if not current_user or current_user.role != UserRole.ADMIN.value:
            assigned_role = UserRole.VIEWER.value

    hashed_pw = hash_password(payload.password)
    user = User(
        email=payload.email.lower().strip(),
        hashed_password=hashed_pw,
        full_name=payload.full_name.strip(),
        role=assigned_role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    correlation_id = getattr(request.state, "correlation_id", None)
    audit_service.record_event(
        db=db,
        action="USER_CREATED",
        target_resource_type="USER",
        target_resource_id=user.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        metadata={"created_email": user.email, "role": user.role},
    )

    return UserResponse.model_validate(user)


@router.patch("/{user_id}/role", response_model=UserResponse)
def update_user_role(
    user_id: str,
    payload: UserRoleUpdate,
    request: Request,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin-only: updates user application role."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    old_role = user.role
    user.role = payload.role
    db.commit()
    db.refresh(user)

    correlation_id = getattr(request.state, "correlation_id", None)
    audit_service.record_event(
        db=db,
        action="ADMIN_ROLE_CHANGE",
        target_resource_type="USER",
        target_resource_id=user.id,
        outcome="SUCCESS",
        actor=current_admin,
        request_correlation_id=correlation_id,
        metadata={"target_email": user.email, "old_role": old_role, "new_role": payload.role},
    )

    return UserResponse.model_validate(user)


@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(
    user_id: str,
    payload: UserStatusUpdate,
    request: Request,
    current_admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    """Admin-only: enables or disables a user account (e.g. for compromised accounts)."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    # Prevent admin from disabling their own account
    if user.id == current_admin.id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Administrators cannot disable their own account.",
        )

    old_status = user.is_active
    user.is_active = payload.is_active
    db.commit()
    db.refresh(user)

    action_name = "ADMIN_ACCOUNT_ENABLE" if payload.is_active else "ADMIN_ACCOUNT_DISABLE"
    correlation_id = getattr(request.state, "correlation_id", None)
    audit_service.record_event(
        db=db,
        action=action_name,
        target_resource_type="USER",
        target_resource_id=user.id,
        outcome="SUCCESS",
        actor=current_admin,
        request_correlation_id=correlation_id,
        metadata={"target_email": user.email, "is_active": payload.is_active},
    )

    return UserResponse.model_validate(user)
