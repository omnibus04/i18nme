import { nextIntlI18nextAdapter } from "./next-intl-i18next.js";
import { flutterArbAdapter } from "./flutter-arb.js";
import { railsYamlAdapter } from "./rails-yaml.js";
import type { LocaleFileAdapter } from "./adapter.js";

export type { LocaleFileAdapter } from "./adapter.js";

const ADAPTERS: LocaleFileAdapter[] = [nextIntlI18nextAdapter, flutterArbAdapter, railsYamlAdapter];

export function getAdapter(formatId: string): LocaleFileAdapter {
  const adapter = ADAPTERS.find((a) => a.id === formatId);
  if (!adapter) {
    const known = ADAPTERS.map((a) => a.id).join(", ");
    throw new Error(`Unknown format "${formatId}" in i18nme.config.json. Supported formats: ${known}`);
  }
  return adapter;
}
