import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Portal entry: resolves the session, then redirects to /dashboard or /login.
 * `beforeLoad` awaits the memoized session source — never treats "still
 * loading" as unauthenticated.
 */
export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    let session = null;
    try {
      session = await context.auth.ensureSession();
    } catch {
      /* Root auth UI exposes retryable outage state. */
    }
    throw redirect({ to: session?.user ? "/dashboard" : "/login" });
  },
  component: () => null,
});
