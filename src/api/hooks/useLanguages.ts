import { useQuery } from "@tanstack/react-query";
import { apiJson, languagesSchema } from "@/api/runtime";

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

async function fetchLanguages(signal?: AbortSignal): Promise<Language[]> {
  return (await apiJson("/api/languages", languagesSchema, { signal })).items;
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
  });
}
