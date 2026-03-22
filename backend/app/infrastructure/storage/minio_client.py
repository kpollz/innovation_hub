"""MinIO storage client."""
import io
import uuid
from typing import Optional

from minio import Minio
from minio.error import S3Error

from app.core.config import get_settings


class MinIOStorage:
    """MinIO object storage client."""

    def __init__(self):
        settings = get_settings()
        self.client = Minio(
            endpoint=settings.minio_endpoint,
            access_key=settings.minio_access_key,
            secret_key=settings.minio_secret_key,
            secure=settings.minio_secure,
        )
        self.bucket = settings.minio_bucket
        self._ensure_bucket()

    def _ensure_bucket(self):
        """Create bucket if it doesn't exist, with public read policy."""
        try:
            if not self.client.bucket_exists(self.bucket):
                self.client.make_bucket(self.bucket)
                # Set public read policy
                import json
                policy = {
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Principal": {"AWS": "*"},
                            "Action": ["s3:GetObject"],
                            "Resource": [f"arn:aws:s3:::{self.bucket}/*"],
                        }
                    ],
                }
                self.client.set_bucket_policy(self.bucket, json.dumps(policy))
        except S3Error:
            pass  # Will fail on first request if MinIO is not ready yet

    def upload(
        self,
        data: bytes,
        content_type: str,
        extension: str,
        object_name: str = "",
    ) -> str:
        """Upload file and return the object name."""
        if not object_name:
            object_name = f"{uuid.uuid4().hex}.{extension}"
        self.client.put_object(
            self.bucket,
            object_name,
            io.BytesIO(data),
            length=len(data),
            content_type=content_type,
        )
        return object_name

    def delete_prefix(self, prefix: str) -> None:
        """Delete all objects with a given prefix."""
        try:
            objects = self.client.list_objects(self.bucket, prefix=prefix)
            for obj in objects:
                self.client.remove_object(self.bucket, obj.object_name)
        except S3Error:
            pass

    def delete(self, object_name: str) -> None:
        """Delete an object."""
        try:
            self.client.remove_object(self.bucket, object_name)
        except S3Error:
            pass

    def get_url(self, object_name: str) -> str:
        """Get the public URL for an object."""
        settings = get_settings()
        if settings.minio_public_url:
            return f"{settings.minio_public_url}/{self.bucket}/{object_name}"
        # Default: use the /api/v1/uploads/ proxy path
        return f"/api/v1/uploads/file/{object_name}"


_storage: Optional[MinIOStorage] = None


def get_minio_storage() -> MinIOStorage:
    """Get or create MinIO storage singleton."""
    global _storage
    if _storage is None:
        _storage = MinIOStorage()
    return _storage
