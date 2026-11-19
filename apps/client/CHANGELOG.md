# Changelog

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
