import type { Tier } from "@/api/hooks/useBilling";

export interface TierBadgeProps {
  tier: Tier;
  className?: string;
}

const tierConfig: Record<Tier, { label: string; color: string; bg: string }> = {
  free:       { label: "FREE",       color: "#6b6b5e", bg: "#f0ede8" },
  pro:        { label: "PRO",        color: "#7a5c00", bg: "#fef3c7" },
  enterprise: { label: "ENTERPRISE", color: "#3a2e1a", bg: "#e8dcc8" },
};

export function TierBadge({ tier, className = "" }: TierBadgeProps) {
  const cfg = tierConfig[tier] ?? tierConfig.free;
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 font-mono text-[10px] font-semibold tracking-widest ${className}`}
      style={{ color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}22` }}
    >
      {cfg.label}
    </span>
  );
}
