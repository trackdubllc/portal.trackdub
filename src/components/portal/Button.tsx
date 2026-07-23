import { type ButtonHTMLAttributes, forwardRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, React.CSSProperties> = {
  primary: {
    background: "#1c1c1a",
    color: "#f0ede8",
    border: "1px solid #1c1c1a",
  },
  secondary: {
    background: "transparent",
    color: "#3a3a32",
    border: "1px solid #c0b8ac",
  },
  danger: {
    background: "#991b1b",
    color: "#fff",
    border: "1px solid #991b1b",
  },
};

const variantHover: Record<ButtonVariant, React.CSSProperties> = {
  primary: { background: "#2e2e2a", borderColor: "#2e2e2a" },
  secondary: { background: "#ede9e2", borderColor: "#a09890" },
  danger: { background: "#7f1d1d", borderColor: "#7f1d1d" },
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-2.5 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      disabled,
      children,
      className = "",
      onMouseEnter,
      onMouseLeave,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        aria-disabled={isDisabled}
        aria-busy={loading}
        className={`inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c17f3a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${sizeStyles[size]} ${className}`}
        style={variantStyles[variant]}
        onMouseEnter={(e) => {
          if (!isDisabled) {
            Object.assign((e.currentTarget as HTMLElement).style, variantHover[variant]);
          }
          onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          Object.assign((e.currentTarget as HTMLElement).style, variantStyles[variant]);
          onMouseLeave?.(e);
        }}
        {...props}
      >
        {loading && (
          <svg
            className="mr-2 h-3.5 w-3.5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
