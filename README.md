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
    basic.js      Read examples for every GET endpoint
    write.js      Write examples — groups, keys, languages, cache
    helper.js     Reusable helper module
    with-cache.js In-memory cache layer to reduce API calls
  typescript/     TypeScript helper + Next.js integration
    client.ts     Typed read client
    write.ts      Typed write examples
  react/          React hook + context provider
  python/         httpx helper, Django middleware, FastAPI dependency
    basic.py      Read examples for every GET endpoint
    write.py      Write examples — groups, keys, languages, cache
    client.py     Reusable client class
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

### Read endpoints

| Endpoint | Description |
|---|---|
| `GET /health` | Service health check (no auth) |
| `GET /v1/manifest` | Project languages (live) |
| `GET /v1/cached/manifest` | Project languages (cached ⚡) |
| `GET /v1/translations/{lang}` | All keys for a language (live) |
| `GET /v1/cached/translations/{lang}` | All keys for a language (cached ⚡) |
| `GET /v1/translations/{lang}/{group}` | Keys in a namespace |
| `GET /v1/translations/{lang}/{group}/{key}` | Single key value |

**Cached endpoints** serve pre-built JSON from S3 — recommended for production.

### Write endpoints

| Endpoint | Description |
|---|---|
| `GET /v1/languages` | List registered languages |
| `POST /v1/languages` | Add a language |
| `DELETE /v1/languages/{code}` | Remove a language + all its translations |
| `GET /v1/groups` | List groups |
| `POST /v1/groups` | Create a group |
| `PATCH /v1/groups/{name}` | Rename a group |
| `DELETE /v1/groups/{name}` | Delete a group and all its keys |
| `GET /v1/keys` | List translation keys |
| `POST /v1/keys` | Create a translation key |
| `PATCH /v1/keys/{id}` | Update key metadata |
| `DELETE /v1/keys/{id}` | Soft-delete a key |
| `PUT /v1/keys/{id}/translations/{lang}` | Upsert a translation value |
| `DELETE /v1/keys/{id}/translations/{lang}` | Delete a translation value |
| `POST /v1/cache/rebuild` | Trigger async cache rebuild |
| `GET /v1/cache/status` | Check last rebuild timestamp |

---

## Authentication

Pass your API key in the `X-API-Key` header on every request (except `/health`).  
Keys are project-scoped — one key cannot access another project's data.

---

## Rate limits

| Plan | Requests / day |
|---|---|
| Free | 5,000 |
| Builder | 100,000 |
| Growth | 1,000,000 |

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
