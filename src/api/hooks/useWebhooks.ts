import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { api } from "../client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface WebhookRegistration {
  id: string;
  tenantId: string;
  url: string;
  eventTypes: string[];
  secret: string;
  enabled: boolean;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  eventType: string;
  eventId: string;
  attempts: number;
  httpStatus: number;
  errorMessage: string | null;
  firstAttemptAt: string;
  lastAttemptAt: string | null;
  nextRetryAt: string | null;
  delivered: boolean;
}

export interface DeliveryHistoryResponse {
  items: WebhookDelivery[];
  nextCursor: string | null;
}

export interface RegisterWebhookRequest {
  url: string;
  eventTypes: string[];
}

export interface UpdateWebhookRequest {
  url: string;
  eventTypes: string[];
  enabled: boolean;
}

// ── Query Keys ───────────────────────────────────────────────────────────────

export const webhookKeys = {
  all: ["webhooks"] as const,
  list: () => [...webhookKeys.all, "list"] as const,
  deliveries: (webhookId: string) =>
    [...webhookKeys.all, "deliveries", webhookId] as const,
};

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchWebhooks(): Promise<WebhookRegistration[]> {
  const { data, error } = await api.GET("/api/webhooks");
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch webhooks",
    );
  }
  return data as unknown as WebhookRegistration[];
}

async function registerWebhook(
  body: RegisterWebhookRequest,
): Promise<WebhookRegistration> {
  const result = await api.POST("/api/webhooks", {
    body,
  });
  const { data, error } = result;
  const response = result.response as Response;
  if (error) {
    const errorBody = (error as unknown) as { message?: string; title?: string; errors?: Record<string, string[]> };
    if (response.status === 409) {
      throw new ApiError(
        errorBody?.message ?? errorBody?.title ?? "Registration limit reached or duplicate URL",
        409,
      );
    }
    if (response.status === 400) {
      throw new ApiError(
        errorBody?.message ?? errorBody?.title ?? "Validation error",
        400,
        errorBody?.errors,
      );
    }
    throw new ApiError(
      errorBody?.message ?? errorBody?.title ?? "Failed to register webhook",
      response.status,
    );
  }
  return data as unknown as WebhookRegistration;
}

async function updateWebhook({
  id,
  body,
}: {
  id: string;
  body: UpdateWebhookRequest;
}): Promise<WebhookRegistration> {
  const result = await api.PUT("/api/webhooks/{id}", {
    params: { path: { id } },
    body,
  });
  const { data, error } = result;
  const response = result.response as Response;
  if (error) {
    const errorBody = (error as unknown) as { message?: string; title?: string; errors?: Record<string, string[]> };
    if (response.status === 400) {
      throw new ApiError(
        errorBody?.message ?? errorBody?.title ?? "Validation error",
        400,
        errorBody?.errors,
      );
    }
    throw new ApiError(
      errorBody?.message ?? errorBody?.title ?? "Failed to update webhook",
      response.status,
    );
  }
  return data as unknown as WebhookRegistration;
}

async function deleteWebhook(id: string): Promise<void> {
  const { error } = await api.DELETE("/api/webhooks/{id}", {
    params: { path: { id } },
  });
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to delete webhook",
    );
  }
}

async function fetchDeliveries({
  webhookId,
  cursor,
}: {
  webhookId: string;
  cursor?: string | null;
}): Promise<DeliveryHistoryResponse> {
  const params: Record<string, string | number> = { limit: 20 };
  if (cursor) {
    params.cursor = cursor;
  }
  const { data, error } = await api.GET("/api/webhooks/{id}/deliveries", {
    params: { path: { id: webhookId }, query: params },
  });
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch delivery history",
    );
  }
  return data as unknown as DeliveryHistoryResponse;
}

// ── Error Class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

// ── Hooks ────────────────────────────────────────────────────────────────────

/**
 * Fetches the list of webhooks for the current tenant.
 */
export function useWebhooks() {
  return useQuery({
    queryKey: webhookKeys.list(),
    queryFn: fetchWebhooks,
  });
}

/**
 * Mutation to register a new webhook.
 * On success, invalidates the webhooks list to refresh.
 */
export function useRegisterWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.list() });
    },
  });
}

/**
 * Mutation to update a webhook registration.
 * On success, invalidates the webhooks list to refresh.
 */
export function useUpdateWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateWebhook,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: webhookKeys.list() });
    },
  });
}

/**
 * Mutation to delete a webhook registration.
 * On success, removes the webhook from the cached list optimistically.
 */
export function useDeleteWebhook() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: (_data, id) => {
      queryClient.setQueryData<WebhookRegistration[]>(
        webhookKeys.list(),
        (old) => (old ? old.filter((wh) => wh.id !== id) : []),
      );
    },
  });
}

/**
 * Fetches paginated delivery history for a specific webhook.
 * Uses cursor-based infinite query for "Load More" functionality.
 */
export function useDeliveryHistory(webhookId: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: webhookKeys.deliveries(webhookId),
    queryFn: ({ pageParam }) =>
      fetchDeliveries({ webhookId, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled,
  });
}
