# Changelog

## [1.3.0](https://github.com/yapmod/client/compare/v1.2.0...v1.3.0) (2026-11-21)


### Features

* add collections to the plugin manager ([#102](https://github.com/yapmod/client/issues/102)) ([39e4e5a](https://github.com/yapmod/client/commit/39e4e5ab81ba1aa33d7106fed286e910599798f2))
* add typed plugin UI extension locations ([#110](https://github.com/yapmod/client/issues/110)) ([a3bcb03](https://github.com/yapmod/client/commit/a3bcb034827f2ed89c323910a13f57cf038fff8f))
* expose app context and native navigation to plugins ([#107](https://github.com/yapmod/client/issues/107)) ([8728e3f](https://github.com/yapmod/client/commit/8728e3f24781dc185087fa26bffb1dd9622a6c81))
* expose captured composer draft and conversation context ([#108](https://github.com/yapmod/client/issues/108)) ([a565476](https://github.com/yapmod/client/commit/a565476aa20e771f16ecf91d79269c107012a20d))
* expose current call controls to plugins ([#106](https://github.com/yapmod/client/issues/106)) ([93ee27a](https://github.com/yapmod/client/commit/93ee27a66b258976042aa0b32d863e1bb607a326))
* expose typed loaded message snapshots to plugins ([#109](https://github.com/yapmod/client/issues/109)) ([4f90e21](https://github.com/yapmod/client/commit/4f90e21862527ed77ff399690f97fa1159c8e56f))
* **plugins:** add local slash command API ([878d503](https://github.com/yapmod/client/commit/878d5036c6785203cf3a4289a1c9ddf952033be2))
* **plugins:** add local slash command API ([f6bf3db](https://github.com/yapmod/client/commit/f6bf3dbf96468d2479ff16218a158814f075c0d8)), closes [#98](https://github.com/yapmod/client/issues/98)
* **plugins:** make updates transactional with restore and pinning ([#104](https://github.com/yapmod/client/issues/104)) ([0801d6e](https://github.com/yapmod/client/commit/0801d6e3130e4deb3e3d6b801bc62dd62f809c59))
* **plugins:** support registered custom icons ([#101](https://github.com/yapmod/client/issues/101)) ([8b8c0f5](https://github.com/yapmod/client/commit/8b8c0f5ded9ccfb64ef3e4e1231f5af5de678460))
* **sdk:** expose composer text insertion ([#105](https://github.com/yapmod/client/issues/105)) ([2244548](https://github.com/yapmod/client/commit/2244548f6e4ad10f4d4e61ee9b4f224073d30c0a))

## [Unreleased]

### Added

- Plugins can register local slash commands with native suggestions, guarded submission and automatic cleanup (#98).

## [1.2.0](https://github.com/yapmod/client/compare/v1.1.0...v1.2.0) (2026-11-21)


### Features

* **sdk:** register icon buttons in the composer toolbar ([9955b2c](https://github.com/yapmod/client/commit/9955b2c07e14c796c5776b8babfe33241ab385e7))
* **sdk:** register icon buttons in the composer toolbar ([9e07758](https://github.com/yapmod/client/commit/9e0775868b703f3ee9b1e92d4cf53a966081a7f2)), closes [#85](https://github.com/yapmod/client/issues/85)
* **sdk:** register plugin actions in message context menus ([b3b77d2](https://github.com/yapmod/client/commit/b3b77d2ca0e70d487f71c330fb3624090128ee92))
* **sdk:** register plugin actions in message context menus ([1fb9cd9](https://github.com/yapmod/client/commit/1fb9cd9fbbec73bb435f2d43ee0b720f0643457b)), closes [#86](https://github.com/yapmod/client/issues/86)
* **sdk:** render reactive blocks in each composer ([217d77c](https://github.com/yapmod/client/commit/217d77c610a784366d1ae312ff7935677978f113))
* **sdk:** render reactive blocks in each composer ([c36b497](https://github.com/yapmod/client/commit/c36b49701e83628ab479f167ec9a206ff9d18aba)), closes [#84](https://github.com/yapmod/client/issues/84)

## v1.1.0

[compare changes](https://github.com/yapmod/client/compare/v1.0.0...v1.1.0)

### 🚀 Enhancements

- **web:** Introduce the Yapmod client on the homepage ([#73](https://github.com/yapmod/client/pull/73))
- **web:** Add desktop and extension downloads with release notes ([#77](https://github.com/yapmod/client/pull/77))
- **sdk:** Add composer status registration ([be2f10c](https://github.com/yapmod/client/commit/be2f10c))

### 🩹 Fixes

- **plugins:** Dispose resources after setup fails ([#71](https://github.com/yapmod/client/pull/71))
- **dev:** Preserve the last working plugin on hot reload ([#70](https://github.com/yapmod/client/pull/70))
- **plugins:** Report plugin save failures in the editor ([#69](https://github.com/yapmod/client/pull/69))
- **client:** Implement stylesheet injection on the public handle ([#68](https://github.com/yapmod/client/pull/68))
- **release:** Build the client after its version bump ([a4bb4b7](https://github.com/yapmod/client/commit/a4bb4b7))

### 📖 Documentation

- **blog:** Announce Yapmod v1.0.0 ([#63](https://github.com/yapmod/client/pull/63))
- **blog:** Remove v1.0.0 announcement ([98a00d1](https://github.com/yapmod/client/commit/98a00d1))
- **client:** Adapt the desktop README for the web client ([#75](https://github.com/yapmod/client/pull/75))
- Center the homepage and refresh the Yapmod release story ([6fa9b75](https://github.com/yapmod/client/commit/6fa9b75))
- **plugins:** Document starter catalog publishing ([#79](https://github.com/yapmod/client/pull/79))
- **sdk:** Document composer status formatters ([220f3fd](https://github.com/yapmod/client/commit/220f3fd))

### 🏡 Chore

- **types:** Bump version for npm publish [skip ci] ([47723ce](https://github.com/yapmod/client/commit/47723ce))

### ❤️ Contributors

- GitHub Actions ([@Github-Action-Bot](http://github.com/Github-Action-Bot))
- Hdzilyes ([@ilyeshdz](http://github.com/ilyeshdz))
- Ilyes Hernandez ([@ilyeshdz](http://github.com/ilyeshdz))

## v1.0.0

[compare changes](https://github.com/yapmod/client/compare/v1.0.0-nightly...v1.0.0)

### 🚀 Enhancements

- **ui:** Publish @yapmod/ui as types-only npm package for plugin author IDE support ([#55](https://github.com/yapmod/client/pull/55))

### 🩹 Fixes

- **ui:** Resolve @yapmod/ui to workspace source ([#58](https://github.com/yapmod/client/pull/58))
- **ci:** Skip husky hooks in publish commits ([#59](https://github.com/yapmod/client/pull/59))
- **ci:** Publish @yapmod/types from its trusted workflow ([#60](https://github.com/yapmod/client/pull/60))
- **ci:** Release exact versions with changelogen ([#61](https://github.com/yapmod/client/pull/61))

### 📖 Documentation

- Update starter repo page with correct code examples ([2f8452f](https://github.com/yapmod/client/commit/2f8452f))

### 🏡 Chore

- **ci:** Add @yapmod/ui to npm publish workflow ([#56](https://github.com/yapmod/client/pull/56))
- **ui:** Bump version for npm publish [skip ci] ([5d77f42](https://github.com/yapmod/client/commit/5d77f42))
- **types:** Bump version for npm publish [skip ci] ([9fce067](https://github.com/yapmod/client/commit/9fce067))

### ❤️ Contributors

- Ilyes Hernandez ([@ilyeshdz](http://github.com/ilyeshdz))
- GitHub Actions ([@Github-Action-Bot](http://github.com/Github-Action-Bot))
- Hdzilyes ([@ilyeshdz](http://github.com/ilyeshdz))

## v1.0.1

[compare changes](https://github.com/yapmod/client/compare/v0.0.0...v1.0.1)

### 🩹 Fixes

- **storage:** Make proxy properties reactive in SolidJS without createMemo ([#38](https://github.com/yapmod/client/pull/38))
- **ci:** Remove NODE_AUTH_TOKEN interference for npm OIDC Trusted Publisher ([#43](https://github.com/yapmod/client/pull/43))
- **client:** Use correct changelogen prerelease flags for version bumps ([#51](https://github.com/yapmod/client/pull/51))
- **client:** Support exact versions and nightly prerelease type ([#52](https://github.com/yapmod/client/pull/52))

### 💅 Refactors

- **types:** Make @yapmod/types a published types-only package ([#39](https://github.com/yapmod/client/pull/39))
- **types:** Establish single source of truth for type safety ([#48](https://github.com/yapmod/client/pull/48))

### 📖 Documentation

- **types:** Expand type safety documentation with all 27 exportable types ([#46](https://github.com/yapmod/client/pull/46))

### 🏡 Chore

- **release:** 1.0.2 [skip ci] ([7c9082c](https://github.com/yapmod/client/commit/7c9082c))
- **types:** Add build config and prepare @yapmod/types for npm publish ([#40](https://github.com/yapmod/client/pull/40))
- **release:** 1.0.3 [skip ci] ([9304bdf](https://github.com/yapmod/client/commit/9304bdf))
- **types:** Publish @yapmod/types@1.0.2 via Trusted Publisher ([#44](https://github.com/yapmod/client/pull/44))
- **client:** Migrate release process from semantic-release to changelogen ([#50](https://github.com/yapmod/client/pull/50))
- **release:** V1.2.1-1.0.0.0 ([2df6a33](https://github.com/yapmod/client/commit/2df6a33))
- **release:** V1.2.2-0 ([c8d4d0a](https://github.com/yapmod/client/commit/c8d4d0a))
- **release:** V1.2.2-1.0.0.0 ([2622690](https://github.com/yapmod/client/commit/2622690))

### 🤖 CI

- Use npm Trusted Publisher (OIDC) instead of NPM_TOKEN ([#42](https://github.com/yapmod/client/pull/42))

### ❤️ Contributors

- Ilyes Hernandez ([@ilyeshdz](http://github.com/ilyeshdz))
- GitHub Actions ([@Github-Action-Bot](http://github.com/Github-Action-Bot))
- Semantic-release-bot <semantic-release-bot@martynus.net>

[Unreleased]: https://github.com/yapmod/client/compare/v1.2.0...HEAD
