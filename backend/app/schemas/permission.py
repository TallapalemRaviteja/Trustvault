from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class PermissionGrantRequest(BaseModel):
    user_id: str = Field(description="UUID of recipient user to grant access to")
    permission: str = Field(pattern="^(READ|EDIT)$", description="Permission type: READ or EDIT")


class PermissionUpdateRequest(BaseModel):
    permission: str = Field(pattern="^(READ|EDIT)$", description="New permission type: READ or EDIT")


class PermissionResponse(BaseModel):
    id: str
    document_id: str
    user_id: str
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None
    permission: str
    granted_by: str
    granter_email: Optional[str] = None
    granted_at: datetime
    updated_at: datetime
    revoked_at: Optional[datetime] = None

    class Config:
        from_attributes = True
