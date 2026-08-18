import { describe, it, expect } from "vitest";
import { flatten, unflatten } from "./flatten.js";

describe("flatten/unflatten", () => {
  it("flattens nested keys with dot notation", () => {
    expect(flatten({ greeting: { hello: "Hello", bye: "Bye" } })).toEqual({
      "greeting.hello": "Hello",
      "greeting.bye": "Bye",
    });
  });

  it("leaves top-level string keys alone", () => {
    expect(flatten({ title: "Welcome" })).toEqual({ title: "Welcome" });
  });

  it("round-trips through unflatten", () => {
    const nested = { a: { b: { c: "deep" } }, top: "shallow" };
    expect(unflatten(flatten(nested))).toEqual(nested);
  });

  it("handles an empty object", () => {
    expect(flatten({})).toEqual({});
    expect(unflatten({})).toEqual({});
  });
});
