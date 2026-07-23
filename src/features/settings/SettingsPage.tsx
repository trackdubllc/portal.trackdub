import { ApiKeysSection } from "./ApiKeysSection";
import { WebhooksSection } from "./WebhooksSection";

/**
 * Settings page container.
 *
 * Provides sections for API Keys management and Webhook configuration.
 * Requirements: 12.1–12.10
 */
export function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* API Keys section */}
      <ApiKeysSection />

      {/* Webhooks section */}
      <WebhooksSection />
    </div>
  );
}
