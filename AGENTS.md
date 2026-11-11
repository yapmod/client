# AGENTS.md

Yapmod is a client mod for Yapin. It ships as one self-contained IIFE
(`apps/client/dist/yapmod-client.js`) that is injected into the live Yapin page (a React app)
and adds themes, plugins, and a settings section to its DOM.

## Commands

Run from the repo root. Requires Node 22+ and pnpm 12.

```bash
pnpm install
pnpm dev          # vite build --watch -> apps/client/dist/yapmod-client.js
pnpm build        # production bundle
pnpm typecheck    # tsc --noEmit across all packages
pnpm lint         # oxlint
pnpm format       # oxfmt (format:check to verify)
pnpm docs         # Astro docs dev server on :4321
```

There are no tests. There is no client dev server: build, then paste the bundle into the
browser console on Yapin (or load it with a script tag) and re-inject after each rebuild.
`YapmodClient.state` should be `ready`; `YapmodClient.dispose()` unloads everything.

## Layout

```text
apps/client/        # composition root; the only layer that knows Yapin's DOM
  src/index.ts      # bootstraps on import, installs features, exposes the global handle
  src/lib/          # modal, toast, url helpers
  src/features/     # settings, themes, plugins
apps/docs/          # Astro + Fumadocs site (React islands; separate from the client)
packages/core/      # createClient(): lifecycle + disposal only
packages/types/     # type-only public contracts
packages/ui/        # Solid components, icons, CSS (inlined into the bundle)
```

Workspace packages export raw `.ts` (`"exports": "./src/index.ts"`); there is no package
build step. Import them by name (`@yapmod/core`, `@yapmod/ui`); use relative paths inside
`apps/client`.

## Runtime model

- `apps/client/src/index.ts` runs `bootstrap()` at import time. The bundle is a side-effect
  IIFE, not a library — importing the entry boots it.
- `createClient()` is the disposal scope. Every feature gets the client and registers
  teardown with `client.onDispose(fn)`. `dispose()` runs all cleanups (each isolated in
  try/catch) and clears `globalThis.YapmodClient`.
- Duplicate injection is a no-op: `bootstrap()` returns the existing frozen handle when
  `globalThis.YapmodClient` is set.
- Features install from `index.ts` (styles, themes, plugins, settings, modals, toasts). Add a
  new feature the same way: an `installX(client)` function plus one cleanup.

## Conventions

- **SolidJS only in `apps/client` and `packages/ui`.** Never import React/Fumadocs there;
  never import Solid into `apps/docs`. Keep `resolve.dedupe: ['solid-js']` in the client
  Vite config.
- Use Solid idioms: `createSignal`/`createMemo`, `For`/`Show`, `class` (not `className`),
  `classList`, kebab-case style keys. Render outside a component tree with `render()` from
  `solid-js/web` (see `lib/modal.tsx`).
- State is module-level signals plus getter functions (`themeState()`, `pluginState()`) and
  actions exported from the same module. Persist to versioned `localStorage` keys
  (`yapmod.themes.v1`, `yapmod.plugins.v1`, `yapmod.plugins.data.v1`). Validate unknown JSON
  with guards and drop malformed records instead of throwing.
- Styling: UI renders in the light DOM and reuses Yapin's classes (`.settings-main`,
  `.ss2-card`, `.hint`, `.toggle-row`, `.input`, `.switch`, `.overlay`, `.modal`). Only Yapmod
  components keep `yp-` classes, styled by `packages/ui/src/styles/base.css`. Prefer host CSS
  variables (`--bg-side`, `--text`, `--accent`) with `--yp-*` fallbacks. CSS is bundled via
  `?inline`; never emit a separate stylesheet.
- Errors: catch locally, log with a `[yapmod]` prefix, and surface user-facing failures with
  `showToast(..., 'error')`. Cleanups must never abort each other. Fire-and-forget async uses
  `void promise`.
- Types: the root `tsconfig.json` is strict (`noUncheckedIndexedAccess`,
  `verbatimModuleSyntax`, `noUnused*`). Use `import type` for type-only imports and handle
  possibly-undefined indexed access.
- Formatting: Oxfmt — 2 spaces, single quotes, semicolons, trailing commas, width 100.
  Lint: `unicorn/prefer-global-this` is an error (use `globalThis`); disable a rule only with
  `// oxlint-disable-next-line <rule> -- <reason>`.
- Naming: lowercase single-word files (`store.ts`, `runtime.ts`, `section.tsx`), PascalCase
  components inside them, and `installX` / `openX` / `createX` for factories.
- Comments explain *why*. Keep the rationale blocks in `settings/install.ts`,
  `themes/apply.ts`, and `plugins/eval.ts`.

## Critical constraints

- **CSP:** no `eval` / `new Function`. Plugins are evaluated through a temporary inline
  `<script>` (`features/plugins/eval.ts`). External stylesheets are blocked, so online themes
  are fetched and inlined into `<style id="yapmod-theme-styles">` (`features/themes/apply.ts`).
  `connect-src` is allowlisted (`raw.githubusercontent.com` is the practical host); failed
  fetches retry after 60s.
- **The host is React and replaces DOM nodes.** The settings integration uses scoped
  `MutationObserver`s and structural CSS/data attributes (`data-yp-section`,
  `data-yp-current`) to keep Yapmod nav and panels attached. Don't replace this with
  framework state — it will go stale.
- **Build target is `es2020`** even though TS targets ES2022. Avoid newer APIs such as
  `Array.prototype.toSorted`.
- Plugin source must be an expression that returns the plugin object (or a function returning
  one), not a statement block.
- Theme identity is the uploaded filename: the same name replaces the theme and keeps its
  enabled state; renaming creates a second theme. Deleting a plugin intentionally keeps its
  per-plugin storage.
- The version shown in the UI comes from `apps/client/package.json`; bump it there.

## Reference

Design details live in the docs app: `apps/docs/content/docs/architecture.mdx` (lifecycle,
settings integration, CSP decisions), `development.mdx` (commands), `overview.mdx`, and
`guide/{installing,themes,plugins}.mdx`.
