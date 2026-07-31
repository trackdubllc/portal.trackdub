---
kind: frontend_style
name: Tailwind + shadcn/ui Design System with CSS Variables and Dark Mode
category: frontend_style
scope:
    - '**'
source_files:
    - src/styles.css
    - components.json
    - src/lib/utils.ts
    - package.json
    - vite.config.ts
    - eslint.config.js
    - .prettierrc
---

The Trackdub portal uses a modern, token-driven styling system built on Tailwind CSS v4, shadcn/ui (New York style), and CSS custom properties for theming.

**System overview**
- **CSS framework**: Tailwind CSS v4 with the `@tailwindcss/vite` plugin, imported via `@import "tailwindcss" source(none)` in `src/styles.css`. Source scanning is configured to look inside `../src`.
- **Component library**: shadcn/ui installed under `src/components/ui/`, generated from Radix UI primitives. The `components.json` config specifies `style: "new-york"`, `baseColor: "slate"`, `cssVariables: true`, and `iconLibrary: "lucide"`.
- **Animation**: `tw-animate-css` is imported alongside Tailwind for utility animations.
- **Build tooling**: Vite configuration is provided by `@lovable.dev/vite-tanstack-config`, which auto-includes Tailwind, path aliases (`@/*`), and React/TanStack plugins.

**Design tokens and theming**
All visual tokens are defined as CSS custom properties in `src/styles.css` using the `oklch` color space:
- A `@theme inline` block maps semantic names (`--color-primary`, `--color-background`, `--color-card`, etc.) to CSS variables so they become available as Tailwind utilities (e.g., `bg-primary`, `text-foreground`).
- Light theme lives under `:root`, dark theme under `.dark`, enabling automatic dark mode via the `dark` class strategy.
- Radius tokens (`--radius-sm` through `--radius-4xl`) derive from a base `--radius` variable.
- Color families include standard UI roles (background, foreground, card, popover, primary, secondary, muted, accent, destructive) plus chart colors (`--chart-1` through `--chart-5`) and sidebar-specific tokens.
- All colors must use `oklch` format, enforced by the inline comment in `src/styles.css`.

**Utility conventions**
- Class merging is centralized in `src/lib/utils.ts` via a `cn()` helper that composes `clsx` and `tailwind-merge`, used throughout shadcn components for conditional class application.
- A custom `dark` variant is registered with `@custom-variant dark (&:is(.dark *))` so Tailwind can target dark-mode styles consistently.

**Typography and global styles**
- Global fonts are set in a `@layer base` block: `Space Grotesk` for body text and `JetBrains Mono` for code elements, loaded via `<link>` tags in `src/routes/__root.tsx`.
- Custom scrollbar styling uses `::-webkit-scrollbar` pseudo-elements with a warm off-white palette matching the legacy portal aesthetic.

**Architecture and file organization**
- Global styles live in a single `src/styles.css` entry point.
- Reusable UI primitives are under `src/components/ui/` (shadcn-generated Radix wrappers).
- Feature-specific higher-level components live under `src/components/portal/` (Button, Card, Table, Pagination, Skeleton, etc.), composed from the shadcn primitives.
- No per-component CSS files — styling is applied entirely through Tailwind utility classes and CSS variables.

**Enforced constraints**
- ESLint disallows importing `server-only` (replaced by `*.server.ts` convention or `@tanstack/react-start/server-only`).
- Prettier enforces consistent formatting: 100-char print width, semicolons, double quotes, trailing commas everywhere.
- The `@source "../src"` directive ensures Tailwind scans only the `src/` directory for class usage.