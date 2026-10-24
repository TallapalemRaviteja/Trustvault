import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.database import Base, engine
from app.security.headers import SecurityHeadersMiddleware
from app.routers import auth, users, documents, permissions, audit, admin, system
from app.storage.storage import file_storage


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)
    # Ensure private storage directory exists
    file_storage.base_dir.mkdir(parents=True, exist_ok=True)
    yield


app = FastAPI(
    title="TrustVault API",
    description="Secure Document Sharing Platform with Tamper-Evident Audit Trails",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# 1. Hardened Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition", "X-Content-SHA256", "X-Request-ID"],
)

# 3. Validation Exception Handler (Sanitized output)
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": "Request validation failed", "errors": exc.errors()},
    )

# 4. Include Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(permissions.router)
app.include_router(audit.router)
app.include_router(admin.router)
app.include_router(system.router)


@app.get("/")
def root():
    return {
        "name": "TrustVault Secure Document Sharing Platform",
        "version": "1.0.0",
        "documentation": "/docs",
        "status": "active",
    }
