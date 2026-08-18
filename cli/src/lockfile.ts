/**
 * Local diff state: `key -> sha256(source_text)` as of the last successful
 * `sync`. This is what makes sync diff-only on the client side — the server
 * additionally re-checks via translation memory as a backstop (see
 * portal-service/app/routers/cli_translate.py), so a wrong/missing lockfile
 * costs an extra round trip, not a correctness bug.
 */
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

export const LOCKFILE_NAME = ".i18nme-lock.json";

export interface LockfileData {
  version: 1;
  /** key -> sha256(source_text) as of the last successful sync */
  keys: Record<string, string>;
}

export function hashSource(sourceText: string): string {
  return createHash("sha256").update(sourceText, "utf-8").digest("hex");
}

export function lockfilePath(cwd: string = process.cwd()): string {
  return path.join(cwd, LOCKFILE_NAME);
}

export async function loadLockfile(cwd: string = process.cwd()): Promise<LockfileData> {
  const filePath = lockfilePath(cwd);
  if (!existsSync(filePath)) {
    return { version: 1, keys: {} };
  }
  try {
    const parsed = JSON.parse(await readFile(filePath, "utf-8"));
    if (parsed && typeof parsed === "object" && parsed.keys) {
      return { version: 1, keys: parsed.keys };
    }
  } catch {
    // Corrupt lockfile — treat as empty. Every key looks "changed" once,
    // which is safe (just an extra sync pass), never destructive.
  }
  return { version: 1, keys: {} };
}

export async function saveLockfile(data: LockfileData, cwd: string = process.cwd()): Promise<void> {
  await writeFile(lockfilePath(cwd), JSON.stringify(data, null, 2) + "\n", "utf-8");
}

/** Returns the keys whose source text differs from the lockfile (new or changed). */
export function diffChangedKeys(
  sourceEntries: Record<string, string>,
  lockfile: LockfileData
): string[] {
  const changed: string[] = [];
  for (const [key, sourceText] of Object.entries(sourceEntries)) {
    const lockedHash = lockfile.keys[key];
    if (lockedHash !== hashSource(sourceText)) {
      changed.push(key);
    }
  }
  return changed;
}
