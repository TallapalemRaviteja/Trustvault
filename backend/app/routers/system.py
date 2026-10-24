from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.config import settings
from app.storage.storage import file_storage

router = APIRouter(prefix="/api/system", tags=["System"])


@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint probing database connectivity and private storage."""
    db_status = "healthy"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    storage_status = "accessible" if file_storage.base_dir.is_dir() else "inaccessible"

    overall_status = "ok" if db_status == "healthy" and storage_status == "accessible" else "degraded"

    return {
        "status": overall_status,
        "environment": settings.ENVIRONMENT,
        "database": db_status,
        "storage": storage_status,
    }
