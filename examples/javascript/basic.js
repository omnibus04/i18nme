// basic.js — i18nme JavaScript examples
// Requires Node 18+ (built-in fetch). No extra packages needed.
//
// Usage:
//   export I18N_API_KEY="key_live_XXXX"
//   node basic.js

const BASE_URL = 'https://sapi.i18nme.com'
const API_KEY  = process.env.I18N_API_KEY

if (!API_KEY) {
  console.error('Set the I18N_API_KEY environment variable first.')
  process.exit(1)
}

const headers = { 'X-API-Key': API_KEY }

// ── Health check (no auth required) ──────────────────────────────────────────

const health = await fetch(`${BASE_URL}/health`)
console.log('health:', await health.json())
// → { status: 'ok' }

// ── Manifest — available languages ───────────────────────────────────────────

const manifestRes = await fetch(`${BASE_URL}/v1/cached/manifest`, { headers })
const { languages } = await manifestRes.json()
console.log('languages:', languages.map(l => l.code))
// → ['en', 'de', 'pl']

// ── All translations for a language ──────────────────────────────────────────

const transRes = await fetch(`${BASE_URL}/v1/cached/translations/en`, { headers })
const translations = await transRes.json()
console.log('translations:', translations)
// → { common: { welcome: 'Welcome', logout: 'Log out' }, nav: { home: 'Home' } }

// ── Translations for a single namespace ──────────────────────────────────────

const groupRes = await fetch(`${BASE_URL}/v1/cached/translations/en/common`, { headers })
const group = await groupRes.json()
console.log('common group:', group)
// → { welcome: 'Welcome', logout: 'Log out' }

// ── Single translation key ────────────────────────────────────────────────────

const keyRes = await fetch(`${BASE_URL}/v1/cached/translations/en/common/welcome`, { headers })
const key = await keyRes.json()
console.log('single key:', key.value)
// → 'Welcome'

// ── Fetch all languages in parallel ──────────────────────────────────────────

const allBundles = Object.fromEntries(
  await Promise.all(
    languages.map(async ({ code }) => {
      const res = await fetch(`${BASE_URL}/v1/cached/translations/${code}`, { headers })
      return [code, await res.json()]
    })
  )
)
console.log('all bundles:', Object.keys(allBundles))
// → ['en', 'de', 'pl']
