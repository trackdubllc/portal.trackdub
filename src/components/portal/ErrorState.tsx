import { Button } from "./Button";

export interface ErrorStateProps {
  message?: string;
  title?: string;
  onRetry?: () => void;
  onGoBack?: () => void;
  className?: string;
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this page.",
  onRetry,
  onGoBack,
  className = "",
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center py-12 text-center ${className}`}
    >
      <svg
        className="mb-4 h-10 w-10"
        style={{ color: "#b91c1c" }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
      </svg>
      <h2 className="mb-1 text-sm font-semibold" style={{ color: "#1c1c1a" }}>{title}</h2>
      <p className="mb-6 max-w-md font-mono text-xs" style={{ color: "#8a8a82" }}>{message}</p>
      <div className="flex gap-3">
        {onRetry && <Button variant="primary" size="sm" onClick={onRetry}>Try Again</Button>}
        {onGoBack && <Button variant="secondary" size="sm" onClick={onGoBack}>Go Back</Button>}
      </div>
    </div>
  );
}
