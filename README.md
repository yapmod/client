# Yapmod Client

A client mod for <a href="https://yapin.gg">Yapin</a>. Customize your experience with plugins, themes and more.

Yapmod is an open-source client mod for Yapin. It lets you customize the client, extend its functionality with plugins and change its appearance with themes.

It also provides a development API for creating your own plugins and themes, with the goal of making customization accessible to both users and developers.

The project is still under active development, so things may change as it evolves.

## Development

```sh
pnpm install
pnpm dev
```

The development build watches for changes and rebuilds the client automatically.

## Commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Build and watch for changes |
| `pnpm build` | Build for production |
| `pnpm typecheck` | Type-check the workspace |
| `pnpm lint` | Run Oxlint |
| `pnpm format` | Format with Oxfmt |
| `pnpm format:check` | Check formatting |

## Documentation

The documentation is available in `apps/docs`.

```sh
pnpm docs
```

Built with Astro and Fumadocs.