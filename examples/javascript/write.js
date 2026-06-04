// write.js — i18nme write-operation examples
// Demonstrates managing groups, keys, translations, and cache via the API.
//
// Requires Node 18+ (built-in fetch). No extra packages needed.
//
// Usage:
//   export I18N_API_KEY="key_live_XXXX"
//   node write.js

const BASE_URL = 'https://sapi.i18nme.com'
const API_KEY  = process.env.I18N_API_KEY

if (!API_KEY) {
  console.error('Set the I18N_API_KEY environment variable first.')
  process.exit(1)
}

const headers = {
  'X-API-Key': API_KEY,
  'Content-Type': 'application/json',
}

async function api(method, path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`)
  }
  return data
}

// ── Languages ─────────────────────────────────────────────────────────────────

// List registered languages
const langs = await api('GET', '/v1/languages')
console.log('languages:', langs)
// → { project_id: '...', languages: [{ code: 'en', added_at: '...' }], count: 1 }

// Add a language (returns 402 if your plan limit is reached)
const added = await api('POST', '/v1/languages', { code: 'de' })
console.log('added language:', added)
// → { project_id: '...', code: 'de', added: true }

// ── Groups ────────────────────────────────────────────────────────────────────

// List all groups
const groups = await api('GET', '/v1/groups')
console.log('groups:', groups)
// → { project_id: '...', groups: ['Default', 'common', 'nav'], count: 3 }

// Create a group (validates name; groups are virtual — backed by key group_name)
const newGroup = await api('POST', '/v1/groups', { name: 'marketing' })
console.log('created group:', newGroup)
// → { project_id: '...', name: 'marketing', created: true }

// Rename a group (updates all keys in the group atomically)
const renamed = await api('PATCH', '/v1/groups/marketing', { new_name: 'brand' })
console.log('renamed group:', renamed)
// → { old_name: 'marketing', new_name: 'brand', keys_updated: 0 }

// ── Keys ──────────────────────────────────────────────────────────────────────

// List all keys (optionally filter by group)
const keys = await api('GET', '/v1/keys?group=common')
console.log('keys in common:', keys)

// Create a key (returns 402 if your plan's key limit is reached)
const newKey = await api('POST', '/v1/keys', {
  key: 'common.welcome',
  group_name: 'common',
  description: 'Greeting on the home page',
})
console.log('created key:', newKey)
// → { id: 'a1b2c3...', key: 'common.welcome', group_name: 'common', ... }

const keyId = newKey.id

// Update key metadata (group / description)
const updated = await api('PATCH', `/v1/keys/${keyId}`, {
  description: 'Main greeting — shown on the home screen',
})
console.log('updated key:', updated)

// ── Translations ──────────────────────────────────────────────────────────────

// Upsert a translation value (creates or overwrites the language+key pair)
const upserted = await api('PUT', `/v1/keys/${keyId}/translations/en`, {
  value: 'Welcome',
  status: 'approved',
})
console.log('upserted en:', upserted)
// → { key_id: '...', language: 'en', value: 'Welcome', status: 'approved', ... }

await api('PUT', `/v1/keys/${keyId}/translations/de`, {
  value: 'Willkommen',
  status: 'approved',
})

// Delete a single translation value
await api('DELETE', `/v1/keys/${keyId}/translations/de`)
console.log('deleted de translation')

// ── Cache ─────────────────────────────────────────────────────────────────────

// Trigger a cache rebuild (async — returns 202 immediately)
const rebuild = await api('POST', '/v1/cache/rebuild')
console.log('rebuild queued:', rebuild)
// → { status: 'queued', message: '...' }

// Poll status until ready
let ready = false
while (!ready) {
  const status = await api('GET', '/v1/cache/status')
  console.log('cache status:', status)
  ready = status.ready
  if (!ready) await new Promise(r => setTimeout(r, 3000))
}
console.log('cache is ready — serve translations from /v1/cached/*')

// ── Cleanup ───────────────────────────────────────────────────────────────────

// Soft-delete a key
await api('DELETE', `/v1/keys/${keyId}`)
console.log('deleted key:', keyId)

// Remove a language (also deletes all its translation values)
await api('DELETE', '/v1/languages/de')
console.log('removed language: de')
