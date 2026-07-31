---
kind: logging_system
name: Console-Based Error Logging with Global Interception
category: logging_system
scope:
    - '**'
source_files:
    - src/lib/error-capture.ts
    - src/server.ts
    - src/start.ts
    - src/routes/__root.tsx
    - src/lib/lovable-error-reporting.ts
---

The Trackdub Portal does not use a dedicated logging framework. Instead, it relies on the native `console.error` API as its sole logging mechanism, augmented by a global interception layer that expands error objects and captures unhandled exceptions for downstream reporting.

**System approach**
- All error output goes through `console.error`. There are no log levels, structured log fields, or separate info/debug/warn channels — only error-level output is produced.
- A single module (`src/lib/error-capture.ts`) monkey-patches `console.error` to expand any `Error` argument into a multi-line string that includes the full stack trace and cause chain (up to a depth of 5), truncated at 8,000 characters. Non-Error arguments pass through unchanged.
- The same module registers global `error` and `unhandledrejection` event listeners to capture errors that bypass `console.error`, storing them in a short-lived (5-second TTL) buffer so they can be retrieved later via `consumeLastCapturedError()`.

**Key files**
- `src/lib/error-capture.ts` — defines `describeError`, wraps `console.error`, installs global error/unhandledrejection listeners, and exports `consumeLastCapturedError`.
- `src/server.ts` — imports `error-capture` first, then uses `consumeLastCapturedError` to recover stacks when h3 swallows SSR throws into a generic `{"unhandled":true,"message":"HTTPError"}` response; logs recovered or synthetic errors via `console.error`.
- `src/start.ts` — TanStack Start server-entry middleware that catches unhandled route errors, logs them with `console.error`, and returns a rendered error page.
- `src/routes/__root.tsx` — React root error component calls `console.error(error)` and forwards the error to `reportLovableError` for external error tracking.
- `src/lib/lovable-error-reporting.ts` — client-side error reporter invoked from the root error boundary.

**Architecture and conventions**
- Errors flow through three interception points: (1) the patched `console.error` in `error-capture.ts`, (2) the TanStack Start request middleware in `start.ts`, and (3) the root route's `errorComponent` in `__root.tsx`. Each point logs via `console.error` and renders an HTML error page rather than returning raw JSON.
- h3-swallowed SSR errors are detected by inspecting the response body for `{"unhandled":true,"message":"HTTPError"}`; the captured error (or a synthetic fallback) is logged before serving the error page.
- Client-side errors reported through `reportLovableError` are sent to an external service (Lovable); server-side errors go only to `console.error`.

**Constraints and observed rules**
- No structured logging library is imported anywhere in the codebase; all output is plain text via `console.error`.
- Error expansion is bounded: cause chain depth capped at 5, description length capped at 8,000 characters, and captured errors expire after 5 seconds.
- Every error path ultimately produces a human-readable HTML error page rather than exposing raw error objects to clients.