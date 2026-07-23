import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

/**
 * Portal auth gate. Awaits the memoized session source before deciding.
 *
 * The Cloudflare Worker at api.trackdub.com is the authorization boundary
 * for every protected endpoint. This guard is UX only: redirect users to
 * /login when there is no session, and preserve the target URL so they
 * land back after signing in.
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
  component: () => <Outlet />,
});
