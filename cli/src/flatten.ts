/**
 * Flatten/unflatten nested locale JSON into dot-notation keys, matching the
 * common i18n JSON convention:
 *   {"greeting": {"hello": "Hello"}} <-> {"greeting.hello": "Hello"}
 */

export type FlatDict = Record<string, string>;
export type NestedDict = { [key: string]: string | NestedDict };

export function flatten(obj: NestedDict, prefix = ""): FlatDict {
  const out: FlatDict = {};
  for (const [key, value] of Object.entries(obj)) {
    const flatKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[flatKey] = value;
    } else if (value && typeof value === "object") {
      Object.assign(out, flatten(value, flatKey));
    }
  }
  return out;
}

export function unflatten(flat: FlatDict): NestedDict {
  const out: NestedDict = {};
  for (const [flatKey, value] of Object.entries(flat)) {
    const parts = flatKey.split(".");
    let node = out;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const existing = node[part];
      if (!existing || typeof existing === "string") {
        node[part] = {};
      }
      node = node[part] as NestedDict;
    }
    node[parts[parts.length - 1]] = value;
  }
  return out;
}
