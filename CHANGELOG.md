# Changelog

Version headings follow the Yapmod client releases. SDK package versions are identified separately. Dates use Europe/Paris time.

## [Unreleased]

## [1.4.0] — 2026-11-22

### Added

- Plugin authors can use shared `Tabs`, `Badge`, and `IconButton` components to match Yapin’s controls, including keyboard navigation for tabs. [#117](https://github.com/yapmod/client/pull/117)
- Published client, builder, and types releases are announced on Yapin with release notes, a GitHub release link, and a mention of the Yapmod role. [#118](https://github.com/yapmod/client/pull/118)

### Changed

- Collection and plugin cards have a more compact layout with clearer actions. Plugin version, pinning, and restore controls are grouped together, and source tabs support keyboard navigation. [#112](https://github.com/yapmod/client/pull/112), [#117](https://github.com/yapmod/client/pull/117)
- Release notes are now written in feature PRs and carried unchanged into the rolling release PR, GitHub releases, and Yapin announcements.

### Fixed

- Plugin cards stay stable while filtering, and update or restore actions cannot overlap. [#112](https://github.com/yapmod/client/pull/112)

## [1.3.0] — 2026-11-21

### Added

- Organize plugins into collections, restore a previous plugin version after an update, and pin plugins to keep a chosen version.
- Plugins can register local slash commands with native suggestions and custom icons.
- Plugin APIs now expose app navigation, composer text insertion and draft context, call controls, loaded message snapshots, and typed UI extension locations. These declarations shipped in `@yapmod/types@1.4.0`.

## [1.2.0] — 2026-11-21

### Added

- `composer.registerBlock(render)` mounts a reactive SolidJS view beneath each composer. Each draft has its own length and limit, and existing `registerStatus` plugins remain compatible. [#87](https://github.com/yapmod/client/pull/87)
- `composer.registerTool(tool)` adds a labeled icon button to the composer toolbar. Tools move into a picker on narrow layouts and receive the state of the composer that opened them. [#88](https://github.com/yapmod/client/pull/88)
- `contextMenus.registerAction('message', action)` adds actions to a message’s right-click and **More** menus. Selecting an action passes the message ID, and stale selections are ignored. [#89](https://github.com/yapmod/client/pull/89)
- The new composer and context-menu declarations shipped in `@yapmod/types@1.3.0`.

## [1.1.0] — 2026-11-21

### Added

- `composer.registerStatus(format)` lets plugins display text indicators using the draft length and native character limit. The declarations shipped in `@yapmod/types@1.2.0`. [#81](https://github.com/yapmod/client/pull/81)
- The website now includes a first-run guide, a themed client preview, desktop and browser extension downloads, and release notes. The README covers browser setup and local development. [#73](https://github.com/yapmod/client/pull/73), [#75](https://github.com/yapmod/client/pull/75), [#77](https://github.com/yapmod/client/pull/77)
- The plugin authoring guides explain how to build a multi-plugin catalog, publish it with GitHub Actions, and import a plugin by URL. [#79](https://github.com/yapmod/client/pull/79)

### Fixed

- Failed saves preserve the plugin editor draft and running plugin. Failed setup and hot reload clean up the rejected instance and keep the working plugin and its UI available. [#69](https://github.com/yapmod/client/pull/69), [#70](https://github.com/yapmod/client/pull/70), [#71](https://github.com/yapmod/client/pull/71)
- `YapmodClient.ui.injectCss` applies styles and removes them when the client is disposed. [#68](https://github.com/yapmod/client/pull/68)
- Downloadable bundles now report the version of their release tag. [#83](https://github.com/yapmod/client/pull/83)

## [1.0.0] — 2026-11-19

### Changed

- After an initial types-only publication of `@yapmod/ui`, its component declarations moved into `@yapmod/types/plugin-env`. Authors can import UI components with only `@yapmod/types@1.1.0` installed. The workspace UI implementation uses the same prop contracts. [#55](https://github.com/yapmod/client/pull/55), [#58](https://github.com/yapmod/client/pull/58)

### Fixed

- Restored client builds by resolving the workspace UI source. [#58](https://github.com/yapmod/client/pull/58)
- Release jobs skip local commit hooks, publish SDK types through their configured npm Trusted Publisher, and generate scoped notes and tags for exact-version client releases. [#59](https://github.com/yapmod/client/pull/59), [#60](https://github.com/yapmod/client/pull/60), [#61](https://github.com/yapmod/client/pull/61)

## [1.0.0-nightly] — 2026-11-15

### Added

- Published the SDK declarations as `@yapmod/types` with plugin and client environment entry points, shared UI typings, and type contract checks. The development guides cover the public types, typed storage, and UI imports. [#39](https://github.com/yapmod/client/pull/39), [#40](https://github.com/yapmod/client/pull/40), [#46](https://github.com/yapmod/client/pull/46), [#48](https://github.com/yapmod/client/pull/48)

### Changed

- Moved client and npm releases to manually triggered changelogen workflows, with support for exact versions and nightly builds. [#50](https://github.com/yapmod/client/pull/50), [#51](https://github.com/yapmod/client/pull/51), [#52](https://github.com/yapmod/client/pull/52), [#53](https://github.com/yapmod/client/pull/53)

### Fixed

- Plugin storage updates are reactive in SolidJS without a wrapping `createMemo()`. [#38](https://github.com/yapmod/client/pull/38)
- npm publishing uses OIDC trusted publishing and clears the conflicting token environment variable. [#42](https://github.com/yapmod/client/pull/42), [#43](https://github.com/yapmod/client/pull/43)

The earlier semantic-release changelog recorded pipeline fixes under [1.0.1](https://github.com/yapmod/client/commit/cc419cb), the storage fix under [1.0.2](https://github.com/yapmod/client/commit/7c9082c), and the npm authentication fix under [1.0.3](https://github.com/yapmod/client/commit/9304bdf). All three entries predate the nightly client release.

[1.1.0]: https://github.com/yapmod/client/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yapmod/client/compare/v1.0.0-nightly...v1.0.0
[1.0.0-nightly]: https://github.com/yapmod/client/releases/tag/v1.0.0-nightly
