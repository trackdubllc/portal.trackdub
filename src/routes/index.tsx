import { createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Portal entry: resolves the session, then redirects to /dashboard or /login.
 * `beforeLoad` awaits the memoized session source — never treats "still
 * loading" as unauthenticated.
 */
export const Route = createFileRoute("/")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    const session = await context.auth.ensureSession();
    throw redirect({ to: session?.user ? "/dashboard" : "/login" });
  },
  component: () => null,
});
