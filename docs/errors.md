# Error Reference

## HTTP status codes

| Status | Meaning |
|---|---|
| `200 OK` | Request successful |
| `400 Bad Request` | Malformed request (e.g. invalid language code) |
| `401 Unauthorized` | API key missing or revoked |
| `403 Forbidden` | API key does not belong to this project |
| `404 Not Found` | Language, group, or key does not exist |
| `429 Too Many Requests` | Daily rate limit exceeded |
| `500 Internal Server Error` | Unexpected server error |

## Error response shape

```json
{
  "detail": "Human-readable description of the error"
}
```

## Common errors

### 401 — missing or revoked key

```json
{ "detail": "Invalid or missing API key" }
```

Ensure the `X-API-Key` header is present and the key hasn't been revoked in the portal.

### 404 — language not found

```json
{ "detail": "Language 'xx' not found for this project" }
```

Check the manifest (`GET /v1/manifest`) to see which language codes are available.

### 404 — group not found

```json
{ "detail": "Group 'unknown' not found" }
```

The namespace (first dot segment) doesn't exist. Verify the group name matches what's in the portal.

### 429 — rate limit

```json
{ "detail": "Rate limit exceeded: 1100/1000 requests today" }
```

See [Rate limits](rate-limits.md) for handling strategies.
