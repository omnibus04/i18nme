import { describe, it, expect } from "vitest";
import { diffChangedKeys, hashSource, type LockfileData } from "./lockfile.js";

describe("diffChangedKeys", () => {
  it("treats every key as changed against an empty lockfile", () => {
    const lockfile: LockfileData = { version: 1, keys: {} };
    const changed = diffChangedKeys({ hello: "Hello", bye: "Bye" }, lockfile);
    expect(changed.sort()).toEqual(["bye", "hello"]);
  });

  it("skips keys whose hash matches the lockfile", () => {
    const lockfile: LockfileData = { version: 1, keys: { hello: hashSource("Hello") } };
    const changed = diffChangedKeys({ hello: "Hello", bye: "Bye" }, lockfile);
    expect(changed).toEqual(["bye"]);
  });

  it("flags a key whose text changed even if the lockfile has a stale hash", () => {
    const lockfile: LockfileData = { version: 1, keys: { hello: hashSource("Hi") } };
    const changed = diffChangedKeys({ hello: "Hello" }, lockfile);
    expect(changed).toEqual(["hello"]);
  });

  it("reports no changes once everything matches", () => {
    const source = { hello: "Hello", bye: "Bye" };
    const lockfile: LockfileData = {
      version: 1,
      keys: { hello: hashSource("Hello"), bye: hashSource("Bye") },
    };
    expect(diffChangedKeys(source, lockfile)).toEqual([]);
  });
});
