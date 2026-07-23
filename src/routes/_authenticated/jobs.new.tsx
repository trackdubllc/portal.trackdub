import { createFileRoute } from "@tanstack/react-router";
import { CreateJobPage } from "@/features/jobs/CreateJobPage";

export const Route = createFileRoute("/_authenticated/jobs/new")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "New Job — Trackdub Portal" },
      { name: "description", content: "Upload media and create a new Trackdub dubbing job." },
      { property: "og:title", content: "New Job — Trackdub Portal" },
      { property: "og:description", content: "Upload media and create a new Trackdub dubbing job." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: CreateJobPage,
});
