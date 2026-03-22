"""File upload endpoints."""
import time

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import StreamingResponse

from app.infrastructure.security.jwt import get_current_active_user, UserResponseDTO as AuthUser
from app.infrastructure.storage.minio_client import get_minio_storage, MinIOStorage

router = APIRouter()

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 10 * 1024 * 1024  # 10MB
EXT_MAP = {"image/jpeg": "jpg", "image/png": "png", "image/webp": "webp"}


@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: AuthUser = Depends(get_current_active_user),
    storage: MinIOStorage = Depends(get_minio_storage),
):
    """Upload an avatar image."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Allowed: {', '.join(ALLOWED_TYPES)}"
        )

    data = await file.read()
    if len(data) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File too large. Max 10MB"
        )

    ext = EXT_MAP[file.content_type]

    # Delete old avatar files for this user, then upload new one
    user_prefix = f"users/{current_user.id}/"
    storage.delete_prefix(user_prefix)

    object_name = f"users/{current_user.id}/avatar.{ext}"
    storage.upload(data, file.content_type, ext, object_name=object_name)
    url = f"{storage.get_url(object_name)}?t={int(time.time())}"

    return {"url": url}


@router.get("/file/{object_name:path}")
async def get_file(
    object_name: str,
    storage: MinIOStorage = Depends(get_minio_storage),
):
    """Proxy to serve files from MinIO (avoids exposing MinIO port)."""
    try:
        response = storage.client.get_object(storage.bucket, object_name)
        content_type = response.headers.get("content-type", "application/octet-stream")
        return StreamingResponse(
            response,
            media_type=content_type,
            headers={"Cache-Control": "public, max-age=31536000, immutable"},
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
