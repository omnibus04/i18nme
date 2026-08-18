import type { FlatDict } from "../flatten.js";

/**
 * A locale-file adapter is a thin format-transform layer: parse a file's
 * raw content into flat dot-notation `key -> source/target text` entries,
 * and serialize entries back into that format. Everything else in the CLI
 * (diffing, syncing, quota) operates purely on FlatDict and never needs to
 * know which format is in play.
 */
export interface LocaleFileAdapter {
  /** Unique format id — matches i18nme.config.json's "format" field. */
  readonly id: string;
  parse(content: string, locale: string): FlatDict;
  serialize(entries: FlatDict, locale: string): string;
}
