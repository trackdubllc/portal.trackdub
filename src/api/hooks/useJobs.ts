import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../client";

// ── Types ────────────────────────────────────────────────────────────────────

export type JobStatus =
  | "Queued"
  | "Running"
  | "Completed"
  | "Failed"
  | "Cancelled";

export interface Job {
  id: string;
  projectName: string;
  status: JobStatus;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
  completedAt?: string | null;
  duration?: number | null;
  progress?: number | null;
  pipelineStage?: string | null;
  errorMessage?: string | null;
}

export interface JobsListResponse {
  items: Job[];
  totalCount: number;
}

export interface ActiveJobsResponse {
  activeCount: number;
  recentJobs: Job[];
}

export interface UsageResponse {
  minutesUsed: number;
  minutesIncluded: number;
}

export interface JobsListParams {
  status?: string;
}

/** Raw dub job payload from Trackdub.Api (camelCase JSON; status may be numeric enum). */
interface DubJobApiDto {
  id: string;
  projectName?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  status: JobStatus | number | string;
  createdAt?: string;
  completedAt?: string | null;
  durationSeconds?: number | null;
  progressPercent?: number;
  currentStage?: string | null;
  errorMessage?: string | null;
}

const JOB_STATUS_BY_NUMBER: Record<number, JobStatus> = {
  0: "Queued",
  1: "Running",
  2: "Completed",
  3: "Cancelled",
  4: "Failed",
};

function mapJobStatus(status: DubJobApiDto["status"]): JobStatus {
  if (typeof status === "number") {
    return JOB_STATUS_BY_NUMBER[status] ?? "Queued";
  }

  if (typeof status === "string") {
    const numeric = Number(status);
    if (!Number.isNaN(numeric) && JOB_STATUS_BY_NUMBER[numeric]) {
      return JOB_STATUS_BY_NUMBER[numeric];
    }

    if (
      status === "Queued" ||
      status === "Running" ||
      status === "Completed" ||
      status === "Failed" ||
      status === "Cancelled"
    ) {
      return status;
    }
  }

  return "Queued";
}

interface UsageSummaryApiDto {
  accumulatedSeconds: number;
  includedSeconds: number;
}

function mapJob(dto: DubJobApiDto): Job {
  return {
    id: dto.id,
    projectName: dto.projectName ?? "",
    status: mapJobStatus(dto.status),
    sourceLanguage: dto.sourceLanguage ?? "",
    targetLanguage: dto.targetLanguage ?? "",
    createdAt: dto.createdAt ?? new Date(0).toISOString(),
    completedAt: dto.completedAt ?? null,
    duration: dto.durationSeconds ?? null,
    progress: dto.progressPercent ?? null,
    pipelineStage: dto.currentStage ?? null,
    errorMessage: dto.errorMessage ?? null,
  };
}

function mapUsageSummary(dto: UsageSummaryApiDto): UsageResponse {
  return {
    minutesUsed: Math.round(dto.accumulatedSeconds / 60),
    minutesIncluded: Math.max(1, Math.round(dto.includedSeconds / 60)),
  };
}

// ── Query Keys ───────────────────────────────────────────────────────────────

export const jobKeys = {
  all: ["jobs"] as const,
  active: () => [...jobKeys.all, "active"] as const,
  recent: () => [...jobKeys.all, "recent"] as const,
  usage: () => ["billing", "usage"] as const,
  list: (params?: JobsListParams) => [...jobKeys.all, "list", params] as const,
  detail: (id: string) => [...jobKeys.all, "detail", id] as const,
};

// ── Terminal statuses ────────────────────────────────────────────────────────

const TERMINAL_STATUSES: JobStatus[] = ["Completed", "Failed", "Cancelled"];

export function isTerminalStatus(status: JobStatus): boolean {
  return TERMINAL_STATUSES.includes(status);
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchActiveJobs(): Promise<ActiveJobsResponse> {
  const { data, error } = await api.GET("/api/dubs", {
    params: { query: { status: "Running" } },
  });
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch active jobs",
    );
  }
  const response = data as unknown as { items?: DubJobApiDto[] } | null;
  const jobs = (response?.items ?? []).map(mapJob);
  return { activeCount: jobs.length, recentJobs: jobs.slice(0, 5) };
}

