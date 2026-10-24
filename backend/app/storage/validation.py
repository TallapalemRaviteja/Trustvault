import os
import re
from typing import Tuple
from fastapi import HTTPException, status
from app.config import settings

# Allowed file extensions
ALLOWED_EXTENSIONS = {
    ".pdf", ".docx", ".xlsx", ".pptx", ".txt", ".csv",
    ".png", ".jpg", ".jpeg", ".json"
}

# Magic bytes signatures for high-risk formats
MAGIC_SIGNATURES = {
    ".pdf": [b"%PDF-"],
    ".png": [b"\x89PNG\r\n\x1a\n"],
    ".jpg": [b"\xff\xd8\xff"],
    ".jpeg": [b"\xff\xd8\xff"],
    ".docx": [b"PK\x03\x04"],
    ".xlsx": [b"PK\x03\x04"],
    ".pptx": [b"PK\x03\x04"],
}

# Suspicious executable or script extensions that should never be permitted, even in double extensions
DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".sh", ".ps1", ".vbs", ".js", ".msi",
    ".dll", ".scr", ".com", ".pif", ".hta", ".cpl", ".jar", ".py"
}


def sanitize_filename(filename: str) -> str:
    """Removes path traversal characters and non-safe characters from filenames."""
    if not filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename cannot be empty.",
        )
    # Check for null bytes
    if "\0" in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Filename contains invalid null characters.",
        )
    
    # Strip directory components (path traversal attempts)
    clean = os.path.basename(filename.replace("\\", "/"))
    # Remove dangerous characters
    clean = re.sub(r'[^a-zA-Z0-9._\- ]', '_', clean)
    clean = clean.strip()
    if not clean:
        clean = "unnamed_document"
    return clean


def validate_file_upload(filename: str, content: bytes, client_content_type: str) -> Tuple[str, str]:
    """
    Validates uploaded file for:
    - Empty content
    - Maximum size
    - Safe filename and no path traversal
    - Suspicious double extensions
    - Allowlisted extension
    - Magic byte header verification
    Returns sanitized filename and verified mime type.
    """
    if not content or len(content) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file uploaded. Files must have content.",
        )

    if len(content) > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {max_mb:.1f} MB.",
        )

    clean_name = sanitize_filename(filename)

    # Check for suspicious double extensions (e.g., document.pdf.exe)
    parts = clean_name.lower().split(".")
    if len(parts) > 2:
        for part in parts[1:]:
            ext = f".{part}"
            if ext in DANGEROUS_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Prohibited file extension detected: '{ext}' is not permitted.",
                )

    _, ext = os.path.splitext(clean_name.lower())
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file format '{ext}'. Allowed formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )

    # Magic byte signature check
    if ext in MAGIC_SIGNATURES:
        signatures = MAGIC_SIGNATURES[ext]
        matched = any(content.startswith(sig) for sig in signatures)
        if not matched:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File content does not match the expected signature for {ext} format.",
            )

    # Determine canonical MIME type
    mime_mapping = {
        ".pdf": "application/pdf",
        ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        ".txt": "text/plain",
        ".csv": "text/csv",
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".json": "application/json",
    }
    canonical_mime = mime_mapping.get(ext, "application/octet-stream")

    return clean_name, canonical_mime
