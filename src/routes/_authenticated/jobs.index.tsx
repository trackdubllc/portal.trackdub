import { createFileRoute } from "@tanstack/react-router";
import { JobsListPage } from "@/features/jobs/JobsListPage";

export const Route = createFileRoute("/_authenticated/jobs/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Jobs — Trackdub Portal" },
      { name: "description", content: "Browse and manage Trackdub dubbing jobs." },
      { property: "og:title", content: "Jobs — Trackdub Portal" },
      { property: "og:description", content: "Browse and manage Trackdub dubbing jobs." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: JobsListPage,
});
