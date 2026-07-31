---
kind: build_system
name: Build System — TanStack Start Monorepo with Vite, Bun & Cloudflare Workers
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - vite.config.ts
    - vite.sites.config.ts
    - bunfig.toml
    - scripts/prepare-sites-build.mjs
    - src/server.ts
    - sites/worker.js
    - tsconfig.json
    - .wrangler/deploy/config.json
---

## Build System Overview

This project uses a **multi-target build system** built on top of **Vite 8**, **Bun** as the package manager/runtime, and **TanStack Start** for SSR. The build produces two distinct outputs: a server-side rendered application (via Nitro/Cloudflare Workers) and a static client site, orchestrated through separate Vite configurations and a post-build script.

### Core Tools & Frameworks
- **Package Manager**: Bun v1.3.14 (enforced via `packageManager` field)
- **Build Tool**: Vite 8 with React plugin and Tailwind CSS v4
- **SSR Framework**: TanStack Start with Nitro backend (targeting Cloudflare Workers)
- **Runtime Target**: Cloudflare Workers (server entry) + static assets (client site)
- **TypeScript**: ES2022 target, Bundler module resolution, no emit mode
- **Code Quality**: ESLint 9 with TypeScript ESLint, Prettier formatting

### Build Architecture

The build pipeline consists of three sequential stages:

1. **Main App Build** (`vite build`): Compiles the TanStack Start SSR application using `@lovable.dev/vite-tanstack-config`, which automatically configures TanStack devtools, React, Tailwind, path aliases, environment variables, and error handling plugins.

2. **Client Site Build** (`vite build --config vite.sites.config.ts`): Builds a separate static client site to `dist/client/` using a minimal Vite configuration with React and Tailwind plugins.

3. **Post-Build Preparation** (`node scripts/prepare-sites-build.mjs`): Copies the Cloudflare Worker entry point (`sites/worker.js`) to `dist/server/index.js` and copies hosting configuration to `dist/.openai/hosting.json`.

### Key Configuration Files

- **`vite.config.ts`**: Main TanStack Start configuration that redirects the server entry to `src/server.ts`, which wraps the TanStack server with error handling middleware
- **`vite.sites.config.ts`**: Separate Vite config for the client-only site build targeting `dist/client/`
- **`bunfig.toml`**: Enforces supply-chain security with a 24-hour minimum release age for packages, with specific exceptions for Lovable development tools
- **`scripts/prepare-sites-build.mjs`**: Post-build script that prepares the Cloudflare Worker deployment structure
- **`src/server.ts`**: Custom server entry that handles SSR error normalization and h3 error detection
- **`sites/worker.js`**: Cloudflare Worker that serves static assets with SPA fallback routing

### Deployment Targets

The build system supports multiple deployment targets:
- **Cloudflare Pages**: Via `.wrangler/deploy/config.json` and the Worker adapter
- **OpenAI Hosting**: Via `.openai/hosting.json` configuration
- **Development**: Local development server with hot module replacement

### Security & Supply Chain

The build system enforces supply chain security through Bun's `minimumReleaseAge = 86400` (24 hours), preventing installation of recently published packages except for explicitly whitelisted Lovable development dependencies. This protects against malicious or unstable packages being introduced into the build pipeline.