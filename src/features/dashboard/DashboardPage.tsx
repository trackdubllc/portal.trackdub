import { useNavigate } from "@/lib/router-compat";
import { Button, ErrorState, DashboardSkeletons } from "@/components/portal";
import { useActiveJobs, useRecentJobs, useUsage } from "@/api/hooks/useJobs";
import { useLastUpdated } from "@/hooks";
import { ActiveJobsCard } from "./ActiveJobsCard";
import { UsageGauge } from "./UsageGauge";
import { RecentJobsList } from "./RecentJobsList";

export function DashboardPage() {
  const navigate = useNavigate();
  const activeJobsQuery = useActiveJobs();
  const recentJobsQuery = useRecentJobs();
  const usageQuery = useUsage();
  const isRefetching =
    activeJobsQuery.isFetching ||
    recentJobsQuery.isFetching ||
    usageQuery.isFetching;
  const { displayTime } = useLastUpdated(isRefetching);

  const isLoading =
    activeJobsQuery.isPending ||
    recentJobsQuery.isPending ||
    usageQuery.isPending ||
    !activeJobsQuery.data ||
    !recentJobsQuery.data ||
    !usageQuery.data;
  const hasError =
    activeJobsQuery.isError ||
    recentJobsQuery.isError ||
    usageQuery.isError;

  if (isLoading) return <DashboardSkeletons />;

  if (hasError) {
    const errorMessage =
      activeJobsQuery.error?.message ??
      recentJobsQuery.error?.message ??
      usageQuery.error?.message ??
      "Failed to load dashboard data";
    return (
      <ErrorState
        message={errorMessage}
        onRetry={() => {
          void activeJobsQuery.refetch();
          void recentJobsQuery.refetch();
          void usageQuery.refetch();
        }}
      />
    );
  }

  const { activeCount } = activeJobsQuery.data!;
  const recentJobs = recentJobsQuery.data!;
  const { minutesUsed, minutesIncluded } = usageQuery.data!;

  return (
    <div className="space-y-7">
      <div className="flex items-center justify-between" style={{ borderBottom: "1px solid #e0dbd2", paddingBottom: "16px" }}>
        <div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: "#1c1c1a" }}>
            Dashboard
          </h1>
          <p className="mt-0.5 flex items-center gap-2 font-mono text-[10px]" style={{ color: "#8a8a82" }}>
            {isRefetching ? (
              <>
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full" style={{ background: "#c17f3a" }} />
                Updating…
              </>
            ) : (
              <>Last updated {displayTime}</>
            )}
          </p>
        </div>
        <Button onClick={() => navigate("/jobs/new")}>Upload New Job</Button>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <ActiveJobsCard count={activeCount} />
        <UsageGauge minutesUsed={minutesUsed} minutesIncluded={minutesIncluded} />
      </div>

      <RecentJobsList jobs={recentJobs} />
    </div>
  );
}
