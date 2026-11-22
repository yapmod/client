# Yapmod

Yapmod adds themes, plugins, and settings to Yapin. The client builds into one
self-contained IIFE at `apps/client/dist/yapmod-client.js`, injected into Yapin's React page.

## Commands

Run from the repo root with Node 22+ and pnpm 12.

```bash
pnpm install
pnpm dev                         # watch and rebuild the client bundle
pnpm build                       # production client bundle
pnpm typecheck
pnpm lint
pnpm format                      # format:check to verify
pnpm --filter @yapmod/client demo # UI demo on :5199
pnpm docs                        # docs on :3000
```

The client has no dev server. Inject the bundle into Yapin to try it;
`YapmodClient.state` should be `ready`. Call `YapmodClient.dispose()` before re-injecting
an updated bundle; duplicate injection otherwise does nothing.

## Layout

- `apps/client`: bootstrap, features, and Yapin DOM integration; SolidJS.
- `apps/docs`: documentation site; React and Fumadocs.
- `packages/core`: client lifecycle and disposal.
- `packages/types`: public type contracts.
- `packages/ui`: shared Solid components, icons, and inline CSS.
- `packages/builder`: plugin build CLI and hot-reload control page.

Client workspace dependencies expose TypeScript source. Import them by package name
(`@yapmod/core`, `@yapmod/ui`); use relative imports within the client.

## Implementation notes

- Install features from `apps/client/src/index.ts` with `installX(client)` and register
  teardown through `client.onDispose()`. Cleanups must remain independent if one fails.
- Keep Solid in the client/UI and React in docs. Preserve Vite's `solid-js` deduplication.
- Use `@yapmod/ui` form controls (file inputs excepted). Reuse host styles and CSS variables
  with `--yp-*` fallbacks; bundle CSS through `?inline`.
- State uses module-level Solid signals. Validate persisted JSON and use versioned
  localStorage keys. Theme filenames define identity; deleting a plugin keeps its storage.
- Log errors with `[yapmod]` and show user-facing failures with `showToast(..., 'error')`.
- TypeScript is strict; use type-only imports where appropriate. Oxfmt and Oxlint define
  formatting and lint rules; use `globalThis`.
- The bundle targets ES2020. Avoid newer runtime APIs such as `Array.prototype.toSorted`.
- Yapin's CSP blocks `eval`, `new Function`, and external stylesheets. Plugins run through
  temporary inline scripts; fetched theme CSS is inlined. Plugin source must be an
  expression returning a plugin object or a function that returns one.
- Network access is allowlisted. Hot reload uses `postMessage` from loopback origins,
  accepted only when developer features are enabled.
- React replaces host DOM nodes. Settings integration relies on scoped MutationObservers
  and `data-yp-*` attributes; framework state alone cannot track those replacements.
- The displayed client version comes from `apps/client/package.json`.

Further documentation lives in `apps/docs/content/docs/`.

## Release notes

Write user-facing notes in the same PR as each product source change, under
`## [Unreleased]` in the root `CHANGELOG.md` for client/core/UI changes,
`packages/builder/CHANGELOG.md` for builder changes, and both the root and
`packages/types/CHANGELOG.md` for SDK changes. Use `### Added`, `### Changed`,
`### Fixed`, or `### Removed` with concise bullets explaining the user impact.
Use inline links. Docs, tests, and tooling-only changes do not require release notes.
Keep Conventional Commit PR titles for version selection. Do not bump versions or
move Unreleased entries yourself: the rolling release PR handles that. Edit notes
through ordinary PRs against main; direct edits to the release branch are replaced
when it refreshes. See the releases guide for the publishing and retry process.
