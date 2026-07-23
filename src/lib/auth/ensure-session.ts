import { authService, type Session } from "./auth-service";

/**
 * Awaitable, memoized session source used by TanStack route guards.
 *
 * `beforeLoad` MUST await `ensureSession()` before deciding whether to
 * redirect — never treat "still loading" as unauthenticated. Concurrent
 * callers share a single in-flight request; the result is cached until
 * `invalidateSession()` is called (on sign-in, sign-out, or 401 recovery).
 */

let cached: Promise<Session | null> | null = null;

export function ensureSession(): Promise<Session | null> {
  if (cached) return cached;
  cached = authService.getSession().catch(() => null);
  return cached;
}

export function invalidateSession(): void {
  cached = null;
}

export function setSession(session: Session | null): void {
  cached = Promise.resolve(session);
}
