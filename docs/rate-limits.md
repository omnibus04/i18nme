# Rate Limits

The API enforces per-key daily rate limits to ensure fair use.

## Limits by plan

| Plan | Requests / day |
|---|---|
| Free | 5,000 |
| Builder | 100,000 |
| Growth | 1,000,000 |

- Counter resets at **midnight UTC** every day.
- Tracked **per API key**, not per IP.
- Both live and cached endpoints consume quota.

## Grace zone

A **10% grace zone** applies above the hard limit. Requests at 100–110% of your limit are served but carry a warning header:

```
X-RateLimit-Warning: Approaching daily limit: 10450/10000 requests used
```

Requests above 110% return `429 Too Many Requests`.

## 429 response

```json
{
  "detail": "Rate limit exceeded: 11100/10000 requests today"
}
```

| Header | Value |
|---|---|
| `Retry-After` | Seconds until midnight UTC reset |
| `X-RateLimit-Limit` | Your daily limit |

## Handling 429 in code

**JavaScript**

```js
const res = await fetch('https://sapi.i18nme.com/v1/cached/translations/en', {
  headers: { 'X-API-Key': process.env.I18N_API_KEY }
})

if (res.status === 429) {
  const retryAfter = parseInt(res.headers.get('Retry-After') || '86400')
  console.warn(`Rate limited — retry in ${retryAfter}s`)
  // serve stale cache or fallback translations
}
```

**Python**

```python
import httpx

res = httpx.get(
    'https://sapi.i18nme.com/v1/cached/translations/en',
    headers={'X-API-Key': os.environ['I18N_API_KEY']}
)

if res.status_code == 429:
    retry_after = int(res.headers.get('Retry-After', 86400))
    print(f'Rate limited — retry in {retry_after}s')
```

## Tips to stay within limits

- **Use cached endpoints in production** — same quota, much faster.
- **Cache responses in your app** — translations rarely change in real time. A 10-minute in-memory cache can cut calls by 99%.
- **Fetch by language, not by key** — `GET /v1/translations/{lang}` returns everything in one call. Avoid per-key requests in hot paths.
