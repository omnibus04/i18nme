import { parse as parseYaml, stringify as stringifyYaml } from "yaml";

import { flatten, unflatten, type FlatDict, type NestedDict } from "../flatten.js";
import type { LocaleFileAdapter } from "./adapter.js";

/**
 * Rails i18n YAML: nested under a single root key matching the locale code.
 *   en:
 *     greeting:
 *       hello: Hello
 * <-> "greeting.hello" (same dot-notation flattening as the JSON adapter,
 * just with the locale-keyed root stripped on parse / re-added on serialize).
 */
export const railsYamlAdapter: LocaleFileAdapter = {
  id: "rails-yaml",

  parse(content: string, locale: string): FlatDict {
    if (content.trim() === "") return {};
    const raw = (parseYaml(content) ?? {}) as NestedDict;
    // Prefer the exact locale key; fall back to the sole top-level key so a
    // mismatched/renamed locale doesn't silently produce an empty diff.
    const root = locale in raw ? raw[locale] : Object.values(raw)[0];
    if (!root || typeof root === "string") return {};
    return flatten(root as NestedDict);
  },

  serialize(entries: FlatDict, locale: string): string {
    return stringifyYaml({ [locale]: unflatten(entries) });
  },
};
