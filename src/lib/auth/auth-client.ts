import { API_BASE_URL } from "../config";

/**
 * Thin fetch wrapper for api.trackdub.com.
 *
 * - All calls use `credentials: "include"` so the browser attaches the
 *   host-only session cookie issued by api.trackdub.com.
 * - No Authorization header. No token storage in JS.
 * - The portal never reads the session cookie (HttpOnly).
 */

export type AuthClientOk<T> = { ok: true; status: number; data: T };
export type AuthClientErr = {
  ok: false;
  status: number;
  /** Provider/Worker error code when available (e.g. "INVALID_CREDENTIALS"). */
  code?: string;
  message: string;
};
export type AuthClientResult<T> = AuthClientOk<T> | AuthClientErr;

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<AuthClientResult<T>> {
  const url = `${API_BASE_URL}${path}`;
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = { Accept: "application/json", ...opts.headers };

  let body: BodyInit | undefined;
  if (opts.body !== undefined && opts.body !== null) {
    headers["Content-Type"] ??= "application/json";
    body = JSON.stringify(opts.body);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      credentials: "include",
      signal: opts.signal,
    });
  } catch (error) {
    return {
      ok: false,
      status: 0,
      code: "NETWORK_ERROR",
      message: error instanceof Error ? error.message : "Network error",
    };
  }

  const contentType = response.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const err = (payload ?? {}) as { code?: string; error?: string; message?: string };
    return {
      ok: false,
      status: response.status,
      code: err.code ?? err.error,
      message: err.message ?? err.error ?? response.statusText ?? "Request failed",
    };
  }

  return { ok: true, status: response.status, data: (payload as T) ?? (null as T) };
}

export const authClient = {
  get: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  delete: <T>(path: string, opts?: Omit<RequestOptions, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
};
