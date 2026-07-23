import { createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";

import { authService, invalidateSession, useAuth } from "../../lib/auth";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — Trackdub Portal" },
      { name: "description", content: "Trackdub admin dashboard." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { user, setLocalSession } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const router = useRouter();

  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await authService.signOut();
    invalidateSession();
    setLocalSession(null);
    await router.invalidate();
    navigate({ to: "/login", replace: true });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <h1 className="text-lg font-semibold tracking-tight">Trackdub Portal</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted-foreground">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Welcome{user?.name ? `, ${user.name}` : ""}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Portal shell is wired up. Ported pages (users, licenses, API keys, jobs) will land here.</p>
            <p>
              API base: <code className="rounded bg-muted px-1.5 py-0.5">api.trackdub.com</code>
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
