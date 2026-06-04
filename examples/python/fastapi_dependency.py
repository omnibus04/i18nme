"""fastapi_dependency.py — i18nme FastAPI dependency

Injects a t() helper into route handlers via Depends().

Usage:
    from fastapi import FastAPI, Depends
    from fastapi_dependency import get_t, TranslateFn

    app = FastAPI()

    @app.get("/hello")
    async def hello(t: TranslateFn = Depends(get_t)):
        return {"message": t("common.welcome")}

Environment variables:
    I18N_API_KEY     Your project API key
    I18N_LOCALE      Default locale (default: en)
"""

import os
import time
from typing import Annotated, Callable

import httpx
from fastapi import Depends, Request

BASE_URL  = "https://sapi.i18nme.com"
_cache: dict[str, tuple[dict, float]] = {}
_TTL      = 300  # seconds
_API_KEY  = os.environ.get("I18N_API_KEY", "")
_LOCALE   = os.environ.get("I18N_LOCALE", "en")

TranslateFn = Callable[[str], str]


async def _load_bundle(locale: str) -> dict:
    now = time.monotonic()
    if locale in _cache and now - _cache[locale][1] < _TTL:
        return _cache[locale][0]

    async with httpx.AsyncClient(timeout=5) as client:
        res = await client.get(
            f"{BASE_URL}/v1/cached/translations/{locale}",
            headers={"X-API-Key": _API_KEY},
        )
        res.raise_for_status()

    bundle = res.json()
    _cache[locale] = (bundle, now)
    return bundle


async def get_t(request: Request) -> TranslateFn:
    """FastAPI dependency — returns a t(dot_key) callable."""
    locale = request.headers.get("Accept-Language", _LOCALE)[:2] or _LOCALE
    try:
        bundle = await _load_bundle(locale)
    except Exception:
        bundle = {}

    def t(dot_key: str) -> str:
        parts = dot_key.split(".", 1)
        if len(parts) == 1:
            return dot_key
        group, key = parts
        return bundle.get(group, {}).get(key, dot_key)

    return t
