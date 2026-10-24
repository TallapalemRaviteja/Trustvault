import hashlib
import os
from pathlib import Path
import uuid
from typing import Tuple
from fastapi import HTTPException, status
from app.config import settings


class SecureFileStorage:
    def __init__(self, base_path: str = None):
        self.base_dir = Path(base_path or settings.LOCAL_STORAGE_PATH).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _resolve_key_path(self, storage_key: str) -> Path:
        """Resolves storage key to path while preventing path traversal."""
        # storage_key must be an alphanumeric/hyphen hex or uuid
        if not storage_key or ".." in storage_key or "/" in storage_key or "\\" in storage_key:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid storage key.",
            )
        resolved = (self.base_dir / storage_key).resolve()
        if not str(resolved).startswith(str(self.base_dir)):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Path traversal violation detected.",
            )
        return resolved

    def save(self, content: bytes) -> Tuple[str, str, int]:
        """
        Saves bytes to private storage under a randomly generated key.
        Returns: (storage_key, sha256_hash, file_size)
        """
        sha256_hash = hashlib.sha256(content).hexdigest()
        file_size = len(content)
        
        # Internal randomized key
        storage_key = f"{uuid.uuid4().hex}_{hashlib.sha256(uuid.uuid4().bytes).hexdigest()[:12]}.bin"
        file_path = self._resolve_key_path(storage_key)

        # Atomic write to temporary file then replace
        temp_path = file_path.with_suffix(".tmp")
        with open(temp_path, "wb") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())

        temp_path.replace(file_path)
        return storage_key, sha256_hash, file_size

    def read(self, storage_key: str) -> bytes:
        """Reads confidential file content from private storage."""
        file_path = self._resolve_key_path(storage_key)
        if not file_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Physical document storage object not found.",
            )
        with open(file_path, "rb") as f:
            return f.read()

    def delete(self, storage_key: str) -> bool:
        """Deletes document file from private storage."""
        try:
            file_path = self._resolve_key_path(storage_key)
            if file_path.is_file():
                file_path.unlink()
                return True
        except Exception:
            pass
        return False


file_storage = SecureFileStorage()
