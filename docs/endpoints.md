# Endpoints

Base URL: `https://sapi.i18nme.com`

All endpoints except `/health` require the `X-API-Key` header.

---

## Health check

```
GET /health
```

No authentication required. Returns `200 OK` when the service is up.

```json
{ "status": "ok" }
```

---

## Manifest

### GET /v1/manifest *(live)*

Returns the project's available languages, queried live from the database.

```
GET /v1/manifest
X-API-Key: key_live_XXXX
```

### GET /v1/cached/manifest *(cached ⚡)*

Same response, served from pre-built S3 cache. Recommended for production.

**Response — 200 OK**

```json
{
  "languages": [
    { "code": "en", "name": "English", "iso": "en" },
    { "code": "de", "name": "German",  "iso": "de" }
  ]
}
```

---

## Translations — all keys

### GET /v1/translations/{language} *(live)*
### GET /v1/cached/translations/{language} *(cached ⚡)*

Returns all approved translation keys for a language, grouped by namespace.

| Parameter | In | Required | Description |
|---|---|---|---|
| `language` | path | ✅ | Language code, e.g. `en`, `de`, `pl` |
| `status` | query | ❌ | `approved` (default), `draft`, or `needs_review` |

**Response — 200 OK**

```json
{
  "common": {
    "welcome": "Welcome",
    "logout": "Log out"
  },
  "nav": {
    "home": "Home",
    "pricing": "Pricing"
  }
}
```

Key structure: the part before the first dot becomes the namespace. `common.welcome` → `{ common: { welcome: … } }`.

---

## Translations — single namespace

### GET /v1/translations/{language}/{group}
### GET /v1/cached/translations/{language}/{group}

Returns only keys within one namespace.

| Parameter | In | Required | Description |
|---|---|---|---|
| `language` | path | ✅ | Language code |
| `group` | path | ✅ | Namespace name (first dot segment) |

**Response — 200 OK**

```json
{
  "welcome": "Welcome",
  "logout": "Log out"
}
```

---

## Translations — single key

### GET /v1/translations/{language}/{group}/{key}
### GET /v1/cached/translations/{language}/{group}/{key}

Returns the value of a single key.

| Parameter | In | Required | Description |
|---|---|---|---|
| `language` | path | ✅ | Language code |
| `group` | path | ✅ | Namespace name |
| `key` | path | ✅ | Key name (without the namespace prefix) |

**Response — 200 OK**

```json
{ "key": "welcome", "value": "Welcome", "language": "en" }
```

---

## Cached vs live

| | Live | Cached ⚡ |
|---|---|---|
| Data freshness | Real-time | ~1–2 min delay |
| Backend | PostgreSQL query | S3 file read |
| Typical latency | 20–80 ms | < 15 ms |
| Recommended for | Webhooks, admin tools | Production apps |

Both endpoint types consume the same daily API quota.

---

## Languages

### GET /v1/languages

List all language codes registered for the project.

**Response — 200 OK**

```json
{
  "project_id": "3fa85f64-...",
  "languages": [
    { "code": "en", "added_at": "2026-01-10T09:00:00Z" },
    { "code": "de", "added_at": "2026-02-01T14:30:00Z" }
  ],
  "count": 2
}
```

### POST /v1/languages

Add a language to the project. Returns **402** when the plan's language limit is reached.

```json
{ "code": "de" }
```

**Response — 201 Created**

```json
{ "project_id": "...", "code": "de", "added": true }
```

### DELETE /v1/languages/{code}

Remove a language and **permanently delete** all its translation values.

**Response — 200 OK**

```json
{ "code": "de", "translations_deleted": 150, "deleted": true }
```

---

## Groups

### GET /v1/groups

List all groups (distinct `group_name` values) that have at least one active key.

**Response — 200 OK**

```json
{ "groups": ["Default", "common", "nav"], "count": 3 }
```

### POST /v1/groups

Validate and reserve a group name.

```json
{ "name": "marketing" }
```

### PATCH /v1/groups/{group_name}

Rename a group — updates all keys in that group atomically.

```json
{ "new_name": "brand" }
```

**Response — 200 OK**

```json
{ "old_name": "marketing", "new_name": "brand", "keys_updated": 12 }
```

### DELETE /v1/groups/{group_name}

Soft-delete all keys in the group.

**Response — 200 OK**

```json
{ "group_name": "marketing", "keys_deleted": 12 }
```

---

## Keys

### GET /v1/keys

List all active translation keys. Optionally filter with `?group=<name>`.

**Response — 200 OK**

```json
{
  "keys": [
    {
      "id": "a1b2c3d4-...",
      "key": "common.welcome",
      "group_name": "common",
      "description": "Home page greeting",
      "created_at": "2026-01-15T10:00:00Z",
      "updated_at": "2026-01-15T10:00:00Z"
    }
  ],
  "count": 1
}
```

### POST /v1/keys

Create a translation key. Returns **402** when the plan's key limit is reached.

```json
{
  "key": "common.welcome",
  "group_name": "common",
  "description": "Home page greeting"
}
```

**Response — 201 Created**

```json
{ "id": "a1b2c3d4-...", "key": "common.welcome", "group_name": "common" }
```

### PATCH /v1/keys/{key_id}

Update `group_name` and/or `description`.

### DELETE /v1/keys/{key_id}

Soft-delete a key and all its translation values.

### PUT /v1/keys/{key_id}/translations/{language}

Create or overwrite the translation value for a language.

| Field | Required | Description |
|-------|----------|-------------|
| `value` | ✅ | Translated string (max 10,000 chars) |
| `status` | ❌ | `draft` (default), `review`, or `approved` |

**Response — 200 OK**

```json
{ "key_id": "...", "language": "en", "value": "Welcome", "status": "approved" }
```

### DELETE /v1/keys/{key_id}/translations/{language}

Permanently delete a single translation value.

---

## Cache

### POST /v1/cache/rebuild

Enqueue an asynchronous export of all approved translations to the S3/R2 cache. Returns **202 Accepted** immediately.

**Response — 202 Accepted**

```json
{ "status": "queued", "message": "Cache rebuild has been queued." }
```

### GET /v1/cache/status

Return the timestamp of the last successful rebuild.

**Response — 200 OK**

```json
{ "last_rebuilt_at": "2026-06-04T12:34:56Z", "ready": true }
```

When `ready` is `false`, cached endpoints return `503 Service Unavailable`.
