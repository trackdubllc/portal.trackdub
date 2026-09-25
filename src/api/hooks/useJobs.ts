import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  apiJson,
  capabilitiesSchema,
  dubJobSchema,
  jobsListSchema,
  jobStatusSchema,
} from "@/api/runtime";

export type JobStatus = z.infer<typeof jobStatusSchema>;
export interface Job {
  id: string;
  projectName: string;
  status: JobStatus;
  sourceLanguage: string;
  targetLanguage: string;
  createdAt: string;
  completedAt: string | null;
  duration: number | null;
  progress: number | null;
  pipelineStage: string | null;
  errorMessage: string | null;
}
export interface JobsListResponse {
  items: Job[];
  totalCount: number;
}
export interface ActiveJobsResponse {
  activeCount: number;
  recentJobs: Job[];
}
export interface JobsListParams {
  status?: string;
}

type DubJobDto = z.infer<typeof dubJobSchema>;
export function mapJob(dto: DubJobDto): Job {
  return {
    id: dto.id,
    projectName: dto.projectName,
    status: dto.status,
    sourceLanguage: dto.sourceLanguage,
    targetLanguage: dto.targetLanguage,
    createdAt: dto.createdAt,
    completedAt: dto.completedAt,
    duration: dto.durationSeconds,
    progress: dto.progressPercent,
    pipelineStage: dto.currentStage,
    errorMessage: dto.errorMessage,
  };
}

export const jobKeys = {
  all: ["jobs"] as const,
  active: () => [...jobKeys.all, "active"] as const,
  recent: () => [...jobKeys.all, "recent"] as const,
  list: (params?: JobsListParams) => [...jobKeys.all, "list", params] as const,
  detail: (id: string) => [...jobKeys.all, "detail", id] as const,
  capabilities: ["capabilities"] as const,
  uploadCapabilities: ["upload-capabilities"] as const,
};

const terminal = new Set<JobStatus>(["Completed", "Failed", "Cancelled"]);
export function isTerminalStatus(status: JobStatus): boolean {
  return terminal.has(status);
}

async function fetchList(params: JobsListParams = {}): Promise<JobsListResponse> {
  const query =
    params.status && params.status !== "All" ? `?status=${encodeURIComponent(params.status)}` : "";
  const response = await apiJson(`/api/dubs${query}`, jobsListSchema);
  return { items: response.items.map(mapJob), totalCount: response.totalCount };
}

async function fetchJob(id: string): Promise<Job> {
  return mapJob(await apiJson(`/api/dubs/${encodeURIComponent(id)}`, dubJobSchema));
}

async function cancelJob(id: string): Promise<void> {
  await apiJson(`/api/dubs/${encodeURIComponent(id)}`, z.unknown(), { method: "DELETE" });
}

export function useCapabilities() {
  return useQuery({
    queryKey: jobKeys.capabilities,
    queryFn: () => apiJson("/api/health", capabilitiesSchema),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useUploadCapabilities() {
  return useQuery({
    queryKey: ["capabilities", "upload"],
    queryFn: () => apiJson("/api/health", capabilitiesSchema),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useIntakeCapabilities() {
  return useQuery({
    queryKey: ["capabilities", "intake"],
    queryFn: () => apiJson("/api/health", capabilitiesSchema),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useActiveJobs() {
  return useQuery({
    queryKey: jobKeys.active(),
    queryFn: async (): Promise<ActiveJobsResponse> => {
      const { items } = await fetchList({ status: "Running" });
      return { activeCount: items.length, recentJobs: items.slice(0, 5) };
    },
    refetchInterval: () => (typeof document !== "undefined" && document.hidden ? false : 10_000),
  });
}

export function useRecentJobs() {
  return useQuery({
    queryKey: jobKeys.recent(),
    queryFn: async () => (await fetchList()).items.slice(0, 5),
    refetchInterval: () => (typeof document !== "undefined" && document.hidden ? false : 10_000),
  });
}

export function useJobsList(params: JobsListParams = {}) {
  const resolved = { status: params.status };
  return useQuery({ queryKey: jobKeys.list(resolved), queryFn: () => fetchList(resolved) });
}

export function useJobDetail(id: string) {
  return useQuery({
    queryKey: jobKeys.detail(id),
    queryFn: () => fetchJob(id),
    enabled: Boolean(id),
    refetchInterval: (query) => {
      const job = query.state.data;
      if (job && isTerminalStatus(job.status)) return false;
      return typeof document !== "undefined" && document.hidden ? false : 5_000;
    },
  });
}

export function useCancelJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: cancelJob,
    onSuccess: (_data, id) => {
      void queryClient.invalidateQueries({ queryKey: jobKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: jobKeys.all });
    },
  });
}
