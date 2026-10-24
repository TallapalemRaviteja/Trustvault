from fastapi import APIRouter, Depends, HTTPException, status, Request, Response
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.security.hasher import verify_password
from app.security.jwt import create_access_token
from app.security.auth import get_current_user
from app.security.rate_limiter import check_rate_limit
from app.services.audit import audit_service
from app.config import settings

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(
    request: Request,
    response: Response,
    payload: LoginRequest,
    db: Session = Depends(get_db),
):
    # Enforce strict brute-force rate limit on login attempts
    check_rate_limit(request, key_prefix="login", max_requests=settings.RATE_LIMIT_LOGIN_PER_MINUTE)

    correlation_id = getattr(request.state, "correlation_id", None)
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    user = db.query(User).filter(User.email == payload.email.lower().strip()).first()

    # Generic invalid credentials message to prevent account enumeration
    if not user or not verify_password(payload.password, user.hashed_password):
        audit_service.record_event(
            db=db,
            action="AUTH_LOGIN_FAILED",
            target_resource_type="USER",
            outcome="FAILED",
            actor_email=payload.email,
            request_correlation_id=correlation_id,
            ip_address=client_ip,
            user_agent=user_agent,
            metadata={"attempted_email": payload.email, "reason": "Invalid credentials"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Check if account is disabled
    if not user.is_active:
        audit_service.record_event(
            db=db,
            action="AUTH_LOGIN_BLOCKED_DISABLED",
            target_resource_type="USER",
            target_resource_id=user.id,
            outcome="DENIED",
            actor=user,
            request_correlation_id=correlation_id,
            ip_address=client_ip,
            user_agent=user_agent,
            metadata={"reason": "Account is disabled"},
        )
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your account has been disabled. Please contact an administrator.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Generate JWT
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "role": user.role}
    )

    # Set secure HttpOnly cookie for cookie-based sessions
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    # Record login audit event
    audit_service.record_event(
        db=db,
        action="AUTH_LOGIN_SUCCESS",
        target_resource_type="USER",
        target_resource_id=user.id,
        outcome="SUCCESS",
        actor=user,
        request_correlation_id=correlation_id,
        ip_address=client_ip,
        user_agent=user_agent,
        metadata={"role": user.role},
    )

    return TokenResponse(
        access_token=access_token,
        user=UserResponse.model_validate(user),
    )


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    response.delete_cookie(key="access_token")
    
    correlation_id = getattr(request.state, "correlation_id", None)
    client_ip = request.client.host if request.client else "unknown"
    user_agent = request.headers.get("user-agent", "unknown")

    audit_service.record_event(
        db=db,
        action="AUTH_LOGOUT",
        target_resource_type="USER",
        target_resource_id=current_user.id,
        outcome="SUCCESS",
        actor=current_user,
        request_correlation_id=correlation_id,
        ip_address=client_ip,
        user_agent=user_agent,
    )

    return {"message": "Successfully logged out."}


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse.model_validate(current_user)
