"""write.py — i18nme write-operation examples

Demonstrates managing groups, keys, translations, and cache via the API.

Usage:
    export I18N_API_KEY="key_live_XXXX"
    python write.py

Requires: pip install httpx
"""

import os
import time

import httpx

BASE_URL = "https://sapi.i18nme.com"
API_KEY  = os.environ.get("I18N_API_KEY", "")

if not API_KEY:
    raise EnvironmentError("Set the I18N_API_KEY environment variable first.")

client = httpx.Client(
    headers={"X-API-Key": API_KEY},
    timeout=10,
)


def api(method: str, path: str, json: dict | None = None):
    res = client.request(method, f"{BASE_URL}{path}", json=json)
    if not res.is_success:
        raise RuntimeError(f"{method} {path} → {res.status_code}: {res.text}")
    return res.json()


# ── Languages ─────────────────────────────────────────────────────────────────

# List registered languages
langs = api("GET", "/v1/languages")
print("languages:", langs)
# → {'project_id': '...', 'languages': [{'code': 'en', 'added_at': '...'}], 'count': 1}

# Add a language (returns 402 if your plan limit is reached)
added = api("POST", "/v1/languages", {"code": "de"})
print("added language:", added)
# → {'project_id': '...', 'code': 'de', 'added': True}

# ── Groups ────────────────────────────────────────────────────────────────────

# List all groups
groups = api("GET", "/v1/groups")
print("groups:", groups)
# → {'groups': ['Default', 'common', 'nav'], 'count': 3}

# Create a group
new_group = api("POST", "/v1/groups", {"name": "marketing"})
print("created group:", new_group)
# → {'name': 'marketing', 'created': True}

# Rename a group (updates all keys atomically)
renamed = api("PATCH", "/v1/groups/marketing", {"new_name": "brand"})
print("renamed group:", renamed)
# → {'old_name': 'marketing', 'new_name': 'brand', 'keys_updated': 0}

# ── Keys ──────────────────────────────────────────────────────────────────────

# List all keys (optionally filter by group)
keys = api("GET", "/v1/keys?group=common")
print("keys in common:", keys)

# Create a key (returns 402 if your plan's key limit is reached)
new_key = api("POST", "/v1/keys", {
    "key": "common.welcome",
    "group_name": "common",
    "description": "Greeting on the home page",
})
print("created key:", new_key)
# → {'id': 'a1b2c3...', 'key': 'common.welcome', 'group_name': 'common', ...}

key_id = new_key["id"]

# Update key metadata
updated = api("PATCH", f"/v1/keys/{key_id}", {
    "description": "Main greeting — shown on the home screen",
})
print("updated key:", updated)

# ── Translations ──────────────────────────────────────────────────────────────

# Upsert a translation value (creates or overwrites the language+key pair)
upserted_en = api("PUT", f"/v1/keys/{key_id}/translations/en", {
    "value": "Welcome",
    "status": "approved",
})
print("upserted en:", upserted_en)
# → {'key_id': '...', 'language': 'en', 'value': 'Welcome', 'status': 'approved'}

api("PUT", f"/v1/keys/{key_id}/translations/de", {
    "value": "Willkommen",
    "status": "approved",
})

# Delete a single translation value
api("DELETE", f"/v1/keys/{key_id}/translations/de")
print("deleted de translation")

# ── Cache ─────────────────────────────────────────────────────────────────────

# Trigger a cache rebuild (async — returns 202 immediately)
rebuild = api("POST", "/v1/cache/rebuild")
print("rebuild queued:", rebuild)
# → {'status': 'queued', 'message': '...'}

# Poll until cache is ready
while True:
    status = api("GET", "/v1/cache/status")
    print("cache status:", status)
    if status["ready"]:
        break
    time.sleep(3)

print("cache is ready — serve translations from /v1/cached/*")

# ── Cleanup ───────────────────────────────────────────────────────────────────

# Soft-delete a key
api("DELETE", f"/v1/keys/{key_id}")
print("deleted key:", key_id)

# Remove a language (also deletes all its translation values)
api("DELETE", "/v1/languages/de")
print("removed language: de")

client.close()
