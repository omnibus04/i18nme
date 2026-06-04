// I18nProvider.tsx — React context provider for i18nme
// Fetches the full translation bundle once on mount and provides it via context.

import React, { createContext, useContext, useEffect, useState } from 'react'

const BASE = 'https://sapi.i18nme.com'

type Bundle = Record<string, Record<string, string>>

interface I18nContextValue {
  t: (dotKey: string) => string
  locale: string
  loading: boolean
  error: Error | null
}

const I18nContext = createContext<I18nContextValue>({
  t: (k) => k,
  locale: 'en',
  loading: true,
  error: null,
})

interface I18nProviderProps {
  locale: string
  apiKey: string
  fallbackLocale?: string
  children: React.ReactNode
}

// Simple module-level cache so locale bundles survive re-renders
const bundleCache = new Map<string, Bundle>()

export function I18nProvider({
  locale,
  apiKey,
  fallbackLocale = 'en',
  children,
}: I18nProviderProps) {
  const [bundle, setBundle] = useState<Bundle | null>(
    bundleCache.get(locale) ?? null,
  )
  const [loading, setLoading] = useState(!bundleCache.has(locale))
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (bundleCache.has(locale)) {
      setBundle(bundleCache.get(locale)!)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    const loadLocale = async (loc: string): Promise<Bundle> => {
      const res = await fetch(`${BASE}/v1/cached/translations/${loc}`, {
        headers: { 'X-API-Key': apiKey },
      })
      if (!res.ok) throw new Error(`i18nme: failed to load "${loc}" (${res.status})`)
      return res.json()
    }

    loadLocale(locale)
      .catch(() => {
        // Auto-fallback to fallbackLocale if the requested locale fails
        if (locale !== fallbackLocale) return loadLocale(fallbackLocale)
        throw new Error(`i18nme: could not load "${locale}"`)
      })
      .then((data) => {
        if (cancelled) return
        bundleCache.set(locale, data)
        setBundle(data)
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })

    return () => { cancelled = true }
  }, [locale, apiKey, fallbackLocale])

  const t = (dotKey: string): string => {
    if (!bundle) return dotKey
    const [group, ...rest] = dotKey.split('.')
    const key = rest.join('.')
    return bundle[group]?.[key] ?? dotKey
  }

  return (
    <I18nContext.Provider value={{ t, locale, loading, error }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
