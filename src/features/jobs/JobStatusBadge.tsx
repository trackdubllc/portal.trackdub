import type { JobStatus } from "@/api/hooks/useJobs";

export interface JobStatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const statusConfig: Record<JobStatus, { label: string; dot: string; color: string }> = {
  Queued:    { label: "QUEUED",    dot: "#b8860b", color: "#7a5c00" },
  Running:   { label: "RUNNING",   dot: "#2563eb", color: "#1d4ed8" },
  Completed: { label: "DONE",      dot: "#16a34a", color: "#15803d" },
  Failed:    { label: "FAILED",    dot: "#dc2626", color: "#b91c1c" },
  Cancelled: { label: "CANCELLED", dot: "#9ca3af", color: "#6b7280" },
};

export function JobStatusBadge({ status, className = "" }: JobStatusBadgeProps) {
  const cfg = statusConfig[status] ?? statusConfig.Queued;
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-widest ${className}`}
      style={{ color: cfg.color }}
      aria-label={`Status: ${cfg.label}`}
    >
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: cfg.dot }}
        aria-hidden="true"
      />
      {cfg.label}
    </span>
  );
}
