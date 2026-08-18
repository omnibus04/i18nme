import { describe, it, expect } from "vitest";
import { getAdapter } from "./index.js";

describe("next-intl / i18next (json) adapter", () => {
  const adapter = getAdapter("json");
  const fixture = `{
  "greeting": {
    "hello": "Hello",
    "bye": "Goodbye"
  },
  "title": "Welcome"
}
`;

  it("parses nested JSON into dot-notation entries", () => {
    expect(adapter.parse(fixture, "en")).toEqual({
      "greeting.hello": "Hello",
      "greeting.bye": "Goodbye",
      title: "Welcome",
    });
  });

  it("round-trips unchanged values through parse -> serialize -> parse", () => {
    const entries = adapter.parse(fixture, "en");
    const reparsed = adapter.parse(adapter.serialize(entries, "en"), "en");
    expect(reparsed).toEqual(entries);
  });
});

describe("Flutter ARB adapter", () => {
  const adapter = getAdapter("arb");
  const fixture = `{
  "@@locale": "en",
  "helloWorld": "Hello, World!",
  "@helloWorld": {
    "description": "Greeting shown on the home screen"
  },
  "itemCount": "Items: {count}"
}
`;

  it("parses flat ARB entries and skips @-metadata", () => {
    expect(adapter.parse(fixture, "en")).toEqual({
      helloWorld: "Hello, World!",
      itemCount: "Items: {count}",
    });
  });

  it("serializes with an @@locale header", () => {
    const out = JSON.parse(adapter.serialize({ hello: "Hello" }, "de"));
    expect(out["@@locale"]).toBe("de");
    expect(out.hello).toBe("Hello");
  });

  it("round-trips string values (metadata is a documented non-goal)", () => {
    const entries = adapter.parse(fixture, "en");
    const reparsed = adapter.parse(adapter.serialize(entries, "en"), "en");
    expect(reparsed).toEqual(entries);
  });
});

describe("Rails YAML adapter", () => {
  const adapter = getAdapter("rails-yaml");
  const fixture = `en:\n  greeting:\n    hello: Hello\n  title: Welcome\n`;

  it("parses YAML nested under the locale root key into dot-notation entries", () => {
    expect(adapter.parse(fixture, "en")).toEqual({
      "greeting.hello": "Hello",
      title: "Welcome",
    });
  });

  it("serializes back under the locale root key", () => {
    const out = adapter.serialize({ "greeting.hello": "Hallo" }, "de");
    expect(out).toContain("de:");
    const reparsed = adapter.parse(out, "de");
    expect(reparsed).toEqual({ "greeting.hello": "Hallo" });
  });

  it("round-trips unchanged values through parse -> serialize -> parse", () => {
    const entries = adapter.parse(fixture, "en");
    const reparsed = adapter.parse(adapter.serialize(entries, "en"), "en");
    expect(reparsed).toEqual(entries);
  });

  it("falls back to the sole top-level key if it doesn't match the given locale", () => {
    // Guards against a renamed/mismatched locale silently producing an empty diff.
    expect(adapter.parse(fixture, "en-US")).toEqual({
      "greeting.hello": "Hello",
      title: "Welcome",
    });
  });
});
