import { useQuery, useMutation } from "@tanstack/react-query";
import { api } from "../client";

// ── Types ────────────────────────────────────────────────────────────────────

export type Tier = "free" | "pro" | "enterprise";
export type InvoiceStatus = "paid" | "pending" | "failed";

export interface SubscriptionResponse {
  tier: Tier;
  status: string;
  paymentStatus: string;
  gracePeriodActive: boolean;
  periodStart: string;
  periodEnd: string;
}

export interface BillingUsageResponse {
  minutesUsed: number;
  minutesIncluded: number;
  percentageConsumed: number;
  tierName: string;
}

export interface DailyUsagePoint {
  date: string;
  minutes: number;
}

export interface DailyUsageResponse {
  data: DailyUsagePoint[];
}

export interface Invoice {
  id: string;
  date: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  pdfUrl?: string | null;
  receiptUrl?: string | null;
}

export interface InvoicesResponse {
  items: Invoice[];
  total: number;
  hasMore: boolean;
  nextCursor?: string;
}

interface SubscriptionApiDto {
  tier: string;
  status: string;
  paymentStatus: string;
  gracePeriodActive: boolean;
  periodStart: string;
  periodEnd: string;
}

interface UsageSummaryApiDto {
  accumulatedSeconds: number;
  includedSeconds: number;
  percentageConsumed: number;
  tierName: string;
}

interface InvoiceSummaryApiDto {
  invoiceId: string;
  amountCents: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  hostedInvoiceUrl?: string | null;
}

interface InvoicesApiDto {
  items: InvoiceSummaryApiDto[];
  hasMore: boolean;
}

function mapTier(tier: string): Tier {
  if (tier === "pro" || tier === "enterprise") return tier;
  return "free";
}

function mapInvoiceStatus(status: string): InvoiceStatus {
  const normalized = status.toLowerCase();
  if (normalized === "paid") return "paid";
  if (normalized === "open" || normalized === "draft") return "pending";
  return "failed";
}

function mapSubscription(dto: SubscriptionApiDto): SubscriptionResponse {
  return {
    tier: mapTier(dto.tier),
    status: dto.status,
    paymentStatus: dto.paymentStatus,
    gracePeriodActive: dto.gracePeriodActive,
    periodStart: dto.periodStart,
    periodEnd: dto.periodEnd,
  };
}

function mapUsageSummary(dto: UsageSummaryApiDto): BillingUsageResponse {
  const minutesIncluded = Math.max(1, Math.round(dto.includedSeconds / 60));
  return {
    minutesUsed: Math.round(dto.accumulatedSeconds / 60),
    minutesIncluded,
    percentageConsumed: dto.percentageConsumed,
    tierName: dto.tierName,
  };
}

function mapDailyUsage(dto: UsageSummaryApiDto): DailyUsageResponse {
  const today = new Date().toISOString().slice(0, 10);
  return {
    data: [
      {
        date: today,
        minutes: Math.round(dto.accumulatedSeconds / 60),
      },
    ],
  };
}

function mapInvoices(dto: InvoicesApiDto, limit: number): InvoicesResponse {
  const items = dto.items.map((inv) => ({
    id: inv.invoiceId,
    date: inv.periodEnd,
    amount: inv.amountCents / 100,
    currency: "usd",
    status: mapInvoiceStatus(inv.status),
    pdfUrl: inv.hostedInvoiceUrl ?? null,
    receiptUrl: inv.hostedInvoiceUrl ?? null,
  }));

  const lastItem = items.length > 0 ? items[items.length - 1] : undefined;

  return {
    items,
    total: dto.hasMore ? items.length + limit : items.length,
    hasMore: dto.hasMore,
    nextCursor: dto.hasMore && lastItem ? lastItem.id : undefined,
  };
}

// ── Query Keys ───────────────────────────────────────────────────────────────

export const billingKeys = {
  all: ["billing"] as const,
  subscription: () => [...billingKeys.all, "subscription"] as const,
  usage: () => [...billingKeys.all, "usage"] as const,
  dailyUsage: () => [...billingKeys.all, "usage", "daily"] as const,
  invoices: (params?: { limit?: number; startingAfter?: string }) =>
    [...billingKeys.all, "invoices", params] as const,
};

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchSubscription(): Promise<SubscriptionResponse> {
  const { data, error } = await api.GET("/api/billing/subscriptions");
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch subscription",
    );
  }
  return mapSubscription(data as unknown as SubscriptionApiDto);
}

async function fetchBillingUsage(): Promise<BillingUsageResponse> {
  const { data, error } = await api.GET("/api/billing/usage");
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch usage",
    );
  }
  return mapUsageSummary(data as unknown as UsageSummaryApiDto);
}

async function fetchDailyUsage(): Promise<DailyUsageResponse> {
  const { data, error } = await api.GET("/api/billing/usage");
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch daily usage",
    );
  }
  return mapDailyUsage(data as unknown as UsageSummaryApiDto);
}

async function fetchInvoices(params: {
  limit: number;
  startingAfter?: string;
}): Promise<InvoicesResponse> {
  const queryParams: Record<string, string | number> = { limit: params.limit };
  if (params.startingAfter) {
    queryParams.startingAfter = params.startingAfter;
  }

  const { data, error } = await api.GET("/api/billing/invoices", {
    params: { query: queryParams },
  });
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to fetch invoices",
    );
  }
  return mapInvoices(data as unknown as InvoicesApiDto, params.limit);
}

async function cancelSubscription(): Promise<void> {
  const { error } = await api.DELETE("/api/billing/subscriptions");
  if (error) {
    throw new Error(
      ((error as unknown) as { message?: string })?.message ??
        "Failed to cancel subscription",
    );
  }
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export function useSubscription() {
  return useQuery({
    queryKey: billingKeys.subscription(),
    queryFn: fetchSubscription,
  });
}

export function useBillingUsage() {
  return useQuery({
    queryKey: billingKeys.usage(),
    queryFn: fetchBillingUsage,
  });
}

export function useDailyUsage() {
  return useQuery({
    queryKey: billingKeys.dailyUsage(),
    queryFn: fetchDailyUsage,
  });
}

export function useInvoices(params: { limit: number; startingAfter?: string }) {
  return useQuery({
    queryKey: billingKeys.invoices(params),
    queryFn: () => fetchInvoices(params),
  });
}

export function useUpgrade() {
  return useMutation({
    mutationFn: async () => {
      throw new Error("Subscription upgrade via Stripe not yet configured.");
    },
  });
}

export function useDowngrade() {
  return useMutation({
    mutationFn: cancelSubscription,
  });
}
