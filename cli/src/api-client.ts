/**
 * HTTP clients for the two backends the CLI talks to:
 *   - api-service (read-only): manifest + translations, used by `status`/--check.
 *   - portal-service (write, costs translation units): `/cli/sync`, used by `sync`.
 *
 * Both are authenticated with the same project-scoped X-API-Key.
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function parseErrorBody(res: Response): Promise<{ message: string; code?: string }> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    const detail = body.detail;
    if (typeof detail === "string") return { message: detail };
    if (detail && typeof detail === "object") {
      const d = detail as Record<string, unknown>;
      return { message: (d.message as string) ?? res.statusText, code: d.code as string | undefined };
    }
  } catch {
    // fall through to plain status text
  }
  return { message: res.statusText };
}

async function request<T>(url: string, apiKey: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    const { message, code } = await parseErrorBody(res);
    throw new ApiError(message, res.status, code);
  }

  return (await res.json()) as T;
}

// ── api-service (read-only) ─────────────────────────────────────────────────

export interface ManifestLanguage {
  code: string;
  name: string;
  iso: string;
  approved_count: number;
}

export interface ManifestResponse {
  project_id: string;
  languages: ManifestLanguage[];
}

export async function fetchManifest(apiBaseUrl: string, apiKey: string): Promise<ManifestResponse> {
  return request<ManifestResponse>(`${apiBaseUrl}/v1/manifest`, apiKey);
}

export interface TranslationEntry {
  value: string;
  status: string;
  group?: string;
}

export interface TranslationsResponse {
  project_id: string;
  language: string;
  status_filter: string;
  count: number;
  translations: Record<string, TranslationEntry | string>;
}

export async function fetchTranslations(
  apiBaseUrl: string,
  apiKey: string,
  language: string,
  statusFilter: "approved" | "all" = "all"
): Promise<TranslationsResponse> {
  return request<TranslationsResponse>(
    `${apiBaseUrl}/v1/translations/${encodeURIComponent(language)}?status=${statusFilter}`,
    apiKey
  );
}

// ── portal-service (sync — costs translation units) ─────────────────────────

export interface SyncKeyInput {
  key: string;
  source_text: string;
  group?: string;
  description?: string | null;
}

export interface SyncResult {
  translated: number;
  skipped: number;
  errors: number;
  provider: string;
  results: Array<{ key: string; translated: Record<string, string>; errors: Record<string, string> }>;
}

export async function syncKeys(
  portalBaseUrl: string,
  apiKey: string,
  keys: SyncKeyInput[],
  targetLanguages: string[],
  overwrite: boolean,
  idempotencyKey?: string
): Promise<SyncResult> {
  return request<SyncResult>(`${portalBaseUrl}/cli/sync`, apiKey, {
    method: "POST",
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : undefined,
    body: JSON.stringify({ keys, target_languages: targetLanguages, overwrite }),
  });
}
