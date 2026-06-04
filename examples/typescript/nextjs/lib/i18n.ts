// nextjs/lib/i18n.ts
// Next.js App Router integration.
// Drop this file into your project's lib/ directory.
//
// Requirements: Next.js 13+, Node 18+
// No extra packages needed.

import type { TranslationBundle } from '../../client'

const BASE = 'https://sapi.i18nme.com'

/**
 * Load all translations for a locale.
 * Uses Next.js ISR — translations are revalidated every 60 seconds.
 *
 * @example
 * // app/[locale]/layout.tsx
 * const t = await loadTranslations(params.locale)
 * return <p>{t.common?.welcome}</p>
 */
export async function loadTranslations(
  locale: string,
  revalidate = 60,
): Promise<TranslationBundle> {
  const res = await fetch(`${BASE}/v1/cached/translations/${locale}`, {
    headers: { 'X-API-Key': process.env.I18N_API_KEY! },
    next: { revalidate },
  })

  if (!res.ok) {
    console.error(`[i18nme] failed to load translations for "${locale}": ${res.status}`)
    return {}
  }

  return res.json()
}

/**
 * Load translations for a single namespace only.
 * More efficient when a page only needs one namespace.
 */
export async function loadGroup(
  locale: string,
  group: string,
  revalidate = 60,
): Promise<Record<string, string>> {
  const res = await fetch(`${BASE}/v1/cached/translations/${locale}/${group}`, {
    headers: { 'X-API-Key': process.env.I18N_API_KEY! },
    next: { revalidate },
  })

  if (!res.ok) return {}
  return res.json()
}

/**
 * Returns available language codes from the project manifest.
 *
 * @example
 * // Use in generateStaticParams to pre-render all locales
 * export async function generateStaticParams() {
 *   const locales = await getSupportedLocales()
 *   return locales.map(code => ({ locale: code }))
 * }
 */
export async function getSupportedLocales(): Promise<string[]> {
  const res = await fetch(`${BASE}/v1/cached/manifest`, {
    headers: { 'X-API-Key': process.env.I18N_API_KEY! },
    next: { revalidate: 3600 },
  })
  if (!res.ok) return ['en']
  const data = await res.json()
  return data.languages.map((l: { code: string }) => l.code)
}
