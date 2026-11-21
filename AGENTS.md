# AGENTS.md

Yapmod extends the live Yapin React app with themes, plugins, and settings. It ships as
one injected IIFE: `apps/client/dist/yapmod-client.js`.

## Commands

Run from the repo root with Node 22+ and pnpm 12.

```bash
pnpm install
pnpm dev          # watch and rebuild the client bundle
pnpm build        # production bundle
pnpm typecheck
pnpm lint         # oxlint + UI component check
pnpm format       # oxfmt; use format:check to verify
pnpm demo         # component demo on :5199
pnpm docs         # docs dev server on :3000
```

There are no tests or client dev server. Build and inject the bundle into Yapin, then
re-inject after rebuilding. `YapmodClient.state` should be `ready`;
`YapmodClient.dispose()` unloads it.

## Layout

- `apps/client`: bootstrap, host DOM integration, features, and component demo.
- `apps/docs`: Next.js/Fumadocs documentation (React).
- `packages/core`: client lifecycle and disposal.
- `packages/types`: public type contracts.
- `packages/ui`: Solid components, icons, and bundled CSS.

Workspace packages export raw TypeScript; import them by package name (`@yapmod/ui`).
Use relative imports within the client. There is no separate package build step.

## Implementation

- Use SolidJS in the client and UI package, React only in docs. Keep
  `resolve.dedupe: ['solid-js']` in the client Vite config.
- Use `@yapmod/ui` form controls; do not write native inputs, selects, or textareas in
  the client, except file inputs. Follow Solid conventions: signals, `For`/`Show`,
  `class`, `classList`, and kebab-case style keys. Use `solid-js/web`'s `render()`
  outside component trees.
- Install features from `apps/client/src/index.ts` through `installX(client)` and
  register teardown with `client.onDispose()`. Importing the entry boots the client;
  duplicate injection returns the existing frozen handle. Disposal isolates cleanup
  failures and clears `globalThis.YapmodClient`.
- Keep state in module-level signals with exported getters and actions. Persist to
  versioned localStorage keys; validate unknown JSON and drop malformed records.
- Render in the light DOM, reuse host classes, and prefer host CSS variables with
  `--yp-*` fallbacks. Bundle CSS via `?inline`; never emit a separate stylesheet.
- Catch errors locally, log with `[yapmod]`, and show user-facing failures through
  `showToast(..., 'error')`. Cleanups must not abort each other. Use `void promise`
  for fire-and-forget work.
- Respect strict TypeScript: use `import type` and handle possibly undefined indexed
  access. Runtime target is ES2020; avoid newer APIs such as `toSorted`.
- Format with Oxfmt: 2 spaces, single quotes, semicolons, trailing commas, width 100.
  Use `globalThis`. Lint suppressions require a reason:
  `// oxlint-disable-next-line <rule> -- <reason>`.
- Prefer lowercase single-word filenames, PascalCase components, and
  `installX` / `openX` / `createX` factories. Comments explain why; preserve rationale
  blocks in `settings/install.ts`, `themes/apply.ts`, `plugins/eval.ts`, and `dev/bridge.ts`.
- The UI version comes from `apps/client/package.json`; bump it there.

## Host constraints

- CSP forbids `eval` and `new Function`. Evaluate plugins through temporary inline
  scripts (`features/plugins/eval.ts`). Plugin source is an expression returning an
  object or a function returning one, not a statement block.
- External stylesheets are blocked. Fetch themes and inline them in
  `#yapmod-theme-styles`. Fetches must respect the `connect-src` allowlist
  (`raw.githubusercontent.com` is the practical host); failures retry after 60 seconds.
- Hot reload uses `window.postMessage` from the builder's control page, not local
  network fetches. Accept messages only from loopback origins while developer
  features are enabled.
- React replaces host DOM nodes. Keep scoped MutationObservers and structural
  attributes (`data-yp-section`, `data-yp-current`) for settings integration;
  framework state alone becomes stale.
- Theme identity is its uploaded filename. Replacing that filename preserves enabled
  state; renaming creates a separate theme. Deleting a plugin keeps its storage.

## Workflow

- Work on a focused branch; changes to `main` land through pull requests. Never push
  directly or force-push to `main`.
- Use small, logical Conventional Commits. Never add co-author trailers.
- Before pushing, run `pnpm typecheck`, `pnpm lint`, and `pnpm format:check`.
- PR descriptions explain changes and verification. Reference an issue when one
  exists; opening an issue and using workflow skills are not prerequisites.

## Reference

See `apps/docs/content/docs/` for architecture, development instructions, and the
installing, themes, and plugins guides.
