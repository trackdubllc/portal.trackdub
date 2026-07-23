import { useState, useCallback } from "react";
import { Button, Card, ConfirmDialog, ErrorState, LoadingSpinner } from "@/components/portal";
import { useWebhooks, useDeleteWebhook, type WebhookRegistration } from "@/api/hooks/useWebhooks";
import { WebhookForm } from "./WebhookForm";
import { DeliveryLogViewer } from "./DeliveryLogViewer";

/**
 * Formats a date string to a human-readable locale date.
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Webhooks management section for the Settings page.
 *
 * Displays the list of webhook registrations with register, edit, delete actions
 * and an expandable delivery log viewer per webhook.
 *
 * Requirements: 12.6, 12.7, 12.8, 12.9, 12.10
 */
export function WebhooksSection() {
  const { data: webhooks, isLoading, isError, error, refetch } = useWebhooks();
  const deleteMutation = useDeleteWebhook();

  // Form state: null = hidden, "create" = new, webhook object = edit
  const [formState, setFormState] = useState<null | "create" | WebhookRegistration>(null);

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<WebhookRegistration | null>(null);

  // Expanded delivery logs
  const [expandedWebhookId, setExpandedWebhookId] = useState<string | null>(null);

  // Inline error state
  const [inlineError, setInlineError] = useState<string | null>(null);

  const handleRegisterClick = useCallback(() => {
    setFormState("create");
  }, []);

  const handleEditClick = useCallback((webhook: WebhookRegistration) => {
    setFormState(webhook);
  }, []);

  const handleFormClose = useCallback(() => {
    setFormState(null);
  }, []);

  const handleDeleteClick = useCallback((webhook: WebhookRegistration) => {
    setDeleteTarget(webhook);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!deleteTarget) return;
    setInlineError(null);
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
      },
      onError: (err) => {
        setDeleteTarget(null);
        setInlineError(err.message);
      },
    });
  }, [deleteTarget, deleteMutation]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleToggleDeliveries = useCallback((webhookId: string) => {
    setExpandedWebhookId((prev) => (prev === webhookId ? null : webhookId));
  }, []);

  if (isLoading) {
    return (
      <Card title="Webhooks">
        <LoadingSpinner message="Loading webhooks…" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card title="Webhooks">
        <ErrorState
          message={error?.message ?? "Failed to load webhooks."}
          onRetry={() => refetch()}
        />
      </Card>
    );
  }

  return (
    <Card title="Webhooks">
      {/* Inline error message */}
      {inlineError && (
        <div
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {inlineError}
        </div>
      )}

      {/* Register button */}
      {formState === null && (
        <div className="mb-4">
          <Button variant="primary" size="sm" onClick={handleRegisterClick}>
            Register Webhook
          </Button>
        </div>
      )}

      {/* Form (create or edit) */}
      {formState !== null && (
        <div className="mb-4">
          <WebhookForm
            webhook={formState === "create" ? undefined : formState}
            onClose={handleFormClose}
          />
        </div>
      )}

      {/* Webhooks list */}
      {webhooks && webhooks.length > 0 ? (
        <div className="space-y-3">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="rounded-md border border-gray-200 bg-white p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {/* URL */}
                  <p className="truncate font-mono text-sm text-gray-900">
                    {webhook.url}
                  </p>

                  {/* Event types as pills */}
                  <div className="mt-1 flex flex-wrap gap-1">
                    {webhook.eventTypes.map((eventType) => (
                      <span
                        key={eventType}
                        className="inline-block rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                      >
                        {eventType}
                      </span>
                    ))}
                  </div>

                  {/* Status and date */}
                  <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 font-medium ${
                        webhook.enabled
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {webhook.enabled ? "Enabled" : "Disabled"}
                    </span>
                    <span>Created {formatDate(webhook.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleToggleDeliveries(webhook.id)}
                    aria-expanded={expandedWebhookId === webhook.id}
                    aria-controls={`deliveries-${webhook.id}`}
                  >
                    {expandedWebhookId === webhook.id ? "Hide Log" : "Deliveries"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleEditClick(webhook)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDeleteClick(webhook)}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              {/* Delivery log (expandable) */}
              {expandedWebhookId === webhook.id && (
                <div id={`deliveries-${webhook.id}`} className="mt-3 border-t border-gray-100 pt-3">
                  <DeliveryLogViewer webhookId={webhook.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        formState === null && (
          <p className="text-sm text-gray-500">
            No webhooks configured. Register one to receive event notifications.
          </p>
        )
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete Webhook"
        message={`Are you sure you want to delete the webhook for "${deleteTarget?.url ?? ""}"? This action cannot be undone and you will stop receiving notifications at this URL.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </Card>
  );
}
