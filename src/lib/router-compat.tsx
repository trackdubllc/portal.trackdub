/**
 * Compatibility shim for ported code that was written against `react-router`.
 *
 * The portal now uses `@tanstack/react-router`. Rather than rewrite every
 * feature import site, this shim re-exposes the small subset of `react-router`
 * APIs the ported code touches: `Link`, `NavLink`, `Outlet`, `useNavigate`,
 * `useParams`, `useLocation`.
 *
 * The `useNavigate` returned function accepts a path string (as react-router
 * did) and forwards to TanStack Router's typed navigate under the hood.
 */
import {
  Link as TSLink,
  Outlet,
  useLocation as useTSLocation,
  useNavigate as useTSNavigate,
  useParams as useTSParams,
} from "@tanstack/react-router";
import type { CSSProperties, ReactNode } from "react";

export { Outlet };

type AnyRecord = Record<string, unknown>;

export function Link({ to, ...rest }: { to: string } & AnyRecord) {
  // TanStack Link is type-safe against the generated route tree; the ported
  // code uses plain string paths, so we relax the type here on purpose.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <TSLink to={to as any} {...(rest as any)} />;
}

type NavLinkProps = {
  to: string;
  className?: string | ((args: { isActive: boolean }) => string);
  style?: CSSProperties | ((args: { isActive: boolean }) => CSSProperties);
  children?: ReactNode | ((args: { isActive: boolean }) => ReactNode);
  "aria-label"?: string;
};

export function NavLink({ to, className, style, children, ...rest }: NavLinkProps) {
  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    <TSLink to={to as any} {...(rest as any)}>
      {({ isActive }) => {
        const cn = typeof className === "function" ? className({ isActive }) : className;
        const st = typeof style === "function" ? style({ isActive }) : style;
        const inner = typeof children === "function" ? children({ isActive }) : children;
        return (
          <span className={cn} style={st}>
            {inner}
          </span>
        );
      }}
    </TSLink>
  );
}

type NavigateOptions = { replace?: boolean };

export function useNavigate() {
  const navigate = useTSNavigate();
  return (to: string | number, opts?: NavigateOptions) => {
    if (typeof to === "number") {
      window.history.go(to);
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    navigate({ to: to as any, replace: opts?.replace });
  };
}

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  return useTSParams({ strict: false }) as T;
}

export function useLocation() {
  return useTSLocation();
}
