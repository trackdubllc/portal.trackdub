export interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  variant?: "spinner" | "skeleton";
}

export function LoadingSpinner({
  message,
  className = "",
  variant = "spinner",
}: LoadingSpinnerProps) {
  if (variant === "skeleton") {
    const { DashboardSkeletons } = require("./Skeleton");
    return (
      <div className={className}>
        <DashboardSkeletons />
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label={message ?? "Loading"}
      className={`flex flex-col items-center justify-center py-12 ${className}`}
    >
      <svg
        className="h-6 w-6 animate-spin"
        style={{ color: "#c17f3a" }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      {message && (
        <p className="mt-3 font-mono text-xs" style={{ color: "#8a8a82" }}>{message}</p>
      )}
    </div>
  );
}
