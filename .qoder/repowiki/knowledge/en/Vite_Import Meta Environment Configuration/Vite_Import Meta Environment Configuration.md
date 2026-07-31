---
kind: configuration_system
name: Vite/Import Meta Environment Configuration
category: configuration_system
scope:
    - '**'
source_files:
    - src/lib/config.ts
    - vite.config.ts
    - vite.sites.config.ts
    - src/api/client.ts
    - package.json
    - .lovable/plan.md
---

The Trackdub Portal uses a minimal, Vite-native configuration system built around `import.meta.env` with a single centralized module. There is no runtime config loader, dotenv parsing, or server-side environment handling — configuration is purely a build-time concern.

**What system/approach is used**
- Vite's built-in `import.meta.env` injection for public build variables (prefixed `VITE_`).
- A thin TypeScript module (`src/lib/config.ts`) that re-exports these values with defaults, so consumers never see undefined.
- The `@lovable.dev/vite-tanstack-config` preset handles all Vite plugin wiring, including `VITE_*` env injection, path aliases, and Nitro/Cloudflare target selection.

**Key files and packages**
- `src/lib/config.ts` — the single source of truth for public config; exports `API_BASE_URL` and `APP_ENV`.
- `vite.config.ts` — delegates to `@lovable.dev/vite-tanstack-config`; only overrides the TanStack Start server entry point.
- `vite.sites.config.ts` — separate Vite config for the client site build, re-defining the `@` alias and output directory.
- `package.json` scripts — `dev`, `build`, `build:dev`, `preview` drive Vite with different modes.
- `.lovable/plan.md` and `README.md` document the two supported env vars.

**Architecture and conventions**
- All public configuration flows through `import.meta.env.VITE_*` variables set at build time via `.env` files or the host environment. There is no runtime override mechanism.
- Defaults are baked into the code (`https://api.trackdub.com` for API base URL, `production` for app env), so missing env vars do not break the build.
- The API client (`src/api/client.ts`) and auth client both import `API_BASE_URL` from `@/lib/config`, ensuring a single source of truth.
- Some feature pages (e.g., `CreateJobPage.tsx`, `JobDetailPage.tsx`) access `import.meta.env.VITE_API_BASE_URL` directly instead of going through the shared module — an inconsistency in the codebase.
- Secrets are intentionally avoided: the README explicitly marks `VITE_API_BASE_URL` as "public build variable — not secret" because it is compiled into the browser bundle.

**Conventions and constraints**
- Only `VITE_API_BASE_URL` and `VITE_APP_ENV` are recognized by the application; adding new public config requires adding a corresponding `VITE_*` variable and exporting it from `src/lib/config.ts`.
- The `bunfig.toml` enforces a supply-chain guard (`minimumReleaseAge = 86400`) that blocks package versions published less than 24 hours ago, with explicit exceptions listed for Lovable dev tools.
- No `.env` file is committed; environment variables are expected to be provided by the deployment environment or local `.env` files excluded by `.gitignore`.
- The server entry (`src/server.ts`) does not read any environment variables — it only wraps the TanStack Start handler for error normalization.