async function fetchRecentJobs(): Promise<Job[]> {
  const { data, error } = await api.GET("/api/dubs");
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch recent jobs",
    );
  }
  const response = data as unknown as { items?: DubJobApiDto[] } | null;
  const jobs = (response?.items ?? []).map(mapJob);
  jobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return jobs.slice(0, 5);
}

async function fetchUsage(): Promise<UsageResponse> {
  const { data, error } = await api.GET("/api/billing/usage");
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch usage data",
    );
  }
  return mapUsageSummary(data as unknown as UsageSummaryApiDto);
}

async function fetchJobsList(params: JobsListParams): Promise<JobsListResponse> {
  const query =
    params.status && params.status !== "All" ? { status: params.status } : undefined;
  const { data, error } = await api.GET("/api/dubs", {
    params: query ? { query } : undefined,
  });
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch jobs",
    );
  }
  const response = data as unknown as { items?: DubJobApiDto[]; totalCount?: number } | null;
  const items = (response?.items ?? []).map(mapJob);
  return {
    items,
    totalCount: response?.totalCount ?? items.length,
  };
}

async function fetchJobDetail(id: string): Promise<Job> {
  const { data, error } = await api.GET("/api/dubs/{jobId}", {
    params: { path: { jobId: id } },
  });
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch job details",
    );
  }
  return mapJob(data as unknown as DubJobApiDto);
}

async function cancelJob(id: string): Promise<void> {
  const { error } = await api.DELETE("/api/dubs/{jobId}", {
    params: { path: { jobId: id } },
  });
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to cancel job",
    );
  }
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches active job count and recent jobs with 10s polling.
 * Pauses polling when the page is hidden (Page Visibility API).
 */
export function useActiveJobs() {
  return useQuery({
    queryKey: jobKeys.active(),
    queryFn: fetchActiveJobs,
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.hidden) {
        return false;
      }
      return 10_000;
    },
  });
}

/**
 * Fetches the 5 most recent jobs across all statuses with 10s polling.
 * Pauses polling when the page is hidden (Page Visibility API).
 */
export function useRecentJobs() {
  return useQuery({
    queryKey: jobKeys.recent(),
    queryFn: fetchRecentJobs,
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.hidden) {
        return false;
      }
      return 10_000;
    },
  });
}

/**
 * Fetches billing usage data (minutes used vs included) with 10s polling.
 * Pauses polling when the page is hidden (Page Visibility API).
 */
export function useUsage() {
  return useQuery({
    queryKey: jobKeys.usage(),
    queryFn: fetchUsage,
    refetchInterval: () => {
      if (typeof document !== "undefined" && document.hidden) {
        return false;
      }
      return 10_000;
    },
  });
}

/**
 * Fetches a list of jobs with optional status filter (server-side).
 */
export function useJobsList(params: JobsListParams = {}) {
  const resolvedParams: JobsListParams = {
    status: params.status,
  };

  return useQuery({
    queryKey: jobKeys.list(resolvedParams),
    queryFn: () => fetchJobsList(resolvedParams),
  });
}

/**
 * Fetches a single job's detail with 5s polling for Running jobs.
 * Stops polling when the job reaches a terminal status.
 */
export function useJobDetail(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => fetchJobDetail(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const job = query.state.data;
      if (!job) return 5_000;
      if (isTerminalStatus(job.status)) return false;
      if (typeof document !== "undefined" && document.hidden) return false;
      return 5_000;
    },
  });
}

/**
 * Mutation to cancel a Queued or Running job.
 * Invalidates job queries on success.
 */
export function useCancelJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cancelJob,
    onSuccess: (_data, jobId) => {
      queryClient.invalidateQueries({ queryKey: jobKeys.detail(jobId) });
      queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}
