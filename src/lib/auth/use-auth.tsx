import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService, type Session } from "./auth-service";
import { ensureSession, invalidateSession, setSession } from "./ensure-session";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: Session | null;
  user: Session["user"] | null;
  /** Force a re-read of GET /api/auth/session. */
  refresh: () => Promise<Session | null>;
  /** Local-only: update after sign-in / sign-out so React re-renders. */
  setLocalSession: (session: Session | null) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    ensureSession().then((s) => {
      if (cancelled) return;
      setSessionState(s);
      setStatus(s ? "authenticated" : "unauthenticated");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    invalidateSession();
    const s = await authService.getSession();
    setSession(s);
    setSessionState(s);
    setStatus(s ? "authenticated" : "unauthenticated");
    return s;
  }, []);

  const setLocalSession = useCallback((next: Session | null) => {
    setSession(next);
    setSessionState(next);
    setStatus(next ? "authenticated" : "unauthenticated");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, session, user: session?.user ?? null, refresh, setLocalSession }),
    [status, session, refresh, setLocalSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
