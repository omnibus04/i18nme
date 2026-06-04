// with-cache.js — i18nme client with in-memory cache
//
// Caches responses for `ttlMs` milliseconds (default: 5 minutes).
// Dramatically reduces API calls in server-rendered apps.
//
// Usage:
//   import { createI18nClient } from './with-cache.js'
//   const i18n = createI18nClient({ ttlMs: 5 * 60 * 1000 })
//   const t = await i18n.translations('en')

const BASE_URL = 'https://sapi.i18nme.com'

/**
 * Creates an i18nme client with an in-memory LRU-style cache.
 * @param {{ ttlMs?: number; apiKey?: string }} options
 */
export function createI18nClient({ ttlMs = 5 * 60 * 1000, apiKey } = {}) {
  const cache = new Map()

  function getKey() {
    return apiKey ?? process.env.I18N_API_KEY
  }

  async function fetch_(path) {
    const cached = cache.get(path)
    if (cached && Date.now() - cached.ts < ttlMs) {
      return cached.data
    }

    const key = getKey()
    if (!key) throw new Error('I18N_API_KEY is not set')

    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-API-Key': key },
    })

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After') ?? '86400'
      throw new Error(`Rate limited — retry after ${retryAfter}s`)
    }

    if (!res.ok) {
      throw new Error(`i18nme API error ${res.status}: ${await res.text()}`)
    }

    const data = await res.json()
    cache.set(path, { data, ts: Date.now() })
    return data
  }

  return {
    /** @returns {Promise<{ languages: { code: string; name: string }[] }>} */
    manifest: () => fetch_('/v1/cached/manifest'),

    /** @param {string} lang */
    translations: (lang) => fetch_(`/v1/cached/translations/${lang}`),

    /** @param {string} lang @param {string} group */
    translationGroup: (lang, group) =>
      fetch_(`/v1/cached/translations/${lang}/${group}`),

    /** Clears the entire in-memory cache */
    clearCache: () => cache.clear(),
  }
}
