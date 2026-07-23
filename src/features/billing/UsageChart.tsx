import type { DailyUsagePoint } from "@/api/hooks/useBilling";

export interface UsageChartProps {
  data: DailyUsagePoint[];
  className?: string;
}

export function UsageChart({ data, className = "" }: UsageChartProps) {
  const chartHeight = 160;
  const chartWidth = 600;
  const barGap = 2;

  if (data.length === 0) {
    return (
      <div className={`flex items-center justify-center py-10 ${className}`}>
        <p className="font-mono text-xs" style={{ color: "#8a8a82" }}>No usage data for this period</p>
      </div>
    );
  }

  const maxMinutes = Math.max(...data.map((d) => d.minutes), 1);
  const barWidth = Math.max(1, (chartWidth - barGap * (data.length - 1)) / data.length);

  return (
    <div className={className}>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight + 32}`}
          className="w-full min-w-[400px]"
          role="img"
          aria-label="Daily usage chart showing minutes consumed per day"
        >
          {/* Y-axis label */}
          <text x="0" y="10" fill="#a0998e" fontSize="9" aria-hidden="true">
            {maxMinutes}m
          </text>
          <text x="0" y={chartHeight - 2} fill="#a0998e" fontSize="9" aria-hidden="true">
            0m
          </text>

          {/* Top grid line */}
          <line x1="0" y1="14" x2={chartWidth} y2="14" stroke="#e0dbd2" strokeWidth="0.5" strokeDasharray="4 2" />

          {/* Bars — square, copper */}
          {data.map((point, index) => {
            const barHeight = maxMinutes > 0 ? (point.minutes / maxMinutes) * (chartHeight - 20) : 0;
            const x = index * (barWidth + barGap);
            const y = chartHeight - barHeight;
            return (
              <g key={point.date}>
                <rect x={x} y={y} width={barWidth} height={barHeight} fill="#c17f3a">
                  <title>{formatDate(point.date)}: {point.minutes} min</title>
                </rect>
                {shouldShowLabel(index, data.length) && (
                  <text x={x + barWidth / 2} y={chartHeight + 16} textAnchor="middle" fill="#a0998e" fontSize="9" aria-hidden="true">
                    {formatShortDate(point.date)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Baseline */}
          <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="#c0b8ac" strokeWidth="1" />
        </svg>
      </div>
    </div>
  );
}

function shouldShowLabel(index: number, total: number): boolean {
  if (total <= 10) return true;
  if (total <= 20) return index % 2 === 0;
  return index % Math.ceil(total / 10) === 0 || index === total - 1;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}
