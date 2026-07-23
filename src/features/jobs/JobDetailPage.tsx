import { useState } from "react";
import { useParams, useNavigate } from "@/lib/router-compat";
import {
  useJobDetail,
  useCancelJob,
  isTerminalStatus,
  type JobStatus,
} from "@/api/hooks/useJobs";
import { Button, Card, ErrorState, LoadingSpinner } from "@/components/portal";
import { JobStatusBadge } from "./JobStatusBadge";

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null) return "—";
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  const hrs = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return remainMins > 0 ? `${hrs}h ${remainMins}m` : `${hrs}h`;
}

function canCancel(status: JobStatus): boolean {
  return status === "Queued" || status === "Running";
}

function canDownload(status: JobStatus): boolean {
  return status === "Completed";
}

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { data: job, isLoading, isError, refetch } = useJobDetail(jobId ?? "");
  const cancelMutation = useCancelJob();
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleCancel = () => {
    if (!jobId) return;
    cancelMutation.mutate(jobId);
  };

  const handleDownload = async () => {
    if (!jobId) return;
    setDownloadError(null);
    setIsDownloading(true);

    try {
      // Use raw fetch for binary download — openapi-fetch defaults to JSON parsing

      const session = await fetchAuthSession();
      const token = session.tokens?.idToken?.toString();

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const apiBase = import.meta.env.VITE_API_BASE_URL ?? "";
      const response = await fetch(
        `${apiBase}/api/dubs/${jobId}/download`,
        { headers },
      );

      if (!response.ok) {
        throw new Error(
          response.status === 404
            ? "Download not available"
            : response.status === 409
              ? "Job not completed"
              : `Download failed (${response.status})`,
        );
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${job?.projectName ?? "output"}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setDownloadError(
        err instanceof Error ? err.message : "Failed to download file",
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <LoadingSpinner message="Loading job details…" />
      </div>
    );
  }

  if (isError || !job) {
    return (
      <div className="space-y-6">
        <ErrorState
          message="Failed to load job details. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/jobs")}
            className="text-sm text-gray-500 hover:text-gray-700"
            aria-label="Back to jobs list"
          >
            ← Jobs
          </button>
          <h1 className="text-2xl font-bold text-gray-900">
            {job.projectName}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {canCancel(job.status) && (
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              loading={cancelMutation.isPending}
              disabled={cancelMutation.isPending}
            >
              Cancel Job
            </Button>
          )}
          {canDownload(job.status) && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownload}
              loading={isDownloading}
              disabled={isDownloading}
            >
              Download Output
            </Button>
          )}
        </div>
      </div>

      {/* Error messages */}
      {cancelMutation.isError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {cancelMutation.error?.message ?? "Failed to cancel job. Please try again."}
        </div>
      )}
      {downloadError && (
        <div role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {downloadError}
        </div>
      )}

      {/* Status and Progress */}
      <Card>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Status */}
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1 flex items-center gap-2">
              <JobStatusBadge status={job.status} />
              {job.status === "Running" && job.progress != null && (
                <span className="text-sm text-blue-700 font-medium">
                  {Math.round(job.progress)}%
                </span>
              )}
            </dd>
          </div>

          {/* Pipeline Stage */}
          <div>
            <dt className="text-sm font-medium text-gray-500">Pipeline Stage</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {job.pipelineStage ?? "—"}
            </dd>
          </div>

          {/* Languages */}
          <div>
            <dt className="text-sm font-medium text-gray-500">Languages</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {job.sourceLanguage} → {job.targetLanguage}
            </dd>
          </div>

          {/* Created */}
          <div>
            <dt className="text-sm font-medium text-gray-500">Created</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatTimestamp(job.createdAt)}
            </dd>
          </div>

          {/* Completed */}
          <div>
            <dt className="text-sm font-medium text-gray-500">Completed</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatTimestamp(job.completedAt)}
            </dd>
          </div>

          {/* Duration */}
          <div>
            <dt className="text-sm font-medium text-gray-500">Duration</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatDuration(job.duration)}
            </dd>
          </div>
        </div>

        {/* Progress bar for Running jobs */}
        {job.status === "Running" && job.progress != null && (
          <div className="mt-6">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
              <span>Progress</span>
              <span>{Math.round(job.progress)}%</span>
            </div>
            <div
              className="h-2 w-full rounded-full bg-gray-200"
              role="progressbar"
              aria-valuenow={Math.round(job.progress)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Job progress"
            >
              <div
                className="h-2 rounded-full bg-blue-600 transition-all duration-300"
                style={{ width: `${Math.min(job.progress, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Error message for Failed jobs */}
        {job.status === "Failed" && job.errorMessage && (
          <div className="mt-6 rounded-md bg-red-50 p-4">
            <div className="flex">
              <svg
                className="h-5 w-5 text-red-400 shrink-0"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-1 text-sm text-red-700">{job.errorMessage}</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Polling indicator */}
      {!isTerminalStatus(job.status) && (
        <p className="text-xs text-gray-400">
          Auto-refreshing every 5 seconds…
        </p>
      )}
    </div>
  );
}
