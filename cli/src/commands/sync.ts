import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

import { loadConfig, localeFilePath, type I18nmeConfig } from "../config.js";
import { getAdapter, type LocaleFileAdapter } from "../adapters/index.js";
import type { FlatDict } from "../flatten.js";
import { loadLockfile, saveLockfile, diffChangedKeys, hashSource } from "../lockfile.js";
import { syncKeys, ApiError, type SyncKeyInput } from "../api-client.js";

export interface SyncOptions {
  apiKey: string;
  overwrite: boolean;
  force: boolean; // ignore the lockfile — resync every key
}

async function readLocaleFile(filePath: string, locale: string, adapter: LocaleFileAdapter): Promise<FlatDict> {
  if (!existsSync(filePath)) return {};
  return adapter.parse(await readFile(filePath, "utf-8"), locale);
}

async function writeLocaleFile(
  filePath: string,
  entries: FlatDict,
  locale: string,
  adapter: LocaleFileAdapter
): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, adapter.serialize(entries, locale), "utf-8");
}

export async function runSync(options: SyncOptions, cwd: string = process.cwd()): Promise<void> {
  const config: I18nmeConfig = await loadConfig(cwd);
  const adapter = getAdapter(config.format);
  const sourcePath = localeFilePath(config, config.sourceLocale, cwd);
  const sourceEntries = await readLocaleFile(sourcePath, config.sourceLocale, adapter);

  if (Object.keys(sourceEntries).length === 0) {
    console.log(`No keys found in ${path.relative(cwd, sourcePath)} — nothing to sync.`);
    return;
  }

  const lockfile = await loadLockfile(cwd);
  const changedKeys = options.force ? Object.keys(sourceEntries) : diffChangedKeys(sourceEntries, lockfile);

  if (changedKeys.length === 0) {
    console.log("No source strings changed since the last sync. Nothing to do.");
    return;
  }

  console.log(
    `Syncing ${changedKeys.length} changed key(s) of ${Object.keys(sourceEntries).length} total -> [${config.targetLocales.join(", ")}]`
  );

  const keysPayload: SyncKeyInput[] = changedKeys.map((key) => ({
    key,
    source_text: sourceEntries[key],
  }));

  let result;
  try {
    result = await syncKeys(
      config.portalBaseUrl,
      options.apiKey,
      keysPayload,
      config.targetLocales,
      options.overwrite,
      randomUUID() // fresh per invocation; a retried CI run reuses the same process env in most runners, but if not, at worst it re-reserves — this key mainly protects against network-layer retries within one invocation
    );
  } catch (err) {
    if (err instanceof ApiError) {
      if (err.status === 402) {
        console.error(`Quota exceeded: ${err.message}`);
        console.error("Upgrade your plan or wait for the monthly reset.");
      } else if (err.status === 503) {
        console.error(`Translation temporarily unavailable: ${err.message}`);
      } else {
        console.error(`Sync failed (${err.status}${err.code ? ` ${err.code}` : ""}): ${err.message}`);
      }
      process.exitCode = 1;
      return;
    }
    throw err;
  }

  // Merge results into each target locale file, preserving untouched keys.
  for (const targetLocale of config.targetLocales) {
    if (targetLocale === config.sourceLocale) continue;
    const targetPath = localeFilePath(config, targetLocale, cwd);
    const existing = await readLocaleFile(targetPath, targetLocale, adapter);

    for (const keyResult of result.results) {
      const translated = keyResult.translated[targetLocale];
      if (translated !== undefined) {
        existing[keyResult.key] = translated;
      }
    }

    await writeLocaleFile(targetPath, existing, targetLocale, adapter);
  }

  // Catch the lockfile up on every key in the source file (not just the
  // ones just synced) — correctly reflects "nothing left to do" next run.
  for (const [key, text] of Object.entries(sourceEntries)) {
    lockfile.keys[key] = hashSource(text);
  }
  await saveLockfile(lockfile, cwd);

  console.log(`Translated: ${result.translated}  Skipped: ${result.skipped}  Errors: ${result.errors}  (provider: ${result.provider})`);

  if (result.errors > 0) {
    for (const keyResult of result.results) {
      for (const [lang, message] of Object.entries(keyResult.errors)) {
        console.error(`  ${keyResult.key} [${lang}]: ${message}`);
      }
    }
  }
}
