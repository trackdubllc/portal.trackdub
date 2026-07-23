import { Card } from "@/components/Card";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import {
  useSubscription,
  useBillingUsage,
  useDailyUsage,
  useUpgrade,
  useDowngrade,
} from "@/api/hooks/useBilling";
import { TierBadge } from "./TierBadge";
import { UsageChart } from "./UsageChart";
import { InvoiceTable } from "./InvoiceTable";

export function BillingPage() {
  return (
    <div className="space-y-6">
      <h1
        className="text-lg font-semibold tracking-tight"
        style={{ color: "#1c1c1a", borderBottom: "1px solid #e0dbd2", paddingBottom: "16px" }}
      >
        Billing
      </h1>
      <SubscriptionSection />
      <UsageSection />
      <InvoicesSection />
    </div>
  );
}

function SubscriptionSection() {
  const subscriptionQuery = useSubscription();
  const usageQuery = useBillingUsage();
  const upgrade = useUpgrade();
  const downgrade = useDowngrade();

  const isLoading = subscriptionQuery.isLoading || usageQuery.isLoading;
  const isError = subscriptionQuery.isError || usageQuery.isError;
  const error = subscriptionQuery.error ?? usageQuery.error;

  const refetch = () => {
    void subscriptionQuery.refetch();
    void usageQuery.refetch();
  };

  if (isLoading) {
    return <Card title="Subscription"><LoadingSpinner message="Loading subscription..." /></Card>;
  }

  if (isError) {
    return (
      <Card title="Subscription">
        <ErrorState message={error?.message ?? "Failed to load subscription"} onRetry={refetch} />
      </Card>
    );
  }

  const data = subscriptionQuery.data;
  const usage = usageQuery.data;
  if (!data || !usage) return null;

  const { minutesUsed, minutesIncluded } = usage;
  const usagePercent = minutesIncluded > 0 ? Math.min((minutesUsed / minutesIncluded) * 100, 100) : 0;
  const isOver = minutesUsed > minutesIncluded;

  return (
    <Card title="Subscription">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "#8a8a82" }}>Current plan</span>
            <TierBadge tier={data.tier} />
          </div>
          <div className="flex gap-2">
            {(data.tier === "free" || data.tier === "pro") && (
              <Button size="sm" onClick={() => upgrade.mutate()} loading={upgrade.isPending} disabled={upgrade.isPending}>
                Upgrade
              </Button>
            )}
            {(data.tier === "pro" || data.tier === "enterprise") && (
              <Button variant="secondary" size="sm" onClick={() => downgrade.mutate()} loading={downgrade.isPending} disabled={downgrade.isPending}>
                Downgrade
              </Button>
            )}
          </div>
        </div>

        {upgrade.isError && (
          <p className="font-mono text-xs" style={{ color: "#b91c1c" }} role="alert">
            {upgrade.error?.message ?? "Failed to start upgrade"}
          </p>
        )}
        {downgrade.isError && (
          <p className="font-mono text-xs" style={{ color: "#b91c1c" }} role="alert">
            {downgrade.error?.message ?? "Failed to open portal"}
          </p>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8a8a82" }}>Minutes used</span>
            <span className="font-mono text-xs font-semibold" style={{ color: "#1c1c1a" }}>
              {minutesUsed} / {minutesIncluded}
            </span>
          </div>
          <div
            className="h-2 w-full overflow-hidden"
            style={{ background: "#e0dbd2" }}
            role="progressbar"
            aria-valuenow={minutesUsed}
            aria-valuemin={0}
            aria-valuemax={minutesIncluded}
            aria-label={`${minutesUsed} of ${minutesIncluded} minutes used`}
          >
            <div
              className="h-full transition-all"
              style={{ width: `${usagePercent}%`, background: isOver ? "#b91c1c" : "#c17f3a" }}
            />
          </div>
          {isOver && (
            <p className="mt-1 font-mono text-[10px]" style={{ color: "#b91c1c" }}>
              Overage: {minutesUsed - minutesIncluded} minutes over limit
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}

function UsageSection() {
  const { data, isLoading, isError, error, refetch } = useDailyUsage();

  if (isLoading) {
    return <Card title="Daily Usage"><LoadingSpinner message="Loading usage data..." /></Card>;
  }

  if (isError) {
    return (
      <Card title="Daily Usage">
        <ErrorState message={error?.message ?? "Failed to load usage data"} onRetry={() => void refetch()} />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card title="Daily Usage">
      <UsageChart data={data.data} />
    </Card>
  );
}

function InvoicesSection() {
  return (
    <Card title="Invoices">
      <InvoiceTable />
    </Card>
  );
}
