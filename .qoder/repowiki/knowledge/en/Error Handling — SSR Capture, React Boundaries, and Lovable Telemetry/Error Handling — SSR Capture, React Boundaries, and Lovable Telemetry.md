---
kind: error_handling
name: Error Handling — SSR Capture, React Boundaries, and Lovable Telemetry
category: error_handling
scope:
    - '**'
source_files:
    - src/lib/error-capture.ts
    - src/lib/error-page.ts
    - src/lib/lovable-error-reporting.ts
    - src/server.ts
    - src/routes/__root.tsx
    - src/components/portal/ErrorState.tsx
---

The Trackdub portal uses a layered error-handling strategy that spans server-side SSR capture, React Router error boundaries, and client-side telemetry reporting.

**1. Server-side SSR error capture (`src/lib/error-capture.ts`, `src/server.ts`)**
- `error-capture.ts` monkey-patches `console.error` to expand Error objects (including `cause` chains up to depth 5) into readable strings before logging, and records the last captured error in memory with a 5-second TTL. It also hooks global `error` and `unhandledrejection` events to record those as well.
- `server.ts` imports this module at startup so every unhandled error is captured. The fetch wrapper detects when h3 has swallowed an SSR throw into a generic `{"unhandled":true,"message":"HTTPError"}` JSON response, logs the previously captured error via `consumeLastCapturedError()`, and returns a static HTML 500 page from `renderErrorPage()` instead of leaking the sanitized payload.
- `src/lib/error-page.ts` provides a minimal inline HTML 500 page with "Try again" and "Go home" actions.

**2. React error boundary (`src/routes/__root.tsx`)**
- TanStack Router's root route defines an `errorComponent: ErrorComponent` that catches any uncaught React render/loader errors. It logs the error, calls `reportLovableError(error, { boundary: "tanstack_root_error_boundary" })`, and renders a friendly UI with retry/home actions.
- A dedicated `NotFoundComponent` handles 404s separately.

**3. Client-side telemetry (`src/lib/lovable-error-reporting.ts`)**
- `reportLovableError` forwards caught errors to the Lovable editor's runtime hook (`window.__lovableEvents.captureException` and `window.__lovableReportRuntimeError`). It special-cases `Response` objects by extracting status and URL, and falls back to `String(error)` for non-Error values.
- Errors are tagged with `mechanism: "react_error_boundary"`, `handled: false`, and `severity: "error"`, and include the current route pathname.

**4. Feature-layer error presentation (`src/components/portal/ErrorState.tsx`)**
- A reusable `<ErrorState>` component surfaces user-facing error messages with optional retry/go-back callbacks. It is used consistently across feature pages (billing, jobs, settings) to display data-fetch failures returned by React Query hooks.

**5. API hook error propagation**
- Each `use*` hook in `src/api/hooks/` throws plain `new Error(...)` on network failures or non-OK responses, often including the HTTP status and a body message. These errors bubble up to either the feature-level `ErrorState` component or the root router error boundary.

**Architecture & conventions**
- Errors flow upward: API hooks throw `Error`, features render `ErrorState`, unhandled errors hit the TanStack root `errorComponent`, and server-side SSR crashes are intercepted by the h3-aware wrapper in `server.ts`.
- All errors are logged through the patched `console.error`, which expands stack traces and cause chains before they reach the log pipeline.
- Production React error-boundary errors are additionally forwarded to Lovable's editor telemetry so developers can see them during preview.

**Constraints observed**
- h3-swallowed SSR errors are detected by parsing the JSON body for `{ unhandled: true, message: "HTTPError" }`; only then is the fallback HTML 500 rendered.
- Captured errors expire after 5 seconds (`TTL_MS = 5_000`) to avoid stale state across requests.
- Cause chain expansion is limited to 5 levels and output is truncated at 8,000 characters.