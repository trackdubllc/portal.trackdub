import { afterEach, describe, expect, it, vi } from "vitest";
import { authService, SessionTransientError } from "../src/lib/auth/auth-service";
import { ensureSession, invalidateSession } from "../src/lib/auth/ensure-session";
import { authClient } from "../src/lib/auth/auth-client";

afterEach(() => {
  vi.restoreAllMocks();
  invalidateSession();
});

describe("session failure classification", () => {
  it("treats 401/403 as unauthenticated", async () => {
    vi.spyOn(authClient, "get").mockResolvedValue({
      ok: false,
      status: 401,
      message: "expired",
    } as never);
    await expect(authService.getSession()).resolves.toBeNull();
  });

  it("treats network and server errors as transient and clears rejected cache", async () => {
    vi.spyOn(authClient, "get")
      .mockResolvedValueOnce({ ok: false, status: 503, message: "Unavailable" } as never)
      .mockResolvedValueOnce({ ok: true, status: 200, data: null } as never);
    await expect(ensureSession()).rejects.toBeInstanceOf(SessionTransientError);
    await expect(ensureSession()).resolves.toBeNull();
  });
});
