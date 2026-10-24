import os
import shutil
import tempfile
from pathlib import Path
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.config import settings
from app.database import Base, get_db
from app.models.user import User, UserRole
from app.models.document import Document
from app.models.permission import DocumentPermission
from app.models.version import DocumentVersion
from app.models.audit import AuditEvent, AuditCheckpoint
from app.security.hasher import hash_password
from app.security.jwt import create_access_token
from app.storage.storage import file_storage
from app.services.audit import audit_service
from app.main import app

# Create in-memory SQLite database for testing with StaticPool
TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    # Setup temporary private storage directory
    temp_dir = tempfile.mkdtemp(prefix="trustvault_test_storage_")
    old_base_dir = file_storage.base_dir
    file_storage.base_dir = Path(temp_dir).resolve()
    file_storage.base_dir.mkdir(parents=True, exist_ok=True)

    yield

    file_storage.base_dir = old_base_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(scope="function")
def db_session():
    """Provides a fresh database session for each test."""
    Base.metadata.create_all(bind=test_engine)
    db = TestingSessionLocal()
    
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def session_factory():
    """Returns factory to generate new sessions bound to the test engine."""
    return TestingSessionLocal


@pytest.fixture(scope="function")
def seed_actors(db_session):
    """Seeds the 5 mandatory testing accounts plus a disabled account."""
    actors_info = {
        "admin": {
            "email": "admin.a@trustvault.com",
            "password": "Password123!Admin",
            "full_name": "Admin Alice",
            "role": UserRole.ADMIN.value,
            "is_active": True,
        },
        "owner_a": {
            "email": "owner.a@trustvault.com",
            "password": "Password123!OwnerA",
            "full_name": "Owner Arthur",
            "role": UserRole.OWNER.value,
            "is_active": True,
        },
        "owner_b": {
            "email": "owner.b@trustvault.com",
            "password": "Password123!OwnerB",
            "full_name": "Owner Beatrice",
            "role": UserRole.OWNER.value,
            "is_active": True,
        },
        "viewer_a": {
            "email": "viewer.a@trustvault.com",
            "password": "Password123!ViewerA",
            "full_name": "Viewer Charles",
            "role": UserRole.VIEWER.value,
            "is_active": True,
        },
        "viewer_b": {
            "email": "viewer.b@trustvault.com",
            "password": "Password123!ViewerB",
            "full_name": "Viewer Diana",
            "role": UserRole.VIEWER.value,
            "is_active": True,
        },
        "disabled": {
            "email": "disabled.eve@trustvault.com",
            "password": "Password123!Disabled",
            "full_name": "Disabled Eve",
            "role": UserRole.VIEWER.value,
            "is_active": False,
        },
    }

    created = {}
    for key, data in actors_info.items():
        u = User(
            email=data["email"],
            hashed_password=hash_password(data["password"]),
            full_name=data["full_name"],
            role=data["role"],
            is_active=data["is_active"],
        )
        db_session.add(u)
        db_session.commit()
        db_session.refresh(u)
        created[key] = {
            "user": u,
            "raw_password": data["password"],
            "token": create_access_token(data={"sub": u.id, "email": u.email, "role": u.role}),
        }

    return created


@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()
