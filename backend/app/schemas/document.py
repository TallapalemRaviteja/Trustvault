from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.permission import PermissionResponse


class DocumentVersionResponse(BaseModel):
    id: str
    version_number: int
    original_filename: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    change_summary: Optional[str] = None
    created_by: str
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentResponse(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    category: str
    tags: Optional[str] = None
    sensitivity: str
    owner_id: str
    owner_email: Optional[str] = None
    owner_name: Optional[str] = None
    original_filename: str
    file_size_bytes: int
    mime_type: str
    sha256_hash: str
    current_version: int
    is_deleted: bool
    deleted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    # Effective permission for current querying user (OWNER, EDIT, READ, NONE)
    user_effective_permission: Optional[str] = None

    class Config:
        from_attributes = True


class DocumentDetailResponse(DocumentResponse):
    permissions: List[PermissionResponse] = []
    versions: List[DocumentVersionResponse] = []


class DocumentUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, max_length=1000)
    category: Optional[str] = Field(default=None, max_length=64)
    tags: Optional[str] = Field(default=None, max_length=500)
    sensitivity: Optional[str] = Field(default=None, pattern="^(Confidential|Restricted|Internal|Public)$")


class DocumentListResponse(BaseModel):
    items: List[DocumentResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
