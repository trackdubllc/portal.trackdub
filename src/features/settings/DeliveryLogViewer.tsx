import { Button, LoadingSpinner, ErrorState } from "@/components/portal";
import { useDeliveryHistory } from "@/api/hooks/useWebhooks";

interface DeliveryLogViewerProps {
  webhookId: string;
}

/**
 * Formats a delivery status into a human-readable label.
 */
function getStatusLabel(delivered: boolean, nextRetryAt: string | null): string {
  if (delivered) return "delivered";
  if (nextRetryAt) return "pending";
  return "failed";
}

/**
 * Returns a CSS class for the delivery status badge.
 */
function getStatusClass(delivered: boolean, nextRetryAt: string | null): string {
  if (delivered) return "bg-green-100 text-green-700";
  if (nextRetryAt) return "bg-yellow-100 text-yellow-700";
  return "bg-red-100 text-red-700";
}

/**
 * Formats an ISO timestamp to a compact locale string.
 */
function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Paginated delivery history viewer for a webhook.
 *
 * Shows event type, status (delivered/failed/pending), HTTP code, attempt count,
 * and timestamp. Uses cursor-based pagination with a "Load More" button.
 *
 * Requirements: 12.10
 */
export function DeliveryLogViewer({ webhookId }: DeliveryLogViewerProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useDeliveryHistory(webhookId);

  if (isLoading) {
    return <LoadingSpinner message="Loading delivery history…" />;
  }

  if (isError) {
    return (
      <ErrorState
        message={error?.message ?? "Failed to load delivery history."}
        onRetry={() => refetch()}
      />
    );
  }

  const deliveries = data?.pages.flatMap((page) => page.items) ?? [];

  if (deliveries.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-2">
        No delivery history yet.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs font-medium uppercase text-gray-500">
              <th className="pb-2 pr-3" scope="col">Event Type</th>
              <th className="pb-2 pr-3" scope="col">Status</th>
              <th className="pb-2 pr-3" scope="col">HTTP Code</th>
              <th className="pb-2 pr-3" scope="col">Attempts</th>
              <th className="pb-2" scope="col">Timestamp</th>
            </tr>
          </thead>
          <tbody>
            {deliveries.map((delivery) => (
              <tr
                key={delivery.id}
                className="border-b border-gray-100 last:border-b-0"
              >
                <td className="py-2 pr-3 font-mono text-xs text-gray-900">
                  {delivery.eventType}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusClass(delivery.delivered, delivery.nextRetryAt)}`}
                  >
                    {getStatusLabel(delivery.delivered, delivery.nextRetryAt)}
                  </span>
                </td>
                <td className="py-2 pr-3 text-xs text-gray-700">
                  {delivery.httpStatus || "—"}
                </td>
                <td className="py-2 pr-3 text-xs text-gray-700">
                  {delivery.attempts}
                </td>
                <td className="py-2 text-xs text-gray-600">
                  {formatTimestamp(delivery.firstAttemptAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Load More button */}
      {hasNextPage && (
        <div className="mt-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
            disabled={isFetchingNextPage}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
