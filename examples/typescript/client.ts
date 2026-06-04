// client.ts — typed i18nme client
// Works in Node.js 18+, Deno, Bun, and modern browsers.

const BASE_URL = 'https://sapi.i18nme.com'

export interface Language {
  code: string
  name: string
  iso: string
}

export interface Manifest {
  languages: Language[]
}

/** Nested translation map: { namespace: { key: value } } */
export type TranslationBundle = Record<string, Record<string, string>>

export interface I18nClientOptions {
  /** Your project API key (key_live_…). Falls back to process.env.I18N_API_KEY */
  apiKey?: string
  /** In-memory TTL in ms. Set to 0 to disable caching. Default: 5 minutes */
  ttlMs?: number
}

export function createI18nClient(options: I18nClientOptions = {}) {
  const { ttlMs = 5 * 60 * 1000, apiKey } = options
  const cache = new Map<string, { data: unknown; ts: number }>()

  function resolveKey(): string {
    const key =
      apiKey ??
      (typeof process !== 'undefined' ? process.env.I18N_API_KEY : undefined)
    if (!key) throw new Error('i18nme: API key is not set')
    return key
  }

  async function get<T>(path: string): Promise<T> {
    if (ttlMs > 0) {
      const hit = cache.get(path)
      if (hit && Date.now() - hit.ts < ttlMs) return hit.data as T
    }

    const res = await fetch(`${BASE_URL}${path}`, {
      headers: { 'X-API-Key': resolveKey() },
    })

    if (res.status === 429) {
      const after = res.headers.get('Retry-After') ?? '86400'
      throw new Error(`i18nme: rate limited — retry after ${after}s`)
    }
    if (!res.ok) {
      throw new Error(`i18nme: API error ${res.status}: ${await res.text()}`)
    }

    const data = (await res.json()) as T
    if (ttlMs > 0) cache.set(path, { data, ts: Date.now() })
    return data
  }

  return {
    /** Returns available languages for the project */
    manifest: (): Promise<Manifest> =>
      get<Manifest>('/v1/cached/manifest'),

    /** Returns all translations for a language */
    translations: (lang: string): Promise<TranslationBundle> =>
      get<TranslationBundle>(`/v1/cached/translations/${lang}`),

    /** Returns translations for a single namespace */
    translationGroup: (
      lang: string,
      group: string,
    ): Promise<Record<string, string>> =>
      get<Record<string, string>>(`/v1/cached/translations/${lang}/${group}`),

    /** Returns the value of a single key */
    translationKey: async (
      lang: string,
      group: string,
      key: string,
    ): Promise<string> => {
      const data = await get<{ key: string; value: string; language: string }>(
        `/v1/cached/translations/${lang}/${group}/${key}`,
      )
      return data.value
    },

    clearCache: () => cache.clear(),
  }
}
