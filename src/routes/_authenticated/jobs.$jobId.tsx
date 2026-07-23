import { createFileRoute } from "@tanstack/react-router";
import { JobDetailPage } from "@/features/jobs/JobDetailPage";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Job — Trackdub Portal" },
      { name: "description", content: "Trackdub dubbing job details, status, and download." },
      { property: "og:title", content: "Job — Trackdub Portal" },
      { property: "og:description", content: "Trackdub dubbing job details, status, and download." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: JobDetailPage,
});
