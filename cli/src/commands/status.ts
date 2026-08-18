import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";

import { loadConfig, localeFilePath, type I18nmeConfig } from "../config.js";
import { getAdapter } from "../adapters/index.js";
import { fetchTranslations, ApiError } from "../api-client.js";

export interface StatusOptions {
  apiKey: string;
  check: boolean; // exit non-zero if anything is missing
}

interface LocaleStatus {
  locale: string;
  total: number;
  translated: number;
  missing: string[];
}

async function readSourceKeys(config: I18nmeConfig, cwd: string): Promise<string[]> {
  const sourcePath = localeFilePath(config, config.sourceLocale, cwd);
  if (!existsSync(sourcePath)) return [];
  const adapter = getAdapter(config.format);
  return Object.keys(adapter.parse(await readFile(sourcePath, "utf-8"), config.sourceLocale));
}

export async function runStatus(options: StatusOptions, cwd: string = process.cwd()): Promise<void> {
  const config = await loadConfig(cwd);
  const sourceKeys = await readSourceKeys(config, cwd);

  if (sourceKeys.length === 0) {
    console.log("No source keys found locally — nothing to check.");
    return;
  }

  const statuses: LocaleStatus[] = [];

  for (const locale of config.targetLocales) {
    if (locale === config.sourceLocale) continue;

    let translatedKeys = new Set<string>();
    try {
      const res = await fetchTranslations(config.apiBaseUrl, options.apiKey, locale, "approved");
      translatedKeys = new Set(Object.keys(res.translations));
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        // No translations at all yet for this locale — everything is missing.
        translatedKeys = new Set();
      } else if (err instanceof ApiError) {
        console.error(`Could not fetch status for "${locale}": ${err.message}`);
        process.exitCode = 1;
        continue;
      } else {
        throw err;
      }
    }

    const missing = sourceKeys.filter((key) => !translatedKeys.has(key));
    statuses.push({
      locale,
      total: sourceKeys.length,
      translated: sourceKeys.length - missing.length,
      missing,
    });
  }

  let anyMissing = false;
  for (const s of statuses) {
    const pct = s.total === 0 ? 100 : Math.round((s.translated / s.total) * 100);
    console.log(`${s.locale}: ${s.translated}/${s.total} (${pct}%)`);
    if (s.missing.length > 0) {
      anyMissing = true;
      const shown = s.missing.slice(0, 10);
      for (const key of shown) console.log(`  missing: ${key}`);
      if (s.missing.length > shown.length) {
        console.log(`  ... and ${s.missing.length - shown.length} more`);
      }
    }
  }

  if (options.check && anyMissing) {
    process.exitCode = 1;
  }
}
