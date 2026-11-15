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
pnpm lint         # oxlint + the UI component check
pnpm format       # oxfmt (format:check to verify)
pnpm demo         # component demo page on :5199
pnpm docs         # Next.js docs dev server on :3000
```

There are no tests. There is no client dev server: build, then paste the bundle into the
browser console on Yapin (or load it with a script tag) and re-inject after each rebuild.
`YapmodClient.state` should be `ready`; `YapmodClient.dispose()` unloads everything.

## Layout

```text
apps/client/        # composition root; the only layer that knows Yapin's DOM
  src/index.ts      # bootstraps on import, installs features, exposes the global handle
  src/lib/          # modal, toast, url helpers
  src/features/     # settings, themes, plugins, dev (hot reload)
  demo/             # Vite demo page for the @yapmod/ui components
apps/docs/          # Next.js + Fumadocs site (React; separate from the client)
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
- **Form controls come from `@yapmod/ui`.** The client must not hand-write `<input>`,
  `<select>` or `<textarea>` elements: use `Switch`, `Input`, `Textarea` and `Select` from
  `@yapmod/ui`, which already reproduce Yapin's own controls. `pnpm lint` fails when a raw
  form control appears in `apps/client/src` (file inputs excepted).
- Use Solid idioms: `createSignal`/`createMemo`, `For`/`Show`, `class` (not `className`),
  `classList`, kebab-case style keys. Render outside a component tree with `render()` from
  `solid-js/web` (see `lib/modal.tsx`).
- State is module-level signals plus getter functions (`themeState()`, `pluginState()`) and
  actions exported from the same module. Persist to versioned `localStorage` keys
  (`yapmod.themes.v1`, `yapmod.plugins.v1`, `yapmod.plugins.data.v1`). Validate unknown JSON
  with guards and drop malformed records instead of throwing.
- Styling: UI renders in the light DOM and reuses Yapin's classes (`.settings-main`,
  `.ss2-card`, `.hint`, `.toggle-row`, `.overlay`, `.modal`). Form controls come from
  `@yapmod/ui`, which carries Yapin's `.input`/`.switch`/`.dd-*` look in its own `yp-`
  classes. Prefer host CSS variables (`--bg-side`, `--text`, `--accent`) with `--yp-*`
  fallbacks. CSS is bundled via `?inline`; never emit a separate stylesheet.
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
- Comments explain _why_. Keep the rationale blocks in `settings/install.ts`,
  `themes/apply.ts`, `plugins/eval.ts`, and `dev/bridge.ts`.

## Critical constraints

- **CSP:** no `eval` / `new Function`. Plugins are evaluated through a temporary inline
  `<script>` (`features/plugins/eval.ts`). External stylesheets are blocked, so online themes
  are fetched and inlined into `<style id="yapmod-theme-styles">` (`features/themes/apply.ts`).
  `connect-src` is allowlisted (`raw.githubusercontent.com` is the practical host); failed
  fetches retry after 60s.
- **Hot reload uses `window.postMessage`, not the network.** The page cannot fetch from a local
  dev server (`connect-src`), so the builder's dev server serves a control page that pushes builds
  into the Yapin window it opened (`features/dev/bridge.ts`). The client only accepts messages
  from loopback origins and only while developer features are on.
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

## Workflow

Work lands through an issue and a pull request; `main` is only changed by merging one.

1. **Open the issue first.** Describe the change with the `idea-to-issue` skill: a
   Conventional Commits title (`feat(ui): …`), the repository's labels, the open milestone
   and an assignee. Implement nothing before the issue exists.
2. **Branch from `origin/main`.** Fetch, then create a branch named after the change
   (`feat/ui-form-components-19`, `fix/plugin-import-42`).
3. **Commit in small, logical steps.** Every message follows
   [Conventional Commits](https://www.conventionalcommits.org/) (`feat: add plugin export`,
   `fix: handle missing theme`, `chore: update deps`) and references the issue
   (`Closes #19`).
4. **Check before pushing.** `pnpm typecheck`, `pnpm lint` and `pnpm format:check` must pass.
5. **Open the pull request** with the `issue-to-pr` skill: the title mirrors the first
   commit, the body lists the changes and the verification, and it ends with `Closes #<issue>`
   so merging closes the issue.

Rules that apply to every commit:

- **Never use co-author trailers.** Do not append `Co-authored-by` or any similar trailer to
  commit messages.
- Do not force-push `main`, and do not push straight to `main`.
- Keep pull requests focused: unrelated work goes into its own issue and branch.

## Reference

Design details live in the docs app: `apps/docs/content/docs/architecture.mdx` (lifecycle,
settings integration, CSP decisions), `development.mdx` (commands), `overview.mdx`, and
`guide/{installing,themes,plugins}.mdx`.
