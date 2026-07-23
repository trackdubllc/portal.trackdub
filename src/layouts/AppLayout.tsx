import { Outlet } from "@/lib/router-compat";
import { Sidebar } from "./Sidebar";
import { useAuth } from "../features/auth/AuthProvider";

export function AppLayout() {
  const { user, signOut } = useAuth();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#f5f3ee" }}>
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className="flex h-12 items-center justify-end px-6"
          style={{ borderBottom: "1px solid #e0dbd2", background: "#f5f3ee" }}
        >
          <div className="flex items-center gap-3">
            <span className="text-xs" style={{ color: "#8a8a82" }}>
              {user?.username ?? ""}
            </span>
            <button
              onClick={signOut}
              className="px-2.5 py-1 text-xs transition-colors"
              style={{
                border: "1px solid #d0cab8",
                color: "#6b6b5e",
                background: "transparent",
              }}
              onMouseEnter={(e) => {
                (e.target as HTMLElement).style.background = "#ede9e2";
                (e.target as HTMLElement).style.color = "#1c1c1a";
              }}
              onMouseLeave={(e) => {
                (e.target as HTMLElement).style.background = "transparent";
                (e.target as HTMLElement).style.color = "#6b6b5e";
              }}
            >
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
