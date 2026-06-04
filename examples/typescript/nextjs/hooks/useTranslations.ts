// nextjs/hooks/useTranslations.ts
// Client-side React hook for i18nme translations.
// Suitable for CSR pages or components that load translations after hydration.
//
// Usage:
//   const { t, loading } = useTranslations('en')
//   if (loading) return <Spinner />
//   return <p>{t('common.welcome')}</p>

'use client'

import { useEffect, useState, useCallback } from 'react'
import type { TranslationBundle } from '../../client'

const BASE = 'https://sapi.i18nme.com'
const cache = new Map<string, TranslationBundle>()

export function useTranslations(locale: string, apiKey: string) {
  const [bundle, setBundle] = useState<TranslationBundle | null>(
    cache.get(locale) ?? null,
  )
  const [loading, setLoading] = useState(!cache.has(locale))
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (cache.has(locale)) {
      setBundle(cache.get(locale)!)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch(`${BASE}/v1/cached/translations/${locale}`, {
      headers: { 'X-API-Key': apiKey },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error(`i18nme: ${res.status}`)
        return res.json() as Promise<TranslationBundle>
      })
      .then((data) => {
        if (cancelled) return
        cache.set(locale, data)
        setBundle(data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [locale, apiKey])

  /**
   * Look up a dot-notated key, e.g. t('common.welcome')
   * Returns the key itself if not found (graceful fallback).
   */
  const t = useCallback(
    (dotKey: string): string => {
      if (!bundle) return dotKey
      const [group, ...rest] = dotKey.split('.')
      const key = rest.join('.')
      return bundle[group]?.[key] ?? dotKey
    },
    [bundle],
  )

  return { t, loading, error }
}
