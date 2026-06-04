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
