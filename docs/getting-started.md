# Getting Started

Get your first translation response in under 5 minutes.

## 1. Create an account

Sign up at [app.i18nme.com](https://app.i18nme.com). The Free plan gives you:
- 1 project
- 1 language
- 100 translation keys
- 1,000 API calls per day

No credit card required.

## 2. Create a project

In the portal, click **New project**, choose a name and source language (e.g. `en`).

## 3. Add translation keys

Go to your project → **Keys** tab → **Add key**.

Enter a key name using dot notation, e.g. `common.welcome`, and its value in the source language. Approve the translation so it's visible via the API.

## 4. Create an API key

Go to your project → **API Keys** tab → **Generate key**. Copy the key — it starts with `key_live_`.

## 5. Make your first request

```bash
export I18N_API_KEY="key_live_XXXX"

# Fetch available languages
curl https://sapi.i18nme.com/v1/manifest \
  -H "X-API-Key: $I18N_API_KEY"
```

```json
{
  "languages": [
    { "code": "en", "name": "English", "iso": "en" }
  ]
}
```

```bash
# Fetch all translations for English (cached — recommended)
curl https://sapi.i18nme.com/v1/cached/translations/en \
  -H "X-API-Key: $I18N_API_KEY"
```

```json
{
  "common": {
    "welcome": "Welcome"
  }
}
```

## Next steps

- [Authentication](authentication.md) — key management and security best practices
- [Endpoints](endpoints.md) — full endpoint reference
- [Rate limits](rate-limits.md) — daily limits and how to handle 429s
- [Errors](errors.md) — all error codes and their meaning
