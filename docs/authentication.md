# Authentication

All Translation API endpoints (except `/health`) require an API key passed as a request header.

## The `X-API-Key` header

```
X-API-Key: key_live_XXXXXXXXXXXXXXXXXXXX
```

The header name is case-insensitive — `x-api-key` and `X-API-Key` are both accepted.

## Managing keys

Keys are created and revoked in the portal:

1. Open your project in [app.i18nme.com](https://app.i18nme.com)
2. Go to the **API Keys** tab
3. Click **Generate key** — give it a descriptive label (e.g. `production-web`)
4. Copy the key immediately. **It is shown only once.**

To revoke a key, click the delete icon next to it. Revocation is immediate.

## Key scope

Each key is scoped to a **single project**. It cannot be used to access translations from other projects.

## Security best practices

- **Never commit keys to source control.** Use environment variables or a secrets manager.
- **Rotate keys regularly.** Create a new key, deploy it, then revoke the old one.
- **Use separate keys per environment** (`production-web`, `staging-web`, etc.) so you can revoke one without affecting others.
- **The Translation API is read-only.** Keys exposed in browser-side code reveal only translation text — no write access is possible.

## Error responses

| Status | Meaning |
|---|---|
| `401 Unauthorized` | Key missing, malformed, or revoked |
| `403 Forbidden` | Key does not belong to this project |
| `429 Too Many Requests` | Daily rate limit exceeded |
