import { writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

import { CONFIG_FILENAME, resolveConfigPath } from "../config.js";
import { getAdapter } from "../adapters/index.js";

export interface InitOptions {
  sourceLocale: string;
  targetLocales: string[];
  files: string;
  format: string;
}

export async function runInit(options: InitOptions, cwd: string = process.cwd()): Promise<void> {
  const configPath = resolveConfigPath(cwd);
  if (existsSync(configPath)) {
    throw new Error(`${CONFIG_FILENAME} already exists in ${cwd}`);
  }

  const adapter = getAdapter(options.format); // throws early on an unknown --format

  const config = {
    sourceLocale: options.sourceLocale,
    targetLocales: options.targetLocales,
    files: options.files,
    format: options.format,
  };

  await writeFile(configPath, JSON.stringify(config, null, 2) + "\n", "utf-8");

  // Create the source locale file (empty, in the chosen format) if it
  // doesn't exist, so `i18nme sync` has something to read on the first run.
  const sourceFilePath = path.join(cwd, options.files.replace("{locale}", options.sourceLocale));
  if (!existsSync(sourceFilePath)) {
    await mkdir(path.dirname(sourceFilePath), { recursive: true });
    await writeFile(sourceFilePath, adapter.serialize({}, options.sourceLocale), "utf-8");
  }

  console.log(`Created ${CONFIG_FILENAME}`);
  console.log(`\nNext steps:`);
  console.log(`  1. Add strings to ${path.relative(cwd, sourceFilePath)}`);
  console.log(`  2. export I18NME_API_KEY=...  (from your project's API Keys page)`);
  console.log(`  3. Run \`i18nme sync\` to translate into: ${options.targetLocales.join(", ")}`);
}
