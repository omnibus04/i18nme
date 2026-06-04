// write.ts — i18nme write-operation examples (TypeScript)
//
// Demonstrates managing groups, keys, translations, and cache via the API.
// Works with Node.js 18+, Deno, and Bun (native fetch).
//
// Usage:
//   export I18N_API_KEY="key_live_XXXX"
//   npx tsx write.ts      # or: ts-node write.ts

const BASE_URL = 'https://sapi.i18nme.com'

function resolveKey(): string {
  const key =
    typeof process !== 'undefined' ? process.env.I18N_API_KEY : undefined
  if (!key) throw new Error('i18nme: Set the I18N_API_KEY environment variable first.')
  return key
}

// ── Typed interfaces ──────────────────────────────────────────────────────────

interface LanguageEntry {
  code: string
  added_at: string | null
}

interface LanguagesResponse {
  project_id: string
  languages: LanguageEntry[]
  count: number
}

interface GroupsResponse {
  project_id: string
  groups: string[]
  count: number
}

interface KeyEntry {
  id: string
  key: string
  group_name: string
  description: string | null
  created_at: string | null
  updated_at: string | null
}

interface KeysResponse {
  project_id: string
  keys: KeyEntry[]
  count: number
}

interface CreatedKey {
  id: string
  project_id: string
  key: string
  group_name: string
  description: string | null
}

interface TranslationResult {
  key_id: string
  language: string
  value: string
  status: 'draft' | 'review' | 'approved'
  project_id: string
}

interface CacheStatus {
  project_id: string
  last_rebuilt_at: string | null
  ready: boolean
}

// ── Generic API helper ────────────────────────────────────────────────────────

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'X-API-Key': resolveKey(),
      'Content-Type': 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(`${method} ${path} → ${res.status}: ${JSON.stringify(data)}`)
  }
  return data as T
}

// ── Languages ─────────────────────────────────────────────────────────────────

// List registered languages
const langs = await api<LanguagesResponse>('GET', '/v1/languages')
console.log('languages:', langs)
// → { project_id: '...', languages: [{ code: 'en', added_at: '...' }], count: 1 }

// Add a language (returns 402 if your plan limit is reached)
const added = await api<{ project_id: string; code: string; added: boolean }>(
  'POST', '/v1/languages', { code: 'de' }
)
console.log('added language:', added)

// ── Groups ────────────────────────────────────────────────────────────────────

// List all groups
const groups = await api<GroupsResponse>('GET', '/v1/groups')
console.log('groups:', groups)

// Create a group
const newGroup = await api<{ project_id: string; name: string; created: boolean }>(
  'POST', '/v1/groups', { name: 'marketing' }
)
console.log('created group:', newGroup)

// Rename a group (updates all keys atomically)
const renamed = await api<{
  project_id: string
  old_name: string
  new_name: string
  keys_updated: number
}>('PATCH', '/v1/groups/marketing', { new_name: 'brand' })
console.log('renamed group:', renamed)

// ── Keys ──────────────────────────────────────────────────────────────────────

// List keys (optionally filter by group)
const keys = await api<KeysResponse>('GET', '/v1/keys?group=common')
console.log('keys in common:', keys)

// Create a key (returns 402 if your plan's key limit is reached)
const newKey = await api<CreatedKey>('POST', '/v1/keys', {
  key: 'common.welcome',
  group_name: 'common',
  description: 'Greeting on the home page',
})
console.log('created key:', newKey)

const keyId = newKey.id

// Update key metadata
const updated = await api<{ id: string; project_id: string; updated: boolean }>(
  'PATCH', `/v1/keys/${keyId}`, {
    description: 'Main greeting — shown on the home screen',
  }
)
console.log('updated key:', updated)

// ── Translations ──────────────────────────────────────────────────────────────

// Upsert translation value (creates or overwrites the language+key pair)
const upsertedEn = await api<TranslationResult>(
  'PUT', `/v1/keys/${keyId}/translations/en`, {
    value: 'Welcome',
    status: 'approved',
  }
)
console.log('upserted en:', upsertedEn)

await api<TranslationResult>('PUT', `/v1/keys/${keyId}/translations/de`, {
  value: 'Willkommen',
  status: 'approved',
})

// Delete a single translation value
await api<{ deleted: boolean }>('DELETE', `/v1/keys/${keyId}/translations/de`)
console.log('deleted de translation')

// ── Cache ─────────────────────────────────────────────────────────────────────

// Trigger a cache rebuild (returns 202 — async)
const rebuild = await api<{ status: string; message: string }>(
  'POST', '/v1/cache/rebuild'
)
console.log('rebuild queued:', rebuild)

// Poll until ready
let cacheReady = false
while (!cacheReady) {
  const cacheStatus = await api<CacheStatus>('GET', '/v1/cache/status')
  console.log('cache status:', cacheStatus)
  cacheReady = cacheStatus.ready
  if (!cacheReady) await new Promise(r => setTimeout(r, 3000))
}
console.log('cache is ready — serve translations from /v1/cached/*')

// ── Cleanup ───────────────────────────────────────────────────────────────────

// Soft-delete a key
await api<{ deleted: boolean }>('DELETE', `/v1/keys/${keyId}`)
console.log('deleted key:', keyId)

// Remove a language (also deletes all its translation values)
await api<{ deleted: boolean }>('DELETE', '/v1/languages/de')
console.log('removed language: de')
