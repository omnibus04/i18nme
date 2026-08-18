#!/usr/bin/env node
import { Command } from "commander";

import { runInit } from "./commands/init.js";
import { runSync } from "./commands/sync.js";
import { runStatus } from "./commands/status.js";
import { ConfigError } from "./config.js";

const program = new Command();

program
  .name("i18nme")
  .description("Translation as a build step, not a dashboard you log into.")
  .version("0.1.0");

program
  .command("init")
  .description("Create an i18nme.config.json in the current directory")
  .requiredOption("-s, --source-locale <locale>", "source locale code (e.g. en)")
  .requiredOption("-t, --target-locales <locales>", "comma-separated target locale codes (e.g. de,fr,es)")
  .option("-f, --files <pattern>", "locale file path pattern", "locales/{locale}.json")
  .option(
    "--format <format>",
    "locale file format: json (next-intl/i18next), arb (Flutter), or rails-yaml (Rails)",
    "json"
  )
  .action(async (opts) => {
    await runInit({
      sourceLocale: opts.sourceLocale,
      targetLocales: String(opts.targetLocales).split(",").map((l: string) => l.trim()).filter(Boolean),
      files: opts.files,
      format: opts.format,
    });
  });

program
  .command("sync")
  .description("Translate changed source strings and write results to target locale files")
  .option("--api-key <key>", "project API key (defaults to $I18NME_API_KEY)")
  .option("--overwrite", "overwrite existing translations, not just missing ones", false)
  .option("--force", "resync every key, ignoring the local diff lockfile", false)
  .action(async (opts) => {
    const apiKey = opts.apiKey ?? process.env.I18NME_API_KEY;
    if (!apiKey) {
      console.error("Missing API key. Pass --api-key or set I18NME_API_KEY.");
      process.exitCode = 1;
      return;
    }
    await runSync({ apiKey, overwrite: Boolean(opts.overwrite), force: Boolean(opts.force) });
  });

program
  .command("status")
  .description("Show translation completeness per target locale")
  .option("--api-key <key>", "project API key (defaults to $I18NME_API_KEY)")
  .option("--check", "exit non-zero if any target locale is missing translations (for CI)", false)
  .action(async (opts) => {
    const apiKey = opts.apiKey ?? process.env.I18NME_API_KEY;
    if (!apiKey) {
      console.error("Missing API key. Pass --api-key or set I18NME_API_KEY.");
      process.exitCode = 1;
      return;
    }
    await runStatus({ apiKey, check: Boolean(opts.check) });
  });

try {
  await program.parseAsync(process.argv);
} catch (err) {
  if (err instanceof ConfigError) {
    console.error(err.message);
  } else {
    console.error(err instanceof Error ? err.message : String(err));
  }
  process.exitCode = 1;
}
