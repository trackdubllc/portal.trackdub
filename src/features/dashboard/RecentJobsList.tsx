import { useNavigate } from "@/lib/router-compat";
import { Card, Button } from "@/components/portal";
import type { Job, JobStatus } from "@/api/hooks/useJobs";

interface RecentJobsListProps {
  jobs: Job[];
}

const statusDot: Record<JobStatus, string> = {
  Queued:    "#b8860b",
  Running:   "#2563eb",
  Completed: "#16a34a",
  Failed:    "#dc2626",
  Cancelled: "#9ca3af",
};

const statusLabel: Record<JobStatus, string> = {
  Queued:    "QUEUED",
  Running:   "RUNNING",
  Completed: "DONE",
  Failed:    "FAILED",
  Cancelled: "CANCELLED",
};

function formatDate(isoDate: string): string {
  return new Date(isoDate).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function RecentJobsList({ jobs }: RecentJobsListProps) {
  const navigate = useNavigate();

  return (
    <Card title="Recent Jobs">
      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <p className="mb-1 text-sm font-medium" style={{ color: "#1c1c1a" }}>No jobs yet</p>
          <p className="mb-4 text-xs" style={{ color: "#8a8a82" }}>Create your first job to see it here</p>
          <Button size="sm" onClick={() => navigate("/jobs/new")}>Upload New Job</Button>
        </div>
      ) : (
        <table className="w-full text-sm" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e0dbd2" }}>
              <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8a8a82", paddingRight: "16px" }}>Project</th>
              <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8a8a82", paddingRight: "16px" }}>Target</th>
              <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8a8a82", paddingRight: "16px" }}>Created</th>
              <th className="pb-2 text-left text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8a8a82" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr
                key={job.id}
                className="cursor-pointer transition-colors"
                style={{ borderBottom: "1px solid #f0ede8" }}
                onClick={() => navigate(`/jobs/${job.id}`)}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f9f7f3"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = ""; }}
              >
                <td className="py-2.5 font-medium" style={{ color: "#1c1c1a", paddingRight: "16px" }}>
                  {job.projectName}
                </td>
                <td className="py-2.5 font-mono text-xs" style={{ color: "#6b6b5e", paddingRight: "16px" }}>
                  {job.targetLanguage || "—"}
                </td>
                <td className="py-2.5 font-mono text-xs" style={{ color: "#6b6b5e", paddingRight: "16px" }}>
                  {formatDate(job.createdAt)}
                </td>
                <td className="py-2.5">
                  <span
                    className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-widest"
                    style={{ color: statusDot[job.status] }}
                  >
                    <span
                      className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ background: statusDot[job.status] }}
                    />
                    {statusLabel[job.status]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}
