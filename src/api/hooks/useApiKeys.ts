import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";
import { notifyUnauthorized } from "@/lib/auth/ensure-session";

/**
 * API keys hook — CRUD against `/api/keys` on api.trackdub.com.
 *
 * Assumed Worker contract (adjust in one place if the backend shape differs):
 *   GET    /api/keys                 -> { items: ApiKey[] }
 *   POST   /api/keys   { name }      -> { key: ApiKey, plaintext: string }
 *   DELETE /api/keys/{id}            -> 204
 *
 * `plaintext` is shown once at creation time; it is never re-fetchable.
 */

export interface ApiKey {
  id: string;
  name: string;
  prefix?: string | null;
  createdAt: string;
  lastUsedAt?: string | null;
  revokedAt?: string | null;
}

export interface CreatedApiKey {
  key: ApiKey;
  plaintext: string;
}

async function apiFetch<T>(
  path: string,
  init: RequestInit & { errorMessage: string },
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
    ...init,
  });
  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error("Session expired.");
  }
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new Error(body?.message ?? `${init.errorMessage} (${res.status}).`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

function parseList(raw: unknown): ApiKey[] {
  if (Array.isArray(raw)) return raw as ApiKey[];
  const items = (raw as { items?: unknown })?.items;
  return Array.isArray(items) ? (items as ApiKey[]) : [];
}

export const apiKeyKeys = {
  all: ["api-keys"] as const,
  list: () => [...apiKeyKeys.all, "list"] as const,
};

export function useApiKeys() {
  return useQuery({
    queryKey: apiKeyKeys.list(),
    queryFn: async () => {
      const raw = await apiFetch<unknown>("/api/keys", {
        method: "GET",
        errorMessage: "Failed to load API keys",
      });
      return parseList(raw);
    },
  });
}

export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string }) => {
      return apiFetch<CreatedApiKey>("/api/keys", {
        method: "POST",
        body: JSON.stringify({ name: input.name }),
        errorMessage: "Failed to create API key",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: apiKeyKeys.list() });
    },
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch<void>(`/api/keys/${encodeURIComponent(id)}`, {
        method: "DELETE",
        errorMessage: "Failed to revoke API key",
      });
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: apiKeyKeys.list() });
    },
  });
}
