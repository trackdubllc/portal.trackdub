import { authService, SessionTransientError, type Session } from "./auth-service";

/**
 * Awaitable, memoized session source used by TanStack route guards.
 *
 * `beforeLoad` MUST await `ensureSession()` before deciding whether to
 * redirect — never treat "still loading" as unauthenticated. Concurrent
 * callers share a single in-flight request; the result is cached until
 * `invalidateSession()` is called (on sign-in, sign-out, or 401 recovery).
 *
 * A global `unauthorized` event lets any code (API client, upload XHR,
 * background jobs) signal that the server rejected the session cookie.
 * The root component subscribes and drives cache teardown + redirect.
 */

let cached: Promise<Session | null> | null = null;

export function ensureSession(): Promise<Session | null> {
  if (cached) return cached;
  cached = authService.getSession().catch((error: unknown) => {
    cached = null;
    throw error;
  });
  return cached;
}

export async function getSessionStatus(): Promise<{
  session: Session | null;
  error: Error | null;
}> {
  try {
    return { session: await ensureSession(), error: null };
  } catch (error) {
    return {
      session: null,
      error:
        error instanceof SessionTransientError
          ? error
          : new SessionTransientError("Could not verify your session. Retry shortly."),
    };
  }
}

export function invalidateSession(): void {
  cached = null;
}

export function setSession(session: Session | null): void {
  cached = Promise.resolve(session);
}

// ── Unauthorized event bus ───────────────────────────────────────────────────

type UnauthorizedListener = () => void;
const listeners = new Set<UnauthorizedListener>();

export function onUnauthorized(listener: UnauthorizedListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Call from any fetch/XHR path when the server returns 401. Clears the
 * memoized session and notifies subscribers (the root component navigates
 * to /login and clears the query cache).
 */
export function notifyUnauthorized(): void {
  invalidateSession();
  for (const listener of Array.from(listeners)) {
    try {
      listener();
    } catch {
      // Swallow — one bad listener must not block the rest.
    }
  }
}
