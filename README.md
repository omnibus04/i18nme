# i18nme — Public SDK Examples & Docs

**i18nme** is a translation management and delivery API. You store translation keys in the portal, and fetch them at runtime via a simple REST API — no client library required.

- 🌐 **Portal:** [app.i18nme.com](https://app.i18nme.com)
- 📖 **Full docs:** [docs.i18nme.com](https://docs.i18nme.com)
- 🔑 **API base URL:** `https://sapi.i18nme.com`

---

## Quick start

```bash
# 1. Get your API key from app.i18nme.com → Project → API Keys
# 2. Fetch the project manifest
curl https://sapi.i18nme.com/v1/manifest \
  -H "X-API-Key: key_live_XXXX"

# 3. Fetch all translations for English
curl https://sapi.i18nme.com/v1/cached/translations/en \
  -H "X-API-Key: key_live_XXXX"
```

Response shape:

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

---

## What's in this repo

```
examples/
  javascript/     Vanilla JS / Node.js (fetch, no extra deps)
  typescript/     TypeScript helper + Next.js integration
  react/          React hook + context provider
  python/         httpx helper, Django middleware, FastAPI dependency
  go/             net/http helper
  php/            Guzzle helper
docs/
  getting-started.md
  authentication.md
  endpoints.md
  rate-limits.md
  errors.md
```

---

## API overview

| Endpoint | Description |
|---|---|
| `GET /health` | Service health check (no auth) |
| `GET /v1/manifest` | Project languages (live) |
| `GET /v1/cached/manifest` | Project languages (cached ⚡) |
| `GET /v1/translations/{lang}` | All keys for a language (live) |
| `GET /v1/cached/translations/{lang}` | All keys for a language (cached ⚡) |
| `GET /v1/translations/{lang}/{group}` | Keys in a namespace |
| `GET /v1/translations/{lang}/{group}/{key}` | Single key value |

**Cached endpoints** serve pre-built JSON from S3 — recommended for production (sub-50 ms, no DB reads).

---

## Authentication

Pass your API key in the `X-API-Key` header on every request (except `/health`).  
Keys are project-scoped — one key cannot access another project's data.

---

## Rate limits

| Plan | Requests / day |
|---|---|
| Free | 1,000 |
| Starter | 10,000 |
| Pro | 100,000 |

The counter resets at midnight UTC. A 10% grace zone applies before hard blocking. On `429`, use the `Retry-After` header value.

---

## Examples by language

| Language | Folder |
|---|---|
| JavaScript / Node.js | [`examples/javascript`](examples/javascript) |
| TypeScript / Next.js | [`examples/typescript`](examples/typescript) |
| React hook | [`examples/react`](examples/react) |
| Python | [`examples/python`](examples/python) |
| Go | [`examples/go`](examples/go) |
| PHP | [`examples/php`](examples/php) |

---

## License

MIT — use these examples freely in your own projects.
