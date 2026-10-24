import os
from pathlib import Path
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from app.config import settings
from app.database import Base, engine
from app.security.headers import SecurityHeadersMiddleware
from app.routers import auth, users, documents, permissions, audit, admin, system
from app.storage.storage import file_storage
from seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 1. Ensure database tables exist
    Base.metadata.create_all(bind=engine)
    # 2. Ensure private storage directory exists
    file_storage.base_dir.mkdir(parents=True, exist_ok=True)
    # 3. Auto-seed demo accounts if empty
    try:
        seed_database()
    except Exception as e:
        print(f"Auto-seed status: {e}")
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

# 4. Include API Routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(documents.router)
app.include_router(permissions.router)
app.include_router(audit.router)
app.include_router(admin.router)
app.include_router(system.router)

# 5. Single-Service SPA Static Mount (For unified single-link deployment on Render)
candidate_paths = [
    Path(__file__).resolve().parent.parent.parent / "frontend" / "dist",
    Path("/app/frontend/dist"),
    Path("./frontend/dist"),
]

dist_dir = None
for p in candidate_paths:
    if p.is_dir() and (p / "index.html").is_file():
        dist_dir = p
        break

if dist_dir:
    assets_dir = dist_dir / "assets"
    if assets_dir.is_dir():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Exclude API endpoints or docs from SPA catchall
        if full_path.startswith("api/") or full_path in ["docs", "redoc", "openapi.json"]:
            return JSONResponse(status_code=404, content={"detail": "Not Found"})

        file_path = dist_dir / full_path
        if file_path.is_file():
            return FileResponse(str(file_path))

        return FileResponse(str(dist_dir / "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "name": "TrustVault Secure Document Sharing Platform",
            "version": "1.0.0",
            "documentation": "/docs",
            "status": "active",
        }
