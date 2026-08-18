import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { getAdapter } from "./adapters/index.js";

export const CONFIG_FILENAME = "i18nme.config.json";

export interface I18nmeConfig {
  /** Source-of-truth locale, e.g. "en". */
  sourceLocale: string;
  /** Locales to translate into, e.g. ["de", "fr", "es"]. */
  targetLocales: string[];
  /**
   * Path to locale files, with `{locale}` substituted per language.
   * e.g. "locales/{locale}.json" -> locales/en.json, locales/de.json, ...
   */
  files: string;
  /** A registered adapter id — see src/adapters/index.ts (json | arb | rails-yaml). */
  format: string;
  /** api-service base URL — read-only endpoints (status/--check). */
  apiBaseUrl: string;
  /** portal-service base URL — sync (costs translation units). */
  portalBaseUrl: string;
}

const DEFAULTS: Pick<I18nmeConfig, "format" | "apiBaseUrl" | "portalBaseUrl"> = {
  format: "json",
  apiBaseUrl: "https://api.i18nme.com",
  portalBaseUrl: "https://portal.i18nme.com",
};

export class ConfigError extends Error {}

export function resolveConfigPath(cwd: string = process.cwd()): string {
  return path.join(cwd, CONFIG_FILENAME);
}

export async function loadConfig(cwd: string = process.cwd()): Promise<I18nmeConfig> {
  const configPath = resolveConfigPath(cwd);
  if (!existsSync(configPath)) {
    throw new ConfigError(
      `No ${CONFIG_FILENAME} found in ${cwd}. Run \`i18nme init\` first.`
    );
  }

  let raw: unknown;
  try {
    raw = JSON.parse(await readFile(configPath, "utf-8"));
  } catch (err) {
    throw new ConfigError(`Could not parse ${CONFIG_FILENAME}: ${(err as Error).message}`);
  }

  const parsed = raw as Partial<I18nmeConfig>;

  if (!parsed.sourceLocale || typeof parsed.sourceLocale !== "string") {
    throw new ConfigError(`${CONFIG_FILENAME}: "sourceLocale" is required (e.g. "en")`);
  }
  if (!Array.isArray(parsed.targetLocales) || parsed.targetLocales.length === 0) {
    throw new ConfigError(`${CONFIG_FILENAME}: "targetLocales" must be a non-empty array (e.g. ["de", "fr"])`);
  }
  if (!parsed.files || typeof parsed.files !== "string" || !parsed.files.includes("{locale}")) {
    throw new ConfigError(`${CONFIG_FILENAME}: "files" must be a path containing "{locale}" (e.g. "locales/{locale}.json")`);
  }

  const format = parsed.format ?? DEFAULTS.format;
  try {
    getAdapter(format);
  } catch (err) {
    throw new ConfigError(`${CONFIG_FILENAME}: ${(err as Error).message}`);
  }

  return {
    sourceLocale: parsed.sourceLocale,
    targetLocales: parsed.targetLocales,
    files: parsed.files,
    format,
    apiBaseUrl: parsed.apiBaseUrl ?? process.env.I18NME_API_URL ?? DEFAULTS.apiBaseUrl,
    portalBaseUrl: parsed.portalBaseUrl ?? process.env.I18NME_PORTAL_URL ?? DEFAULTS.portalBaseUrl,
  };
}

export function localeFilePath(config: I18nmeConfig, locale: string, cwd: string = process.cwd()): string {
  return path.join(cwd, config.files.replace("{locale}", locale));
}
