import { useNavigate } from "@/lib/router-compat";
import { Card, Button } from "@/components/portal";
import { useJobsList } from "@/api/hooks/useJobs";

interface ActiveJobsCardProps {
  count: number;
}

export function ActiveJobsCard({ count }: ActiveJobsCardProps) {
  const navigate = useNavigate();
  const jobsQuery = useJobsList({ status: "Running" });
  const activeJobs = jobsQuery.data?.items ?? [];

  return (
    <Card title="Active Jobs">
      <div className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-5xl font-bold" style={{ color: "#1c1c1a", letterSpacing: "-0.03em" }}>
            {count}
          </span>
          <span className="text-xs" style={{ color: "#8a8a82" }}>
            {count === 1 ? "job" : "jobs"} processing
          </span>
        </div>

        {activeJobs.length > 0 && (
          <div className="max-h-32 space-y-1 overflow-y-auto">
            {activeJobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="flex items-center justify-between px-2 py-1.5 text-xs"
                style={{ background: "#f5f3ee", borderLeft: "2px solid #c17f3a" }}
              >
                <span className="truncate font-medium" style={{ color: "#1c1c1a" }}>
                  {job.projectName}
                </span>
                {job.progress !== null && (
                  <span className="ml-2 shrink-0 font-mono text-[10px]" style={{ color: "#8a8a82" }}>
                    {job.progress}%
                  </span>
                )}
              </div>
            ))}
            {activeJobs.length > 3 && (
              <p className="text-[10px] font-mono" style={{ color: "#8a8a82" }}>
                +{activeJobs.length - 3} more
              </p>
            )}
          </div>
        )}

        <Button variant="secondary" size="sm" onClick={() => navigate("/jobs")} className="w-full">
          View All Jobs
        </Button>
      </div>
    </Card>
  );
}
