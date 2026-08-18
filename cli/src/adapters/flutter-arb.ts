import type { FlatDict } from "../flatten.js";
import type { LocaleFileAdapter } from "./adapter.js";

/**
 * Flutter ARB (Application Resource Bundle): flat JSON, plain identifier
 * keys (no dot-notation nesting), `@@locale` header, and optional per-key
 * `@key` metadata objects (description, placeholders, ...) — see
 * https://github.com/google/app-resource-bundle/wiki/ApplicationResourceBundleSpecification
 *
 * Known limitation: this adapter round-trips string values only. `@key`
 * metadata (descriptions, ICU placeholder definitions) is not read or
 * re-emitted — if you rely on ARB metadata for other Flutter tooling, sync
 * into a separate file and merge, or extend this adapter.
 */
export const flutterArbAdapter: LocaleFileAdapter = {
  id: "arb",

  parse(content: string): FlatDict {
    const raw = content.trim() === "" ? {} : JSON.parse(content);
    const entries: FlatDict = {};
    for (const [key, value] of Object.entries(raw)) {
      if (key.startsWith("@")) continue; // metadata, not a translatable string
      if (typeof value === "string") {
        entries[key] = value;
      }
    }
    return entries;
  },

  serialize(entries: FlatDict, locale: string): string {
    const out: Record<string, string> = { "@@locale": locale };
    for (const key of Object.keys(entries).sort()) {
      out[key] = entries[key];
    }
    return JSON.stringify(out, null, 2) + "\n";
  },
};
