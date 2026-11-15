# Changelog


## v1.2.2-0


### 🚀 Enhancements

- **plugins:** Add client-registered plugin support ([#1](https://github.com/yapmod/client/pull/1))
- **plugins:** Add plugin API v1 with shared Solid, reactive storage, and builder ([#4](https://github.com/yapmod/client/pull/4))
- **builder:** Reimplement plugin builder as CLI tool with hot reload ([#18](https://github.com/yapmod/client/pull/18))
- **builder:** Export SolidJS transform utilities for external use ([ccaa853](https://github.com/yapmod/client/commit/ccaa853))
- **builder:** Add @yapmod/ui to shared modules for import rewriting ([5b5b35c](https://github.com/yapmod/client/commit/5b5b35c))
- **ui:** Add Switch, Select and Input components matching Yapin ([#20](https://github.com/yapmod/client/pull/20))
- **ui:** Add settings layout DSL components ([#25](https://github.com/yapmod/client/pull/25))
- **settings:** Redesign settings page with DSL components and developer section ([#28](https://github.com/yapmod/client/pull/28))
- **ci:** Replace manual release workflow with semantic-release ([#30](https://github.com/yapmod/client/pull/30))

### 🩹 Fixes

- **ci:** Remove NODE_AUTH_TOKEN interference for trusted publishing ([a576ea4](https://github.com/yapmod/client/commit/a576ea4))
- **ci:** Use Node 24 for npm trusted publishing (npm v11 required for OIDC) ([b4b76c6](https://github.com/yapmod/client/commit/b4b76c6))
- **ci:** Handle unchanged version in npm publish workflow ([8b30f0f](https://github.com/yapmod/client/commit/8b30f0f))
- **ci:** Move semantic-release config to project root ([#31](https://github.com/yapmod/client/pull/31))
- **ci:** Add conventional-changelog-conventionalcommits dependency ([#32](https://github.com/yapmod/client/pull/32))
- **ci:** Downgrade conventional-changelog-conventionalcommits to v7 ([#33](https://github.com/yapmod/client/pull/33))
- **ci:** Use conventional-changelog-conventionalcommits v8 ([#34](https://github.com/yapmod/client/pull/34))
- **ci:** Disable husky hooks during semantic-release ([#35](https://github.com/yapmod/client/pull/35))
- **storage:** Make proxy properties reactive in SolidJS without createMemo ([#38](https://github.com/yapmod/client/pull/38))
- **ci:** Remove NODE_AUTH_TOKEN interference for npm OIDC Trusted Publisher ([#43](https://github.com/yapmod/client/pull/43))
- **client:** Use correct changelogen prerelease flags for version bumps ([#51](https://github.com/yapmod/client/pull/51))

### 💅 Refactors

- **docs:** Migrate docs site from Astro to Next.js with Fumadocs ([#14](https://github.com/yapmod/client/pull/14))
- Remove safety warnings from plugins and themes settings sections ([b854a2c](https://github.com/yapmod/client/commit/b854a2c))
- **types:** Make @yapmod/types a published types-only package ([#39](https://github.com/yapmod/client/pull/39))
- **types:** Establish single source of truth for type safety ([#48](https://github.com/yapmod/client/pull/48))

### 📖 Documentation

- Restructure documentation foundation ([82a8c99](https://github.com/yapmod/client/commit/82a8c99))
- Set base path to /client for GitHub Pages deployment ([#5](https://github.com/yapmod/client/pull/5))
- Fix all internal links for /client base path ([#6](https://github.com/yapmod/client/pull/6))
- Fix remaining /blog/welcome links in banner and home page ([#7](https://github.com/yapmod/client/pull/7))
- Fix header logo link for /client base path ([#8](https://github.com/yapmod/client/pull/8))
- **types:** Expand type safety documentation with all 27 exportable types ([#46](https://github.com/yapmod/client/pull/46))

### 🏡 Chore

- Initial commit ([356bf9a](https://github.com/yapmod/client/commit/356bf9a))
- Remove @fumadocs/astro patch and patches folder --trailer "Co-authored-by: Junie <junie@jetbrains.com>" ([e304485](https://github.com/yapmod/client/commit/e304485))
- **repo:** Add GPLv3 license file ([#10](https://github.com/yapmod/client/pull/10))
- **docs:** Add Git Commits conventions to AGENTS.md ([f6ecbb3](https://github.com/yapmod/client/commit/f6ecbb3))
- **ci:** Add CI and release GitHub Actions workflows ([#12](https://github.com/yapmod/client/pull/12))
- Remove .junie folder ([063152a](https://github.com/yapmod/client/commit/063152a))
- **builder:** Publish @yapmod/builder to npm ([80fc5f5](https://github.com/yapmod/client/commit/80fc5f5))
- **builder:** Set up trusted publishing for npm ([dd6a346](https://github.com/yapmod/client/commit/dd6a346))
- **ci:** Remove --provenance flag, automatic with trusted publishing ([a062ba7](https://github.com/yapmod/client/commit/a062ba7))
- **builder:** Bump version to 1.0.1 for npm publish retry ([ea1cb8d](https://github.com/yapmod/client/commit/ea1cb8d))
- **builder:** Bump version to 1.0.4 for npm publish ([f481117](https://github.com/yapmod/client/commit/f481117))
- **ci:** Restore release workflow for client bundle ([b379486](https://github.com/yapmod/client/commit/b379486))
- Bump version to 1.2.0 ([#26](https://github.com/yapmod/client/pull/26))
- **release:** 1.0.1 [skip ci] ([cc419cb](https://github.com/yapmod/client/commit/cc419cb))
- **release:** 1.0.2 [skip ci] ([7c9082c](https://github.com/yapmod/client/commit/7c9082c))
- **types:** Add build config and prepare @yapmod/types for npm publish ([#40](https://github.com/yapmod/client/pull/40))
- **release:** 1.0.3 [skip ci] ([9304bdf](https://github.com/yapmod/client/commit/9304bdf))
- **types:** Publish @yapmod/types@1.0.2 via Trusted Publisher ([#44](https://github.com/yapmod/client/pull/44))
- **client:** Migrate release process from semantic-release to changelogen ([#50](https://github.com/yapmod/client/pull/50))
- **release:** V1.2.1-1.0.0.0 ([2df6a33](https://github.com/yapmod/client/commit/2df6a33))

### 🤖 CI

- Add GitHub Actions workflow for npm publishing ([0153b31](https://github.com/yapmod/client/commit/0153b31))
- Use npm Trusted Publisher (OIDC) instead of NPM_TOKEN ([#42](https://github.com/yapmod/client/pull/42))

### ❤️ Contributors

- Ilyes Hernandez ([@ilyeshdz](http://github.com/ilyeshdz))
- GitHub Actions ([@Github-Action-Bot](http://github.com/Github-Action-Bot))
- Semantic-release-bot <semantic-release-bot@martynus.net>
- Hdzilyes ([@ilyeshdz](http://github.com/ilyeshdz))

## v1.2.1-1.0.0.0


### 🚀 Enhancements

- **plugins:** Add client-registered plugin support ([#1](https://github.com/yapmod/client/pull/1))
- **plugins:** Add plugin API v1 with shared Solid, reactive storage, and builder ([#4](https://github.com/yapmod/client/pull/4))
- **builder:** Reimplement plugin builder as CLI tool with hot reload ([#18](https://github.com/yapmod/client/pull/18))
- **builder:** Export SolidJS transform utilities for external use ([ccaa853](https://github.com/yapmod/client/commit/ccaa853))
- **builder:** Add @yapmod/ui to shared modules for import rewriting ([5b5b35c](https://github.com/yapmod/client/commit/5b5b35c))
- **ui:** Add Switch, Select and Input components matching Yapin ([#20](https://github.com/yapmod/client/pull/20))
- **ui:** Add settings layout DSL components ([#25](https://github.com/yapmod/client/pull/25))
- **settings:** Redesign settings page with DSL components and developer section ([#28](https://github.com/yapmod/client/pull/28))
- **ci:** Replace manual release workflow with semantic-release ([#30](https://github.com/yapmod/client/pull/30))

### 🩹 Fixes

- **ci:** Remove NODE_AUTH_TOKEN interference for trusted publishing ([a576ea4](https://github.com/yapmod/client/commit/a576ea4))
- **ci:** Use Node 24 for npm trusted publishing (npm v11 required for OIDC) ([b4b76c6](https://github.com/yapmod/client/commit/b4b76c6))
- **ci:** Handle unchanged version in npm publish workflow ([8b30f0f](https://github.com/yapmod/client/commit/8b30f0f))
- **ci:** Move semantic-release config to project root ([#31](https://github.com/yapmod/client/pull/31))
- **ci:** Add conventional-changelog-conventionalcommits dependency ([#32](https://github.com/yapmod/client/pull/32))
- **ci:** Downgrade conventional-changelog-conventionalcommits to v7 ([#33](https://github.com/yapmod/client/pull/33))
- **ci:** Use conventional-changelog-conventionalcommits v8 ([#34](https://github.com/yapmod/client/pull/34))
- **ci:** Disable husky hooks during semantic-release ([#35](https://github.com/yapmod/client/pull/35))
- **storage:** Make proxy properties reactive in SolidJS without createMemo ([#38](https://github.com/yapmod/client/pull/38))
- **ci:** Remove NODE_AUTH_TOKEN interference for npm OIDC Trusted Publisher ([#43](https://github.com/yapmod/client/pull/43))

### 💅 Refactors

- **docs:** Migrate docs site from Astro to Next.js with Fumadocs ([#14](https://github.com/yapmod/client/pull/14))
- Remove safety warnings from plugins and themes settings sections ([b854a2c](https://github.com/yapmod/client/commit/b854a2c))
- **types:** Make @yapmod/types a published types-only package ([#39](https://github.com/yapmod/client/pull/39))
- **types:** Establish single source of truth for type safety ([#48](https://github.com/yapmod/client/pull/48))

### 📖 Documentation

- Restructure documentation foundation ([82a8c99](https://github.com/yapmod/client/commit/82a8c99))
- Set base path to /client for GitHub Pages deployment ([#5](https://github.com/yapmod/client/pull/5))
- Fix all internal links for /client base path ([#6](https://github.com/yapmod/client/pull/6))
- Fix remaining /blog/welcome links in banner and home page ([#7](https://github.com/yapmod/client/pull/7))
- Fix header logo link for /client base path ([#8](https://github.com/yapmod/client/pull/8))
- **types:** Expand type safety documentation with all 27 exportable types ([#46](https://github.com/yapmod/client/pull/46))

### 🏡 Chore

- Initial commit ([356bf9a](https://github.com/yapmod/client/commit/356bf9a))
- Remove @fumadocs/astro patch and patches folder --trailer "Co-authored-by: Junie <junie@jetbrains.com>" ([e304485](https://github.com/yapmod/client/commit/e304485))
- **repo:** Add GPLv3 license file ([#10](https://github.com/yapmod/client/pull/10))
- **docs:** Add Git Commits conventions to AGENTS.md ([f6ecbb3](https://github.com/yapmod/client/commit/f6ecbb3))
- **ci:** Add CI and release GitHub Actions workflows ([#12](https://github.com/yapmod/client/pull/12))
- Remove .junie folder ([063152a](https://github.com/yapmod/client/commit/063152a))
- **builder:** Publish @yapmod/builder to npm ([80fc5f5](https://github.com/yapmod/client/commit/80fc5f5))
- **builder:** Set up trusted publishing for npm ([dd6a346](https://github.com/yapmod/client/commit/dd6a346))
- **ci:** Remove --provenance flag, automatic with trusted publishing ([a062ba7](https://github.com/yapmod/client/commit/a062ba7))
- **builder:** Bump version to 1.0.1 for npm publish retry ([ea1cb8d](https://github.com/yapmod/client/commit/ea1cb8d))
- **builder:** Bump version to 1.0.4 for npm publish ([f481117](https://github.com/yapmod/client/commit/f481117))
- **ci:** Restore release workflow for client bundle ([b379486](https://github.com/yapmod/client/commit/b379486))
- Bump version to 1.2.0 ([#26](https://github.com/yapmod/client/pull/26))
- **release:** 1.0.1 [skip ci] ([cc419cb](https://github.com/yapmod/client/commit/cc419cb))
- **release:** 1.0.2 [skip ci] ([7c9082c](https://github.com/yapmod/client/commit/7c9082c))
- **types:** Add build config and prepare @yapmod/types for npm publish ([#40](https://github.com/yapmod/client/pull/40))
- **release:** 1.0.3 [skip ci] ([9304bdf](https://github.com/yapmod/client/commit/9304bdf))
- **types:** Publish @yapmod/types@1.0.2 via Trusted Publisher ([#44](https://github.com/yapmod/client/pull/44))
- **client:** Migrate release process from semantic-release to changelogen ([#50](https://github.com/yapmod/client/pull/50))

### 🤖 CI

- Add GitHub Actions workflow for npm publishing ([0153b31](https://github.com/yapmod/client/commit/0153b31))
- Use npm Trusted Publisher (OIDC) instead of NPM_TOKEN ([#42](https://github.com/yapmod/client/pull/42))

### ❤️ Contributors

- Ilyes Hernandez ([@ilyeshdz](http://github.com/ilyeshdz))
- Semantic-release-bot <semantic-release-bot@martynus.net>
- Hdzilyes ([@ilyeshdz](http://github.com/ilyeshdz))

