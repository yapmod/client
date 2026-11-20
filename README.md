<div align="center">
  <img src="https://raw.githubusercontent.com/yapmod/desktop/c3b333cc802e2bf6094cb368771faac8916f6739/docs/images/banner.svg" width="870" alt="Yapmod" />
  <h1>Yapmod Client</h1>
  <p>Customize Yapin in your browser with CSS themes and JavaScript plugins.</p>
  <p>
    <a href="LICENSE"><img src="https://img.shields.io/badge/license-GPL%20v3-blue" alt="GPL v3 license" /></a>
    <a href="https://github.com/yapmod/client/releases/latest"><img src="https://img.shields.io/github/v/release/yapmod/client" alt="Latest client release" /></a>
  </p>
</div>

## Getting started

1. Download `yapmod-client.js` from the **Assets** section of the [latest release](https://github.com/yapmod/client/releases/latest).
2. Open [Yapin](https://yapin.gg) in Chrome or Edge. In that tab’s Developer Tools, go to **Sources → Snippets → New snippet**.
3. Copy the contents of the downloaded file into the snippet, name it `yapmod-client.js`, and save. Press **⌘ Enter** on macOS or **Ctrl Enter** on Windows and Linux to run it.
4. Open Yapin’s **Settings → Yapmod**. To add your first theme, follow the [theme setup instructions](apps/docs/content/docs/get-started.mdx#add-a-theme).

Run the saved snippet again after refreshing Yapin. Your themes, plugins, and preferences stay in this browser. To update the client, replace the snippet contents with the latest release, refresh Yapin, and run the snippet.

## Themes and plugins

| In Yapin settings    | What you can do                                                                                                       |
| -------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **Yapmod → Themes**  | Choose **Add Theme** to upload a CSS file or enter a theme URL. Toggle the theme to see the change immediately.       |
| **Yapmod → Plugins** | Choose **Add Plugin** to install from a plugin URL or import JavaScript. Enable or disable each plugin from its card. |

## Development

Install Node.js 22 or later and pnpm 12, then run these commands from the repository root.

```sh
pnpm install
pnpm dev
```

The watcher rebuilds `apps/client/dist/yapmod-client.js` when you edit the source. To try a new build in the same tab, run `YapmodClient.dispose()` in the console, replace the snippet contents with the rebuilt file, and run it again. Check `YapmodClient.state` for `"ready"`.

| Command                             | Result                                          |
| ----------------------------------- | ----------------------------------------------- |
| `pnpm build`                        | Builds the production browser bundle.           |
| `pnpm docs`                         | Starts the documentation site locally.          |
| `pnpm typecheck`                    | Checks TypeScript across the workspace.         |
| `pnpm lint`                         | Runs Oxlint.                                    |
| `pnpm format` / `pnpm format:check` | Formats the workspace or checks its formatting. |

Use [Conventional Commits](https://www.conventionalcommits.org/) for contributions. [Plugin development](apps/docs/content/docs/development/index.mdx) · [Changelog](CHANGELOG.md) · [Maintenance instructions](AGENTS.md)

## License and artwork

Yapmod Client is licensed under GPL-3.0. The header uses the banner from Yapmod Desktop. [License](LICENSE) · [Banner artwork](https://github.com/yapmod/desktop/blob/c3b333cc802e2bf6094cb368771faac8916f6739/docs/images/banner.svg)

<p align="center">Yapmod Client is an independent Yapin community project.</p>
