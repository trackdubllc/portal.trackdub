import createClient from "openapi-fetch";
import type { paths } from "./schema";
import { API_BASE_URL } from "@/lib/config";
import { notifyUnauthorized } from "@/lib/auth/ensure-session";

/**
 * Type-safe API client for the Trackdub Worker at `api.trackdub.com`.
 *
 * Auth model: the Worker issues a host-only session cookie
 * (`Secure; HttpOnly; SameSite=Lax; Path=/`). All requests must be sent with
 * `credentials: "include"` so the browser attaches that cookie cross-origin.
 * We do NOT send an `Authorization` header — the Worker is the authorization
 * boundary and reads the session from the cookie.
 */
const client = createClient<paths>({
  baseUrl: API_BASE_URL,
  credentials: "include",
});

client.use({
  async onResponse({ response }) {
    if (response.status === 401) {
      // Cookie expired/invalid. Drop the memoized session so the next
      // route guard sees an unauthenticated state and redirects to /login.
      invalidateSession();
    }
    return response;
  },
});

export const api = client;
