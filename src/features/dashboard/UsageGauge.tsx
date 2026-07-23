import { useNavigate } from "@/lib/router-compat";
import { Card } from "@/components/portal";

interface UsageGaugeProps {
  minutesUsed: number;
  minutesIncluded: number;
}

export function UsageGauge({ minutesUsed, minutesIncluded }: UsageGaugeProps) {
  const navigate = useNavigate();
  const percentage = minutesIncluded > 0 ? (minutesUsed / minutesIncluded) * 100 : 0;
  const visualPercentage = Math.min(percentage, 100);
  const isOverage = minutesUsed > minutesIncluded;
  const isWarning = percentage >= 80 && !isOverage;
  const overageAmount = isOverage ? minutesUsed - minutesIncluded : 0;
  const remaining = Math.max(0, minutesIncluded - minutesUsed);

  let barColor = "#c17f3a";
  let statusLabel = "In budget";
  let statusColor = "#8a8a82";

  if (isOverage) {
    barColor = "#b91c1c";
    statusLabel = "Over limit";
    statusColor = "#b91c1c";
  } else if (isWarning) {
    barColor = "#b8860b";
    statusLabel = "Approaching limit";
    statusColor = "#b8860b";
  }

  return (
    <Card
      title="Usage"
      className="cursor-pointer"
      style={{ border: "1px solid #e0dbd2", borderTop: "2px solid #c0b8ac" }}
      onClick={() => navigate("/billing")}
    >
      <div className="space-y-4">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-mono text-4xl font-bold" style={{ color: "#1c1c1a", letterSpacing: "-0.03em" }}>
              {Math.round(percentage)}<span className="text-xl">%</span>
            </p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: statusColor }}>
              {statusLabel}
            </p>
          </div>
          <div className="text-right">
            <p className="font-mono text-sm font-semibold" style={{ color: "#1c1c1a" }}>
              {minutesUsed} <span style={{ color: "#8a8a82", fontWeight: 400 }}>/ {minutesIncluded} min</span>
            </p>
            <p className="mt-0.5 text-[10px] font-mono" style={{ color: "#8a8a82" }}>
              {remaining} remaining
            </p>
          </div>
        </div>

        {/* Square progress bar — no rounded corners */}
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
            style={{ width: `${visualPercentage}%`, background: barColor }}
          />
        </div>

        {isOverage && (
          <p className="font-mono text-[10px] font-semibold" style={{ color: "#b91c1c" }}>
            {overageAmount} {overageAmount === 1 ? "minute" : "minutes"} over allowance
          </p>
        )}
        {isWarning && (
          <p className="font-mono text-[10px] font-semibold" style={{ color: "#b8860b" }}>
            Nearly at limit. Consider upgrading.
          </p>
        )}
      </div>
    </Card>
  );
}
