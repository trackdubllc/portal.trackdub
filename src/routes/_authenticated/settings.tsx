import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/settings/SettingsPage";

export const Route = createFileRoute("/_authenticated/settings")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Settings — Trackdub Portal" },
      { name: "description", content: "Manage Trackdub API keys and webhook endpoints." },
      { property: "og:title", content: "Settings — Trackdub Portal" },
      { property: "og:description", content: "Manage Trackdub API keys and webhook endpoints." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: SettingsPage,
});
