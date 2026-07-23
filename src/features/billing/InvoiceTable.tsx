import { useState } from "react";
import { useInvoices, type Invoice, type InvoiceStatus } from "@/api/hooks/useBilling";
import { ErrorState } from "@/components/ErrorState";
import { LoadingSpinner } from "@/components/LoadingSpinner";

export interface InvoiceTableProps {
  className?: string;
}

const PAGE_SIZE = 20;

const statusConfig: Record<InvoiceStatus, { label: string; color: string; dot: string }> = {
  paid:    { label: "PAID",    color: "#15803d", dot: "#16a34a" },
  pending: { label: "PENDING", color: "#7a5c00", dot: "#b8860b" },
  failed:  { label: "FAILED",  color: "#b91c1c", dot: "#dc2626" },
};

export function InvoiceTable({ className = "" }: InvoiceTableProps) {
  const [cursorStack, setCursorStack] = useState<(string | undefined)[]>([undefined]);
  const cursor = cursorStack[cursorStack.length - 1];

  const { data, isLoading, isError, error, refetch } = useInvoices({
    limit: PAGE_SIZE,
    startingAfter: cursor,
  });

  if (isLoading) return <LoadingSpinner message="Loading invoices..." />;

  if (isError) {
    return <ErrorState message={error?.message ?? "Failed to load invoices"} onRetry={() => void refetch()} />;
  }

  if (!data || data.items.length === 0) {
    return (
      <div className={`py-8 text-center ${className}`}>
        <p className="font-mono text-xs" style={{ color: "#8a8a82" }}>No invoices available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <table className="w-full text-left" style={{ borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #e0dbd2" }}>
            {["Date", "Amount", "Status", "Receipt"].map((h) => (
              <th key={h} className="pb-2 pr-4 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#8a8a82" }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.items.map((invoice) => (
            <InvoiceRow key={invoice.id} invoice={invoice} />
          ))}
        </tbody>
      </table>

      {(data.hasMore || cursorStack.length > 1) && (
        <div className="mt-4 flex justify-between">
          {[
            { label: "Previous", onClick: () => setCursorStack((s) => s.length <= 1 ? s : s.slice(0, -1)), disabled: cursorStack.length <= 1 },
            { label: "Next", onClick: () => data.nextCursor && setCursorStack((s) => [...s, data.nextCursor]), disabled: !data.nextCursor },
          ].map(({ label, onClick, disabled }) => (
            <button
              key={label}
              onClick={onClick}
              disabled={disabled}
              className="px-4 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={{ border: "1px solid #c0b8ac", color: "#3a3a32", background: "transparent" }}
              onMouseEnter={(e) => { if (!disabled) (e.currentTarget as HTMLElement).style.background = "#ede9e2"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: Invoice }) {
  const cfg = statusConfig[invoice.status] ?? statusConfig.pending;
  const link = invoice.pdfUrl ?? invoice.receiptUrl;

  return (
    <tr style={{ borderBottom: "1px solid #f0ede8" }}>
      <td className="py-2.5 pr-4 font-mono text-xs" style={{ color: "#3a3a32" }}>{formatInvoiceDate(invoice.date)}</td>
      <td className="py-2.5 pr-4 font-mono text-xs font-semibold" style={{ color: "#1c1c1a" }}>{formatAmount(invoice.amount, invoice.currency)}</td>
      <td className="py-2.5 pr-4">
        <span className="inline-flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-widest" style={{ color: cfg.color }}>
          <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: cfg.dot }} />
          {cfg.label}
        </span>
      </td>
      <td className="py-2.5">
        {link ? (
          <a href={link} target="_blank" rel="noopener noreferrer" className="font-mono text-xs underline underline-offset-2" style={{ color: "#c17f3a" }}>
            View
          </a>
        ) : (
          <span className="font-mono text-xs" style={{ color: "#c0b8ac" }}>—</span>
        )}
      </td>
    </tr>
  );
}

function formatInvoiceDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: currency || "USD" }).format(amount);
}
