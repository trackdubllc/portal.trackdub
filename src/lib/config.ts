/**
 * Public build configuration. Compiled into the browser bundle — not secret.
 *
 * VITE_API_BASE_URL is the origin of the Trackdub Cloudflare Worker
 * (Better Auth + D1). Override via a .env / build env; defaults to production.
 */
export const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "https://api.trackdub.com";

export const APP_ENV: string =
  (import.meta.env.VITE_APP_ENV as string | undefined) ?? "production";
