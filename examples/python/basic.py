"""basic.py — i18nme Python examples

Usage:
    export I18N_API_KEY="key_live_XXXX"
    python basic.py

Requires: pip install httpx
"""

import os
import httpx

BASE_URL = "https://sapi.i18nme.com"
API_KEY  = os.environ.get("I18N_API_KEY", "")

if not API_KEY:
    raise EnvironmentError("Set the I18N_API_KEY environment variable first.")

headers = {"X-API-Key": API_KEY}

client = httpx.Client(headers=headers, timeout=10)

# ── Health check (no auth required) ──────────────────────────────────────────
health = httpx.get(f"{BASE_URL}/health")
print("health:", health.json())
# → {'status': 'ok'}

# ── Manifest — available languages ───────────────────────────────────────────
manifest = client.get(f"{BASE_URL}/v1/cached/manifest").json()
languages = manifest["languages"]
print("languages:", [l["code"] for l in languages])
# → ['en', 'de', 'pl']

# ── All translations for a language ──────────────────────────────────────────
translations = client.get(f"{BASE_URL}/v1/cached/translations/en").json()
print("translations:", translations)
# → {'common': {'welcome': 'Welcome'}, 'nav': {'home': 'Home'}}

# ── Translations for a single namespace ──────────────────────────────────────
common = client.get(f"{BASE_URL}/v1/cached/translations/en/common").json()
print("common:", common)
# → {'welcome': 'Welcome', 'logout': 'Log out'}

# ── Single translation key ────────────────────────────────────────────────────
key = client.get(f"{BASE_URL}/v1/cached/translations/en/common/welcome").json()
print("key value:", key["value"])
# → 'Welcome'

# ── Fetch all languages in parallel (httpx async) ────────────────────────────
import asyncio

async def fetch_all():
    async with httpx.AsyncClient(headers=headers, timeout=10) as aclient:
        tasks = [
            aclient.get(f"{BASE_URL}/v1/cached/translations/{l['code']}")
            for l in languages
        ]
        responses = await asyncio.gather(*tasks)
    return {
        lang["code"]: res.json()
        for lang, res in zip(languages, responses)
    }

all_bundles = asyncio.run(fetch_all())
print("fetched locales:", list(all_bundles.keys()))
