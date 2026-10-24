import pytest
from fastapi import HTTPException
from app.storage.validation import validate_file_upload, sanitize_filename
from app.storage.storage import SecureFileStorage


def test_sanitize_filename_prevents_path_traversal():
    assert sanitize_filename("../../../etc/passwd") == "passwd"
    assert sanitize_filename("..\\..\\windows\\system32\\calc.exe") == "calc.exe"
    assert sanitize_filename("normal_report.pdf") == "normal_report.pdf"


def test_empty_file_rejected():
    with pytest.raises(HTTPException) as exc:
        validate_file_upload("empty.pdf", b"", "application/pdf")
    assert exc.value.status_code == 400
    assert "Empty file" in exc.value.detail


def test_unsupported_file_extension_rejected():
    with pytest.raises(HTTPException) as exc:
        validate_file_upload("script.sh", b"#!/bin/bash\necho 1", "text/x-sh")
    assert exc.value.status_code == 400
    assert "Unsupported file format" in exc.value.detail


def test_suspicious_double_extension_blocked():
    with pytest.raises(HTTPException) as exc:
        validate_file_upload("invoice.pdf.exe", b"%PDF-1.4 dummy", "application/pdf")
    assert exc.value.status_code == 400
    assert "Prohibited file extension detected" in exc.value.detail


def test_magic_byte_mismatch_rejected():
    # File named .pdf but containing plain text or ELF binary without %PDF- magic
    with pytest.raises(HTTPException) as exc:
        validate_file_upload("fake.pdf", b"NOT_A_REAL_PDF_HEADER", "application/pdf")
    assert exc.value.status_code == 400
    assert "does not match the expected signature" in exc.value.detail


def test_valid_pdf_accepted():
    clean_name, mime = validate_file_upload(
        "Financial_Report.pdf",
        b"%PDF-1.5 legitimate pdf header content...",
        "application/pdf",
    )
    assert clean_name == "Financial_Report.pdf"
    assert mime == "application/pdf"


def test_storage_key_path_traversal_blocked(tmp_path):
    storage = SecureFileStorage(base_path=str(tmp_path))
    with pytest.raises(HTTPException) as exc:
        storage.read("../../../outside.txt")
    assert exc.value.status_code == 400
    assert "Invalid storage key" in exc.value.detail or "Path traversal" in exc.value.detail
