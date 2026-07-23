import { authClient, type AuthClientResult } from "./auth-client";

/**
 * Session shape returned by GET /api/auth/session.
 * Adjust field names to match the Worker's Better Auth response.
 */
export type SessionUser = {
  id: string;
  email: string;
  name?: string | null;
  emailVerified?: boolean;
  image?: string | null;
};

export type Session = {
  user: SessionUser;
  expiresAt?: string;
};

export type AuthResult<T> = AuthClientResult<T>;

export const authService = {
  /** Returns the current session, or `null` when unauthenticated. */
  async getSession(signal?: AbortSignal): Promise<Session | null> {
    const res = await authClient.get<Session | null>("/api/auth/session", { signal });
    if (!res.ok) {
      // 401/403 are expected "no session" — surface as null.
      if (res.status === 401 || res.status === 403) return null;
      return null;
    }
    // Better Auth returns `null` or an empty body when no session.
    if (!res.data || !("user" in res.data)) return null;
    return res.data;
  },

  signIn(input: { email: string; password: string }) {
    return authClient.post<{ user: SessionUser }>("/api/auth/sign-in/email", input);
  },

  signOut() {
    return authClient.post<{ ok: true }>("/api/auth/sign-out");
  },

  forgotPassword(input: { email: string; redirectTo?: string }) {
    return authClient.post<{ ok: true }>("/api/auth/forget-password", input);
  },

  resetPassword(input: { token: string; newPassword: string }) {
    return authClient.post<{ ok: true }>("/api/auth/reset-password", input);
  },
};
