"""django_middleware.py — i18nme Django middleware

Attaches a t() helper to every request so templates and views
can look up translations without extra imports.

Installation:
    1. Copy this file into your Django app.
    2. Add to MIDDLEWARE in settings.py:
           'myapp.django_middleware.I18nMiddleware'
    3. Set in settings.py:
           I18N_API_KEY = env('I18N_API_KEY')
           I18N_DEFAULT_LOCALE = 'en'

Usage in a view:
    def my_view(request):
        return HttpResponse(request.t('common.welcome'))

Usage in a template (pass t as context):
    def my_view(request):
        return render(request, 'index.html', {'t': request.t})
    <!-- index.html -->
    <h1>{{ t('common.welcome') }}</h1>
"""

import functools
import os
import time
from typing import Callable

import httpx
from django.conf import settings

BASE_URL = "https://sapi.i18nme.com"
_cache: dict[str, tuple[dict, float]] = {}
_TTL = 300  # seconds


def _load_bundle(locale: str) -> dict:
    now = time.monotonic()
    if locale in _cache and now - _cache[locale][1] < _TTL:
        return _cache[locale][0]

    api_key = getattr(settings, "I18N_API_KEY", os.environ.get("I18N_API_KEY", ""))
    res = httpx.get(
        f"{BASE_URL}/v1/cached/translations/{locale}",
        headers={"X-API-Key": api_key},
        timeout=5,
    )
    res.raise_for_status()
    bundle = res.json()
    _cache[locale] = (bundle, now)
    return bundle


def _make_t(bundle: dict) -> Callable[[str], str]:
    def t(dot_key: str) -> str:
        parts = dot_key.split(".", 1)
        if len(parts) == 1:
            return dot_key
        group, key = parts
        return bundle.get(group, {}).get(key, dot_key)
    return t


class I18nMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.default_locale = getattr(settings, "I18N_DEFAULT_LOCALE", "en")

    def __call__(self, request):
        locale = getattr(request, "LANGUAGE_CODE", self.default_locale)
        try:
            bundle = _load_bundle(locale)
        except Exception:
            bundle = {}
        request.t = _make_t(bundle)
        return self.get_response(request)
