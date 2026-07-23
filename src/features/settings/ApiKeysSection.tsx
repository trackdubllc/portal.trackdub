import { Card } from "@/components/portal";

/**
 * API keys for the portal are validated server-side (appsettings / environment).
 * Per-tenant CRUD is not exposed on the API yet — avoid calling missing /api/settings routes.
 */
export function ApiKeysSection() {
  return (
    <Card title="API Keys">
      <p className="text-sm text-gray-600">
        Portal API keys are configured on the API host (environment or appsettings), not in this UI.
        Contact your operator to rotate keys. In-app key management will ship in a follow-up.
      </p>
    </Card>
  );
}
