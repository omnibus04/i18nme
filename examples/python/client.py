"""client.py — reusable i18nme Python client

Usage:
    from client import I18nClient

    i18n = I18nClient()  # reads I18N_API_KEY from env
    bundle = i18n.translations("en")
    print(bundle["common"]["welcome"])
"""

import os
import time
from typing import Any

import httpx


class I18nClient:
    """Synchronous i18nme client with optional in-memory cache.

    Args:
        api_key: Your project API key (key_live_…).
                 Falls back to the I18N_API_KEY environment variable.
        base_url: API base URL. Defaults to https://sapi.i18nme.com.
        ttl:     Cache TTL in seconds. Set to 0 to disable. Default: 300.
        timeout: HTTP timeout in seconds. Default: 10.
    """

    def __init__(
        self,
        api_key: str | None = None,
        base_url: str = "https://sapi.i18nme.com",
        ttl: int = 300,
        timeout: int = 10,
    ):
        self._api_key = api_key or os.environ.get("I18N_API_KEY", "")
        if not self._api_key:
            raise ValueError("i18nme: API key is not set")
        self._base = base_url
        self._ttl = ttl
        self._cache: dict[str, tuple[Any, float]] = {}
        self._client = httpx.Client(
            headers={"X-API-Key": self._api_key},
            timeout=timeout,
        )

    def _get(self, path: str) -> Any:
        if self._ttl > 0 and path in self._cache:
            data, ts = self._cache[path]
            if time.monotonic() - ts < self._ttl:
                return data

        res = self._client.get(f"{self._base}{path}")
        if res.status_code == 429:
            retry_after = res.headers.get("Retry-After", "86400")
            raise RuntimeError(f"i18nme: rate limited — retry after {retry_after}s")
        res.raise_for_status()

        data = res.json()
        if self._ttl > 0:
            self._cache[path] = (data, time.monotonic())
        return data

    def manifest(self) -> dict:
        """Return project manifest (available languages)."""
        return self._get("/v1/cached/manifest")

    def translations(self, lang: str) -> dict[str, dict[str, str]]:
        """Return all translations for *lang* as {namespace: {key: value}}."""
        return self._get(f"/v1/cached/translations/{lang}")

    def translation_group(self, lang: str, group: str) -> dict[str, str]:
        """Return translations for a single namespace."""
        return self._get(f"/v1/cached/translations/{lang}/{group}")

    def translation_key(self, lang: str, group: str, key: str) -> str:
        """Return the value of a single translation key."""
        return self._get(f"/v1/cached/translations/{lang}/{group}/{key}")["value"]

    def clear_cache(self) -> None:
        """Clear the in-memory cache."""
        self._cache.clear()

    def close(self) -> None:
        """Close the underlying HTTP client."""
        self._client.close()

    def __enter__(self):
        return self

    def __exit__(self, *_):
        self.close()
