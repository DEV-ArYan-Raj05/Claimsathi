"""Storage interface (Supabase Storage, private buckets, 10-minute signed URLs). rules.md §10."""

from typing import Protocol

SIGNED_URL_TTL_S = 600


class StorageProvider(Protocol):
    async def signed_upload_url(self, bucket: str, path: str) -> str:
        """URL the browser PUTs the file to."""
        ...

    async def signed_read_url(self, bucket: str, path: str, ttl_s: int = SIGNED_URL_TTL_S) -> str:
        """Short-lived read URL."""
        ...
