import { useNavigate } from "@/lib/router-compat";
import { Button, Card, ErrorState, DashboardSkeletons } from "@/components/portal";
import { useActiveJobs, useCapabilities, useRecentJobs } from "@/api/hooks/useJobs";
import { useLastUpdated } from "@/hooks";
import { ActiveJobsCard } from "./ActiveJobsCard";
import { RecentJobsList } from "./RecentJobsList";

export function DashboardPage() {
  const navigate = useNavigate();
  const activeJobsQuery = useActiveJobs();
  const recentJobsQuery = useRecentJobs();
  const capabilitiesQuery = useCapabilities();
  const isRefetching =
    activeJobsQuery.isFetching || recentJobsQuery.isFetching || capabilitiesQuery.isFetching;
  const { displayTime } = useLastUpdated(isRefetching);

  const isLoading =
    activeJobsQuery.isPending && recentJobsQuery.isPending && capabilitiesQuery.isPending;

  if (isLoading) return <DashboardSkeletons />;

  const activeCount = activeJobsQuery.data?.activeCount ?? 0;
  const recentJobs = recentJobsQuery.data ?? [];
  const intakeReady = capabilitiesQuery.data?.capabilities.jobIntake !== false;
  const capabilityError = capabilitiesQuery.isError;

  return (
    <div className="space-y-7">
      <div
        className="flex items-center justify-between"
        style={{ borderBottom: "1px solid #e0dbd2", paddingBottom: "16px" }}
      >
        <div>
          <h1 className="text-lg font-semibold tracking-tight" style={{ color: "#1c1c1a" }}>
            Dashboard
          </h1>
          <p
            className="mt-0.5 flex items-center gap-2 font-mono text-[10px]"
            style={{ color: "#8a8a82" }}
          >
            {isRefetching ? (
              <>
                <span
                  className="inline-block h-1.5 w-1.5 animate-pulse rounded-full"
                  style={{ background: "#c17f3a" }}
                />
                Updating…
              </>
            ) : (
              <>Last updated {displayTime}</>
            )}
          </p>
        </div>
        <Button disabled={!intakeReady} onClick={() => navigate("/jobs/new")}>
          Upload New Job
        </Button>
      </div>

      {(capabilityError || !intakeReady) && (
        <div
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"
        >
          {capabilityError
            ? `Could not verify cloud processing availability. ${capabilitiesQuery.error.message}`
            : "Cloud dubbing intake is paused because no processing worker is available. Existing jobs and completed outputs remain accessible."}
          {capabilityError && (
            <button className="ml-2 underline" onClick={() => void capabilitiesQuery.refetch()}>
              Retry
            </button>
          )}
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        {activeJobsQuery.isError ? (
          <ErrorState
            message={activeJobsQuery.error.message}
            onRetry={() => void activeJobsQuery.refetch()}
          />
        ) : (
          <ActiveJobsCard count={activeCount} />
        )}
        <Card title="Cloud Processing">
          <p className="text-sm text-gray-600">
            {capabilityError
              ? "Availability check failed."
              : intakeReady
                ? "Processing worker available."
                : "Unavailable. No new jobs will be accepted."}
          </p>
        </Card>
      </div>

      {recentJobsQuery.isError ? (
        <ErrorState
          message={recentJobsQuery.error.message}
          onRetry={() => void recentJobsQuery.refetch()}
        />
      ) : (
        <RecentJobsList jobs={recentJobs} />
      )}
    </div>
  );
}
