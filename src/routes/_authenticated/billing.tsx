import { createFileRoute } from "@tanstack/react-router";
import { BillingPage } from "@/features/billing/BillingPage";

export const Route = createFileRoute("/_authenticated/billing")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Billing — Trackdub Portal" },
      { name: "description", content: "Trackdub subscription, usage, and invoices." },
      { property: "og:title", content: "Billing — Trackdub Portal" },
      { property: "og:description", content: "Trackdub subscription, usage, and invoices." },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: BillingPage,
});
