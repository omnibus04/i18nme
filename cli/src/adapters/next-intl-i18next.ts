import { flatten, unflatten, type FlatDict } from "../flatten.js";
import type { LocaleFileAdapter } from "./adapter.js";

/**
 * next-intl / i18next: nested JSON, dot-notation keys.
 *   {"greeting": {"hello": "Hello"}} <-> "greeting.hello"
 * This is also i18nme's own default format — the core CLI was built
 * against it directly, so this adapter is a thin wrapper over flatten.ts.
 */
export const nextIntlI18nextAdapter: LocaleFileAdapter = {
  id: "json",

  parse(content: string): FlatDict {
    const raw = content.trim() === "" ? {} : JSON.parse(content);
    return flatten(raw);
  },

  serialize(entries: FlatDict): string {
    return JSON.stringify(unflatten(entries), null, 2) + "\n";
  },
};
