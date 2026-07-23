import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/portal";
import {
  useRegisterWebhook,
  useUpdateWebhook,
  type WebhookRegistration,
  type ApiError,
} from "@/api/hooks/useWebhooks";

const ALLOWED_EVENT_TYPES = [
  "job.completed",
  "job.failed",
  "subscription.updated",
] as const;

interface WebhookFormProps {
  /** If provided, the form operates in edit mode with pre-filled values. */
  webhook?: WebhookRegistration;
  /** Called when the form is successfully submitted or cancelled. */
  onClose: () => void;
}

/**
 * Form for registering or editing a webhook.
 *
 * - URL text input (required, HTTPS)
 * - Event type checkboxes
 * - Enabled toggle (edit mode only)
 * - Displays validation (400) and limit (409) errors inline
 *
 * Requirements: 12.7, 12.8, 12.9
 */
export function WebhookForm({ webhook, onClose }: WebhookFormProps) {
  const isEditMode = !!webhook;

  const [url, setUrl] = useState(webhook?.url ?? "");
  const [eventTypes, setEventTypes] = useState<string[]>(
    webhook?.eventTypes ?? [],
  );
  const [enabled, setEnabled] = useState(webhook?.enabled ?? true);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const registerMutation = useRegisterWebhook();
  const updateMutation = useUpdateWebhook();

  const isPending = registerMutation.isPending || updateMutation.isPending;

  // Reset errors when inputs change
  useEffect(() => {
    setFormError(null);
    setFieldErrors({});
  }, [url, eventTypes, enabled]);

  const handleEventTypeToggle = useCallback((eventType: string) => {
    setEventTypes((prev) =>
      prev.includes(eventType)
        ? prev.filter((t) => t !== eventType)
        : [...prev, eventType],
    );
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setFormError(null);
      setFieldErrors({});

      // Client-side validation
      if (!url.trim()) {
        setFieldErrors({ url: ["URL is required"] });
        return;
      }

      if (eventTypes.length === 0) {
        setFieldErrors({ eventTypes: ["At least one event type must be selected"] });
        return;
      }

      const handleError = (err: unknown) => {
        const apiErr = err as ApiError;
        if (apiErr.fieldErrors) {
          setFieldErrors(apiErr.fieldErrors);
        }
        setFormError(apiErr.message ?? "An unexpected error occurred");
      };

      if (isEditMode && webhook) {
        updateMutation.mutate(
          { id: webhook.id, body: { url: url.trim(), eventTypes, enabled } },
          {
            onSuccess: () => onClose(),
            onError: handleError,
          },
        );
      } else {
        registerMutation.mutate(
          { url: url.trim(), eventTypes },
          {
            onSuccess: () => onClose(),
            onError: handleError,
          },
        );
      }
    },
    [url, eventTypes, enabled, isEditMode, webhook, registerMutation, updateMutation, onClose],
  );

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-gray-200 bg-gray-50 p-4"
      aria-label={isEditMode ? "Edit webhook" : "Register webhook"}
    >
      <h4 className="mb-4 text-sm font-semibold text-gray-900">
        {isEditMode ? "Edit Webhook" : "Register Webhook"}
      </h4>

      {/* Form-level error */}
      {formError && (
        <div
          className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {formError}
        </div>
      )}

      {/* URL input */}
      <div className="mb-4">
        <label
          htmlFor="webhook-url"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          Webhook URL
        </label>
        <input
          id="webhook-url"
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/webhook"
          required
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          aria-describedby={fieldErrors.url ? "url-error" : undefined}
          aria-invalid={!!fieldErrors.url}
        />
        {fieldErrors.url && (
          <p id="url-error" className="mt-1 text-xs text-red-600">
            {fieldErrors.url[0]}
          </p>
        )}
      </div>

      {/* Event type checkboxes */}
      <fieldset className="mb-4">
        <legend className="mb-2 text-sm font-medium text-gray-700">
          Event Types
        </legend>
        <div className="space-y-2">
          {ALLOWED_EVENT_TYPES.map((eventType) => (
            <label
              key={eventType}
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                checked={eventTypes.includes(eventType)}
                onChange={() => handleEventTypeToggle(eventType)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="font-mono text-xs">{eventType}</span>
            </label>
          ))}
        </div>
        {fieldErrors.eventTypes && (
          <p className="mt-1 text-xs text-red-600">
            {fieldErrors.eventTypes[0]}
          </p>
        )}
      </fieldset>

      {/* Enabled toggle (edit mode only) */}
      {isEditMode && (
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Enabled</span>
          </label>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          type="submit"
          variant="primary"
          size="sm"
          loading={isPending}
          disabled={isPending}
        >
          {isEditMode ? "Save Changes" : "Register"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={onClose}
          disabled={isPending}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
