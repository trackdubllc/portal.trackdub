import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/config";
import { notifyUnauthorized } from "@/lib/auth/ensure-session";

/**
 * Languages hook — wires the CreateJobPage's source/target dropdowns to
 * GET `/api/languages` on api.trackdub.com. The endpoint is not in the
 * OpenAPI schema yet, so we use a small fetch here with the same
 * cookie/credentials rules as `api/client.ts`.
 *
 * Contract with the Worker (subject to backend confirmation):
 *   GET /api/languages -> 200 { items: [{ code, name }] }
 * Any other envelope is normalized in `parseLanguages`.
 */

export interface Language {
  code: string;
  name: string;
}

const FALLBACK_LANGUAGES: Language[] = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
  { code: "pt", name: "Portuguese" },
  { code: "zh", name: "Chinese" },
  { code: "ja", name: "Japanese" },
  { code: "ko", name: "Korean" },
  { code: "ru", name: "Russian" },
  { code: "ar", name: "Arabic" },
  { code: "hi", name: "Hindi" },
];

function parseLanguages(raw: unknown): Language[] {
  const asArray = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { items?: unknown })?.items)
      ? ((raw as { items: unknown[] }).items)
      : Array.isArray((raw as { languages?: unknown })?.languages)
        ? ((raw as { languages: unknown[] }).languages)
        : [];

  return asArray
    .map((entry) => {
      if (typeof entry === "string") return { code: entry, name: entry };
      const obj = entry as { code?: string; name?: string; displayName?: string };
      if (!obj || typeof obj.code !== "string") return null;
      return { code: obj.code, name: obj.name ?? obj.displayName ?? obj.code };
    })
    .filter((v): v is Language => v !== null);
}

async function fetchLanguages(signal?: AbortSignal): Promise<Language[]> {
  const res = await fetch(`${API_BASE_URL}/api/languages`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    signal,
  });
  if (res.status === 401) {
    notifyUnauthorized();
    throw new Error("Session expired.");
  }
  if (!res.ok) {
    throw new Error(`Failed to load languages (${res.status}).`);
  }
  const body = (await res.json().catch(() => null)) as unknown;
  const parsed = parseLanguages(body);
  return parsed.length > 0 ? parsed : FALLBACK_LANGUAGES;
}

export const languageKeys = {
  all: ["languages"] as const,
};

/** Fetch languages from `/api/languages`, falling back to a static BCP-47 list. */
export function useLanguages() {
  return useQuery({
    queryKey: languageKeys.all,
    queryFn: ({ signal }) => fetchLanguages(signal),
    staleTime: 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
    // If the request errors, surface the fallback so the form remains usable.
    placeholderData: FALLBACK_LANGUAGES,
  });
}

export { FALLBACK_LANGUAGES };
