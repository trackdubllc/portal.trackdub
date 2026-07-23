## Goal

This project becomes **portal.trackdub.com** — a TanStack Start React app configured as a client-rendered SPA/static deployment. All authentication, user management, licensing, API keys, and job metadata live on the separate **api.trackdub.com** Cloudflare Worker (Better Auth + D1). This project holds no backend logic, no secrets, no Lovable Cloud, no Supabase.

## Architecture

```text
portal.trackdub.com                api.trackdub.com
(this Lovable project)             (Cloudflare Worker — separate repo)
  React portal UI            ─►     /api/auth/* (Better Auth: sign-in,
  Auth client/service                sign-out, forgot, reset, session)
  Route guards (UX only)     ─►     /api/users, /api/licenses,
                                     /api/keys, /api/jobs
                                     D1 database, Trackdub services
```

### Cookie contract (confirmed)

Worker issues a **host-only** session cookie for `api.trackdub.com`:
`Secure; HttpOnly; SameSite=Lax; Path=/`. No `Domain=` attribute. No Better Auth `crossSubDomainCookies`. Portal calls `https://api.trackdub.com/api/...` with `credentials: "include"`; portal JS never reads the cookie.

### Worker CORS requirements (external to this project, listed for the contract)

- Allow exact origin `https://portal.trackdub.com` (never `*`).
- `Access-Control-Allow-Credentials: true`.
- Handle `OPTIONS` preflight.
- Include `https://portal.trackdub.com` in Better Auth `trustedOrigins`.
- Every protected endpoint authorizes independently — portal route guards are UX only.

### Deployment mode

TanStack Start configured as a **client-rendered SPA / static deployment**. No server functions, no server routes, no server loaders, no framework-side auth middleware, no backend persistence. All protected data loads client-side from `api.trackdub.com` after the session is established. Protected pages show an auth-loading state on first paint — expected for cookie-auth with an HttpOnly session.

## Step 1 — Selective port from `Trackdub/frontend` (GitHub)

Ported: pages, components, styles, static assets, and useful API call shapes.
Not ported: old routing, build config, backend code, env setup, framework-specific infra.

Working process:

1. You give me read access to the GitHub repo (public read, a share link, or push the relevant files/tree into this project's repo via GitHub sync — I don't need the build config).
2. I map source pages → TanStack routes under `src/routes/` (see Step 3), source components → `src/components/`, and shared UI primitives → `src/components/ui/` (shadcn already wired here).
3. Styles: port design tokens into `src/styles.css` (`:root` / `.dark` blocks) so components use semantic Tailwind classes. If the source uses CSS-in-JS or module CSS, I convert to Tailwind utilities against the ported tokens.
4. Assets: images/fonts/media go through Lovable's assets CDN (upload with `lovable-assets create`, commit the `.asset.json` pointer, remove the binary). Small inline SVG icons stay in code.
5. API call shapes: I extract endpoint paths, request/response types, and query keys into `src/lib/api/` typed modules (one file per resource: `users.ts`, `licenses.ts`, `api-keys.ts`, `jobs.ts`). Old auth/HTTP client code is replaced by the new `auth-client.ts` (Step 2). No hardcoded base URLs or auth logic carried over.

I'll checkpoint after mapping the file tree and again after the first page is ported, so you can course-correct on styling/structure before I proceed broadly.

## Step 2 — Auth client/service (no secrets in frontend)

`src/lib/auth/`:

- `auth-client.ts` — fetch wrapper. Base URL from `import.meta.env.VITE_API_BASE_URL` (public build variable, not a secret — compiled into the browser bundle). All calls `credentials: "include"`. No Authorization header.
- `auth-service.ts` — typed methods `signIn`, `signOut`, `forgotPassword`, `resetPassword`, `getSession`. Returns discriminated unions; no throws on expected auth failures.
- `use-auth.tsx` — React context + `useAuth()` for rendering signed-in chrome and sign-in state.
- `ensure-session.ts` — **awaitable, memoized** session source used by route guards. `ensureSession(): Promise<Session | null>` caches the in-flight promise; `invalidateSession()` clears it after sign-in/sign-out.

No passwords, tokens, service credentials, or private API keys are stored in this repo.

## Step 3 — Route structure and awaitable guard

```text
src/routes/
  __root.tsx                 AuthProvider + QueryClientProvider around
                             <Outlet/>; router context carries
                             { auth: { ensureSession, invalidateSession, ... },
                               queryClient }
  index.tsx                  await ensureSession() → /dashboard or /login
  login.tsx                  sign-in form; on success invalidate + navigate
                             to search.redirect || /dashboard
  forgot-password.tsx        request reset email
  reset-password.tsx         accept token from URL, set new password
  _authenticated.tsx         pathless guard (see below)
  _authenticated/
    dashboard.tsx            + every ported portal page
    ...
```

Guard contract in `_authenticated.tsx`:

```ts
beforeLoad: async ({ context, location }) => {
  const session = await context.auth.ensureSession(); // awaitable, not React state
  if (!session?.user) {
    throw redirect({ to: "/login", search: { redirect: location.href } });
  }
}
```

- MUST resolve session before deciding; never treats "still loading" as unauthenticated.
- `context.auth` wired via `createRootRouteWithContext` and injected at router creation.
- `useAuth()` used for rendering signed-in chrome.
- Sign-out: `authService.signOut()` → `invalidateSession()` → `queryClient.clear()` → `navigate({ to: "/login", replace: true })`.
- No signup route — invite-only enforced by the Worker.

Route metadata: each ported page's `head()` gets a Trackdub-specific title + description (no "Lovable App" leftovers).

## Step 4 — Config

- `VITE_API_BASE_URL = https://api.trackdub.com` — **public build environment variable**, compiled into the browser bundle. Treat as non-confidential.
- Optional `VITE_APP_ENV` for banner/logging.

Documented in `README.md`.

## Step 5 — Custom domain

After the portal builds cleanly and flows are verified against `api.trackdub.com`, connect **portal.trackdub.com** in Project Settings → Domains. If DNS is behind Cloudflare proxy, tick "Domain uses Cloudflare or similar proxy".

## Explicitly out of scope

- Cloudflare Worker code, Better Auth setup, D1 schema, CORS/cookie config on the Worker.
- Lovable Cloud, Supabase, TanStack server functions, server routes, server loaders, or SSR-side auth in this project.
- Storing passwords, tokens, service credentials, or private API keys.
- Signup UI.
- Porting the old build config, routing, or backend code.

## What I need from you to start Step 1

Tell me how you want me to access `Trackdub/frontend` — repo URL for public read, a share method, or a note that you'll push it into this project's GitHub sync. Then I'll post the file-tree map and first-page checkpoint before doing broad porting.
