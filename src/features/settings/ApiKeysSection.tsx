import { useState } from "react";
import { Button, Card, ErrorState, LoadingSpinner } from "@/components/portal";
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  type CreatedApiKey,
} from "@/api/hooks/useApiKeys";

/**
 * API keys management for the current tenant. Wires to `/api/keys` on
 * api.trackdub.com. Newly created plaintext keys are revealed exactly
 * once — the server never returns them again.
 */
export function ApiKeysSection() {
  const { data: keys, isLoading, isError, error, refetch } = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();

  const [name, setName] = useState("");
  const [justCreated, setJustCreated] = useState<CreatedApiKey | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const disabledCreate = name.trim().length === 0 || createKey.isPending;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (disabledCreate) return;
    setJustCreated(null);
    setCopyState("idle");
    try {
      const created = await createKey.mutateAsync({ name: name.trim() });
      setJustCreated(created);
      setName("");
    } catch {
      // Error surfaced via createKey.error below.
    }
  }

  async function handleCopy(plaintext: string) {
    try {
      await navigator.clipboard.writeText(plaintext);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    } catch {
      setCopyState("idle");
    }
  }

  return (
    <Card title="API Keys">
      <div className="space-y-6">
        <p className="text-sm text-gray-600">
          Generate keys for programmatic access to the Trackdub API. The
          plaintext value is shown once at creation — store it somewhere safe.
        </p>

        {/* Create form */}
        <form onSubmit={handleCreate} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Key name (e.g. Production worker)"
            maxLength={64}
            className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <Button type="submit" disabled={disabledCreate}>
            {createKey.isPending ? "Creating…" : "Create key"}
          </Button>
        </form>

        {createKey.isError && (
          <p role="alert" className="text-sm text-red-600">
            {createKey.error instanceof Error
              ? createKey.error.message
              : "Failed to create key."}
          </p>
        )}

        {/* Just-created plaintext reveal */}
        {justCreated && (
          <div className="rounded-md border border-green-300 bg-green-50 p-3">
            <p className="text-sm font-medium text-green-800">
              New key created — copy it now. You won't see it again.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded bg-white px-2 py-1 text-xs">
                {justCreated.plaintext}
              </code>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleCopy(justCreated.plaintext)}
              >
                {copyState === "copied" ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>
        )}

        {/* List */}
        {isLoading ? (
          <LoadingSpinner message="Loading keys..." />
        ) : isError ? (
          <ErrorState
            message={error instanceof Error ? error.message : "Failed to load keys."}
            onRetry={() => refetch()}
          />
        ) : keys && keys.length > 0 ? (
          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {k.name}
                    {k.prefix ? (
                      <span className="ml-2 font-mono text-xs text-gray-500">
                        {k.prefix}…
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-gray-500">
                    Created {new Date(k.createdAt).toLocaleDateString()}
                    {k.lastUsedAt
                      ? ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`
                      : " · Never used"}
                    {k.revokedAt ? " · Revoked" : ""}
                  </p>
                </div>
                {!k.revokedAt && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (
                        window.confirm(
                          `Revoke "${k.name}"? Requests using this key will start failing immediately.`,
                        )
                      ) {
                        revokeKey.mutate(k.id);
                      }
                    }}
                    disabled={revokeKey.isPending && revokeKey.variables === k.id}
                  >
                    {revokeKey.isPending && revokeKey.variables === k.id
                      ? "Revoking…"
                      : "Revoke"}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No API keys yet.</p>
        )}
      </div>
    </Card>
  );
}
