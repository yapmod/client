# Changelog

## [1.4.0](https://github.com/yapmod/client/compare/types-v1.3.0...types-v1.4.0) (2026-11-21)


### Features

* **plugins:** add local slash command API ([878d503](https://github.com/yapmod/client/commit/878d5036c6785203cf3a4289a1c9ddf952033be2))
* **plugins:** add local slash command API ([f6bf3db](https://github.com/yapmod/client/commit/f6bf3dbf96468d2479ff16218a158814f075c0d8)), closes [#98](https://github.com/yapmod/client/issues/98)
* **plugins:** support registered custom icons ([#101](https://github.com/yapmod/client/issues/101)) ([8b8c0f5](https://github.com/yapmod/client/commit/8b8c0f5ded9ccfb64ef3e4e1231f5af5de678460))
* **sdk:** expose composer text insertion ([#105](https://github.com/yapmod/client/issues/105)) ([2244548](https://github.com/yapmod/client/commit/2244548f6e4ad10f4d4e61ee9b4f224073d30c0a))

## [Unreleased]

### Added

- Export `PluginCommand`, `PluginCommands` and `CommandContext` for the `yapmod.commands.register` API (#98).

## [1.3.0](https://github.com/yapmod/client/compare/types-v1.2.0...types-v1.3.0) (2026-11-21)


### Features

* **sdk:** register icon buttons in the composer toolbar ([9955b2c](https://github.com/yapmod/client/commit/9955b2c07e14c796c5776b8babfe33241ab385e7))
* **sdk:** register icon buttons in the composer toolbar ([9e07758](https://github.com/yapmod/client/commit/9e0775868b703f3ee9b1e92d4cf53a966081a7f2)), closes [#85](https://github.com/yapmod/client/issues/85)
* **sdk:** register plugin actions in message context menus ([b3b77d2](https://github.com/yapmod/client/commit/b3b77d2ca0e70d487f71c330fb3624090128ee92))
* **sdk:** register plugin actions in message context menus ([1fb9cd9](https://github.com/yapmod/client/commit/1fb9cd9fbbec73bb435f2d43ee0b720f0643457b)), closes [#86](https://github.com/yapmod/client/issues/86)
* **sdk:** render reactive blocks in each composer ([217d77c](https://github.com/yapmod/client/commit/217d77c610a784366d1ae312ff7935677978f113))
* **sdk:** render reactive blocks in each composer ([c36b497](https://github.com/yapmod/client/commit/c36b49701e83628ab479f167ec9a206ff9d18aba)), closes [#84](https://github.com/yapmod/client/issues/84)

## v1.1.0

[compare changes](https://github.com/yapmod/client/compare/v1.0.0-nightly...v1.1.0)

### 🚀 Enhancements

- **ui:** Publish @yapmod/ui as types-only npm package for plugin author IDE support ([#55](https://github.com/yapmod/client/pull/55))

### 🩹 Fixes

- **ui:** Resolve @yapmod/ui to workspace source ([#58](https://github.com/yapmod/client/pull/58))
- **ci:** Skip husky hooks in publish commits ([#59](https://github.com/yapmod/client/pull/59))

### 📖 Documentation

- Update starter repo page with correct code examples ([2f8452f](https://github.com/yapmod/client/commit/2f8452f))

### 🏡 Chore

- **ci:** Add @yapmod/ui to npm publish workflow ([#56](https://github.com/yapmod/client/pull/56))
- **ui:** Bump version for npm publish [skip ci] ([5d77f42](https://github.com/yapmod/client/commit/5d77f42))

### ❤️ Contributors

- Ilyes Hernandez ([@ilyeshdz](http://github.com/ilyeshdz))
- GitHub Actions ([@Github-Action-Bot](http://github.com/Github-Action-Bot))
- Hdzilyes ([@ilyeshdz](http://github.com/ilyeshdz))

[Unreleased]: https://github.com/yapmod/client/compare/types-v1.3.0...HEAD
