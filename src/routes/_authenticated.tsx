import { createFileRoute, redirect } from "@tanstack/react-router";
import { AppLayout } from "@/layouts/AppLayout";

/**
 * Portal auth gate + shell. Awaits the memoized session before deciding.
 *
 * The Cloudflare Worker at api.trackdub.com is the authorization boundary
 * for every protected endpoint. This guard is UX only: redirect users to
 * /login when there is no session, and preserve the target URL so they
 * land back after signing in. When authenticated, render the portal shell
 * (sidebar + header) with the matched child route inside its <Outlet />.
 */
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const session = await context.auth.ensureSession();
    if (!session?.user) {
      throw redirect({
        to: "/login",
        search: { redirect: location.href },
      });
    }
  },
  component: AppLayout,
});

