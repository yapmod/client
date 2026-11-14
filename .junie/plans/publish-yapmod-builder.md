---
sessionId: session-261113-215234-1bzp
---

# Requirements

### Overview
Publish `@yapmod/builder`, `@yapmod/types`, and `@yapmod/ui` as three independent npm packages so plugin authors can install and use them to build Yapmod plugins with full TypeScript support and SolidJS UI components.

### Scope

**In Scope:**
- Add esbuild-based build scripts to `@yapmod/ui`, `@yapmod/types`, and `@yapmod/builder`
- Configure proper `exports` fields with `.js` and `.d.ts` entries for npm consumers
- Set `"private": false` and add npm metadata (description, repository, license)
- Exclude dev-only files (examples, tsconfig, source maps config) from published packages via `files` field
- Handle `@yapmod/ui` CSS bundling (`base.css?inline` is a Vite-specific import that won't work in a published package)
- Handle `@yapmod/builder`'s `global.d.ts` conditional export for the ambient `yapmod` declaration

**Out of Scope:**
- Publishing `@yapmod/core` (internal runtime, not needed by plugin authors)
- Publishing `@yapmod/client` (the injected bundle itself)
- CI/CD pipelines or automated publishing workflows
- Documentation site changes (existing docs already reference `@yapmod/builder`)

### User Stories
- As a plugin author, I want to `npm install @yapmod/builder` so I can build my plugin with `buildPlugin()`
- As a plugin author, I want to `npm install @yapmod/types` so I get TypeScript types for the plugin API
- As a plugin author, I want to `npm install @yapmod/ui` so I can use Button, Panel, Hint, and Icon components in my plugin
- As a plugin author, I want to import `@yapmod/builder/global` so the ambient `yapmod` global is typed in my project

### Functional Requirements
- `buildPlugin()` from `@yapmod/builder` works identically after publishing as it does in the workspace
- The unplugin (`yapmodPlugin`) works with Vite, Rollup, Webpack, and Rspack
- `@yapmod/ui` components render correctly when used by plugin authors who bundle with their own tooling
- `@yapmod/types` provides all type exports needed for plugin development
- Packages work with Node 22+ (matching the project's requirement)


# Technical Design

### Current Implementation

All three packages currently:
- Export raw `.ts` files via `"exports": "./src/index.ts"` (workspace-only pattern)
- Are marked `"private": true` (not publishable to npm)
- Have no build step — consumers resolve `.ts` directly through TypeScript
- Use `workspace:*` dependencies to reference sibling packages

**`@yapmod/ui`** — SolidJS components (Button, Hint, Panel, Icon), icon paths, CSS injection utilities, and `mountIsolated` for shadow DOM rendering. The CSS is imported via Vite's `?inline` syntax (`base.css?inline`), which embeds the CSS as a string at build time.

**`@yapmod/types`** — Pure type exports: `YapmodPluginApi`, `PluginManifest`, `PluginUi`, `SharedSolid`, and client types. Depends on `@yapmod/ui` for component prop types (`ButtonProps`, `HintProps`, etc.).

**`@yapmod/builder`** — Plugin build tooling: `buildPlugin()` (esbuild-based), `transformPluginSource()` (Babel-based TSX compilation + Solid import rewriting), `yapmodPlugin` (unplugin for bundler integration), and expression wrapper constants. Has an `examples/` directory with a working sample plugin and verification tests.

### Key Decisions

1. **esbuild for all three packages** — fast, produces clean ESM output, already a dependency of `@yapmod/builder`. Each package gets its own `build` script.

2. **ESM-only output** — all packages use `"type": "module"`. No CJS interop needed since the target audience (plugin authors) uses modern tooling.

3. **CSS inlining for `@yapmod/ui`** — the `?inline` Vite import must be replaced with a build step that reads `base.css` and embeds it as a string constant in the compiled output.

4. **`files` field to control published contents** — only `dist/`, `global.d.ts` (builder), and `package.json` are published. Source files, examples, and configs stay private.

5. **`workspace:*` replaced with version ranges** — inter-package dependencies use `"^1.0.0"` so npm resolves them from the registry instead of the workspace.

### Proposed Changes

#### `@yapmod/ui` (`packages/ui/`)
- Add `build` script: esbuild compiles `src/index.ts` → `dist/index.js` with `--bundle --format=esm --platform=browser`
- Replace `base.css?inline` import: the build script reads `src/styles/base.css` and injects its content as the `uiCss` export instead of relying on Vite's `?inline`
- Add `tsconfig.json` for declaration emission (`tsc --emitDeclarationOnly`) → `dist/index.d.ts`
- Update `package.json`: set `"private": false`, add `files`, update `exports` to point to `dist/index.js` and `dist/index.d.ts`
- Add npm metadata: `description`, `repository`, `license`, `keywords`

#### `@yapmod/types` (`packages/types/`)
- Add `build` script: `tsc --emitDeclarationOnly` (types-only package, no JS needed — but esbuild can emit an empty ESM entry)
- Since it's purely types, use esbuild to produce a minimal `dist/index.js` that re-exports nothing, and `tsc` for `dist/index.d.ts`
- Update dependency on `@yapmod/ui` from `workspace:*` to `^1.0.0`
- Update `package.json`: set `"private": false`, add `files`, update `exports`
- Add npm metadata

#### `@yapmod/builder` (`packages/builder/`)
- Add `build` script: esbuild bundles `src/index.ts` → `dist/index.js` with all dependencies except `peerDependencies` (solid-js, esbuild, @babel/core, unplugin)
- Emit declarations: `tsc --emitDeclarationOnly` → `dist/index.d.ts`
- Copy `global.d.ts` to `dist/global.d.ts`
- Update `exports` to:
  ```json
  {
    ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" },
    "./global": { "types": "./dist/global.d.ts" }
  }
  ```
- Update dependency on `@yapmod/types` from `workspace:*` to `^1.0.0`
- Move `solid-js`, `esbuild`, `@babel/core`, `unplugin`, `babel-preset-solid`, `@babel/preset-typescript` to `peerDependencies` (plugin authors already install their own bundlers)
- Set `"private": false`, add `files` (excludes `examples/`)
- Add npm metadata

### File Structure

After building, each package publishes:

```
@yapmod/ui/
  dist/
    index.js
    index.d.ts
  package.json

@yapmod/types/
  dist/
    index.js
    index.d.ts
  package.json

@yapmod/builder/
  dist/
    index.js
    index.d.ts
    global.d.ts
  package.json
```

### Architecture Diagram

``` mermaid
graph LR
  A[@yapmod/ui] -->|ButtonProps etc.| B[@yapmod/types]
  B -->|YapmodPluginApi| C[@yapmod/builder]
  C -->|peerDep| D[esbuild]
  C -->|peerDep| E[@babel/core]
  C -->|peerDep| F[unplugin]
  C -->|peerDep| G[solid-js]
```

### Risks
- **CSS `?inline` removal**: The `@yapmod/ui` build must correctly inline `base.css` content. If the CSS reference breaks, components render without styles. Mitigation: verify the built `uiCss` string matches the original CSS.
- **Peer dependency version conflicts**: Plugin authors may have different versions of esbuild or Babel. Mitigation: use broad peer dependency ranges (`>=0.17` for esbuild, `>=7` for @babel/core).
- **Type declaration accuracy**: `tsc --emitDeclarationOnly` must resolve `@yapmod/ui` types from `node_modules`, not the workspace. Mitigation: build in order (ui → types → builder) and test with a clean install.


# Delivery Steps

###   Step 1: Add build infrastructure to @yapmod/ui
Compile @yapmod/ui into a publishable ESM package with inlined CSS.
- Create `packages/ui/build.mjs`: esbuild bundles `src/index.ts` → `dist/index.js`, reading `src/styles/base.css` and injecting its content as the `uiCss` export (replacing the Vite `?inline` import).
- Add `tsc --emitDeclarationOnly` step to emit `dist/index.d.ts` with a dedicated `tsconfig.build.json`.
- Update `package.json`: set `"private": false`, add `files: ["dist"]`, update `exports` to `{ ".": { "import": "./dist/index.js", "types": "./dist/index.d.ts" } }`, add npm metadata (description, repository, license, keywords).
- Add `solid-js` as a `peerDependency` instead of a regular dependency.
- Verify: `node build.mjs` produces `dist/index.js` and `dist/index.d.ts`; the `uiCss` export contains the CSS string.

###   Step 2: Add build infrastructure to @yapmod/types
Compile @yapmod/types into a publishable package with type declarations.
- Create `packages/types/build.mjs`: esbuild produces a minimal `dist/index.js` (re-exports nothing since it's types-only), and `tsc --emitDeclarationOnly` emits `dist/index.d.ts`.
- Update dependency on `@yapmod/ui` from `workspace:*` to `"^1.0.0"`.
- Update `package.json`: set `"private": false`, add `files: ["dist"]`, update `exports`, add npm metadata.
- Add `solid-js` and `@yapmod/ui` as `peerDependencies`.
- Verify: `dist/index.d.ts` exports all types including `YapmodPluginApi`, `PluginManifest`, etc.

###   Step 3: Add build infrastructure to @yapmod/builder
Compile @yapmod/builder into a publishable package with bundled dependencies and type declarations.
- Create `packages/builder/build.mjs`: esbuild bundles `src/index.ts` → `dist/index.js`, externalizing peer dependencies (solid-js, esbuild, @babel/core, unplugin, babel-preset-solid, @babel/preset-typescript). `tsc --emitDeclarationOnly` emits `dist/index.d.ts`. Copy `global.d.ts` → `dist/global.d.ts`.
- Update dependency on `@yapmod/types` from `workspace:*` to `"^1.0.0"`.
- Move `solid-js`, `esbuild`, `@babel/core`, `@babel/preset-typescript`, `babel-preset-solid`, `unplugin` to `peerDependencies` with broad version ranges.
- Update `package.json`: set `"private": false`, add `files: ["dist"]`, update `exports` with both `"."` and `"./global"` entries, add npm metadata.
- Verify: `dist/index.js` loads without errors; `dist/global.d.ts` declares the ambient `yapmod` global.

###   Step 4: Wire root workspace scripts and verify end-to-end
Add workspace-level build and publish scripts, and verify the full pipeline works.
- Add to root `package.json`: `"build:packages"` script that runs `pnpm --filter @yapmod/ui build && pnpm --filter @yapmod/types build && pnpm --filter @yapmod/builder build` (in dependency order).
- Add `"prepublishOnly"` hook to ensure packages are built before publishing.
- Run the builder's existing example (`pnpm --filter @yapmod/builder example`) to verify the built package produces the same output as the workspace version.
- Verify `pnpm typecheck` still passes across all packages with the new build artifacts.
- Verify the `files` field correctly excludes `examples/`, `src/`, and build configs from each package's published contents.