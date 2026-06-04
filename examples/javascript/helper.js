// helper.js — reusable i18nme client module
//
// Usage:
//   import { manifest, translations, translationGroup, translationKey } from './helper.js'

const BASE_URL = 'https://sapi.i18nme.com'

function getHeaders() {
  const key = process.env.I18N_API_KEY
  if (!key) throw new Error('I18N_API_KEY environment variable is not set')
  return { 'X-API-Key': key }
}

async function apiFetch(path) {
  const res = await fetch(`${BASE_URL}${path}`, { headers: getHeaders() })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`i18nme API error ${res.status}: ${body}`)
  }
  return res.json()
}

/**
 * Returns the project manifest (available languages).
 * @returns {Promise<{ languages: { code: string; name: string; iso: string }[] }>}
 */
export const manifest = () =>
  apiFetch('/v1/cached/manifest')

/**
 * Returns all translations for a language.
 * @param {string} lang  Language code, e.g. 'en'
 * @returns {Promise<Record<string, Record<string, string>>>}
 */
export const translations = (lang) =>
  apiFetch(`/v1/cached/translations/${lang}`)

/**
 * Returns translations for a single namespace.
 * @param {string} lang   Language code
 * @param {string} group  Namespace (first dot segment of the key)
 * @returns {Promise<Record<string, string>>}
 */
export const translationGroup = (lang, group) =>
  apiFetch(`/v1/cached/translations/${lang}/${group}`)

/**
 * Returns the value of a single translation key.
 * @param {string} lang   Language code
 * @param {string} group  Namespace
 * @param {string} key    Key name (without namespace prefix)
 * @returns {Promise<string>}
 */
export const translationKey = async (lang, group, key) => {
  const data = await apiFetch(`/v1/cached/translations/${lang}/${group}/${key}`)
  return data.value
}
