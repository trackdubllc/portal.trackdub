import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — Trackdub Portal" },
      { name: "description", content: "Trackdub admin dashboard: active jobs and usage." },
      { property: "og:title", content: "Dashboard — Trackdub Portal" },
      { property: "og:description", content: "Trackdub admin dashboard: active jobs and usage." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DashboardPage,
});
