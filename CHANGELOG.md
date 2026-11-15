## [1.0.3](https://github.com/yapmod/client/compare/v1.0.2...v1.0.3) (2026-11-15)

### Bug Fixes

- **ci:** remove NODE_AUTH_TOKEN interference for npm OIDC Trusted Publisher ([#43](https://github.com/yapmod/client/issues/43)) ([a75ad82](https://github.com/yapmod/client/commit/a75ad821d23b92534291985bbe4bcb370554081a))

## [1.0.2](https://github.com/yapmod/client/compare/v1.0.1...v1.0.2) (2026-11-15)

### Bug Fixes

- **storage:** make proxy properties reactive in SolidJS without createMemo ([#38](https://github.com/yapmod/client/issues/38)) ([938318d](https://github.com/yapmod/client/commit/938318dfb5f9b6941c2a5f0c56527321b39dd76a)), closes [#37](https://github.com/yapmod/client/issues/37)

## [Unreleased]

### Added

- **types:** publish @yapmod/types as a types-only npm package with build config and yapmod.d.ts global declaration (#39)
- **docs:** expand type safety documentation with all 27 exportable types from @yapmod/types, including usage examples, builder import rewriting explanation, and typed storage patterns (#45)
- **docs:** add type safety callouts to fundamentals, how-plugins-work, plugin-api, ui-components, starter-repo, and building documentation pages (#45)

### Changed

- **ci:** use npm Trusted Publisher (OIDC) instead of NPM_TOKEN for all npm publish workflows

### Fixed

- **storage:** make proxy properties reactive in SolidJS without requiring `createMemo()` (#37)

## [1.0.1](https://github.com/yapmod/client/compare/v1.0.0...v1.0.1) (2026-11-15)

### Bug Fixes

- **ci:** add conventional-changelog-conventionalcommits dependency ([#32](https://github.com/yapmod/client/issues/32)) ([806d0b5](https://github.com/yapmod/client/commit/806d0b5a1a0abdd9ba6769d2742e45ba9b51a921))
- **ci:** disable husky hooks during semantic-release ([#35](https://github.com/yapmod/client/issues/35)) ([829fc6e](https://github.com/yapmod/client/commit/829fc6e774c8654f6dbeb75c55de51561c83445b))
- **ci:** downgrade conventional-changelog-conventionalcommits to v7 ([#33](https://github.com/yapmod/client/issues/33)) ([c631e02](https://github.com/yapmod/client/commit/c631e0256d96a4e450bf75d15dc3b7cba778f0e1))
- **ci:** move semantic-release config to project root ([#31](https://github.com/yapmod/client/issues/31)) ([78a1f14](https://github.com/yapmod/client/commit/78a1f1424aae7745778fc93b464367fd2a89115a))
- **ci:** use conventional-changelog-conventionalcommits v8 ([#34](https://github.com/yapmod/client/issues/34)) ([577ce18](https://github.com/yapmod/client/commit/577ce18e102cb2c82c1f916db620e3eb2d3ed036))

# Changelog
