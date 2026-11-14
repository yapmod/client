import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { writeFile } from 'node:fs/promises';
import { dirname, join, parse } from 'node:path';

import { watchPlugin } from './watch.ts';

/**
 * Self-contained CSS for the dev control page — matches the Yapmod docs site
 * without depending on Tailwind or Fumadocs at runtime.
 *
 * The tokens are converted from the oklch values in apps/docs/app/global.css:
 * dark background oklch(0.145 0 0) -> #252525, primary #dd5a8c, etc.
 */
const uiCss = `
/* ------------------------------------------------------------- tokens -- */
:root {
  --background: #252525;
  --foreground: #fbfbfb;
  --primary: #dd5a8c;
  --primary-foreground: #ffffff;
  --muted: #444444;
  --muted-foreground: #b4b4b4;
  --destructive: #f2555a;
  --border: rgba(255, 255, 255, 0.1);
  --ring: #b4b4b4;
  --radius: 0.5rem;
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

@media (prefers-color-scheme: light) {
  :root {
    --background: #ffffff;
    --foreground: #252525;
    --primary: #dd5a8c;
    --primary-foreground: #ffffff;
    --muted: #f7f7f7;
    --muted-foreground: #8e8e8e;
    --destructive: #f2555a;
    --border: #ebebeb;
    --ring: #8e8e8e;
    --radius: 0.5rem;
  }
}

/* --------------------------------------------------------------- base -- */
*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.4;
  color: var(--foreground);
  background: var(--background);
  color-scheme: dark;
  -webkit-font-smoothing: antialiased;
}

/* ------------------------------------------------------------- hint -- */
.yp-hint {
  color: var(--muted-foreground);
  font-size: 13px;
}

/* ------------------------------------------------------------- button -- */
.yp-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 48px;
  padding: 0 24px;
  border: none;
  border-radius: 9999px;
  background: var(--primary);
  color: var(--primary-foreground);
  font-size: 15px;
  font-weight: 500;
  font-family: inherit;
  white-space: nowrap;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background-color 150ms ease, opacity 150ms ease;
}

.yp-btn:hover:not(:disabled) {
  background: color-mix(in srgb, var(--primary) 90%, transparent);
}

.yp-btn:active:not(:disabled) {
  background: color-mix(in srgb, var(--primary) 80%, transparent);
}

.yp-btn:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}

.yp-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

`;

/*
 * The development server behind Yapmod's hot reload.
 *
 * Why the browser never fetches from this server
 * ----------------------------------------------
 * Yapin's Content-Security-Policy allowlists a few hosts in `connect-src`
 * (`raw.githubusercontent.com` being the practical one) and does not allow
 * `unsafe-eval`. A page-side `fetch` to `http://127.0.0.1:5173` is a
 * `connect-src` request, so it is blocked: the client cannot poll a local
 * dev server, no matter what the dev server sends.
 *
 * `window.postMessage` is not covered by any CSP directive, so it is the one
 * channel that survives the policy. The server therefore serves a *control
 * page* on localhost. That page opens Yapin with `window.open`, keeps the
 * window handle and pushes every rebuild into it. The Yapmod client listens
 * for those messages, evaluates the expression with its existing inline
 * `<script>` trick (the same path a normal plugin load uses) and hot-swaps
 * the running plugin.
 *
 * The control page is a normal page on localhost, so it can talk to the
 * dev server over `fetch` and `EventSource` without any CSP trouble.
 */

export interface DevPluginManifest {
  name: string;
  author: string;
  description: string;
  version?: string;
}

export interface DevSessionOptions {
  /** Plugin entry file (`.ts`, `.tsx`, `.js` or `.jsx`). */
  entry: string;
  /** Address the dev server binds to. Defaults to `127.0.0.1`. */
  host?: string;
  /** Port the dev server listens on. Defaults to `5173`. */
  port?: number;
  /** Plugin metadata. Read from the nearest `package.json` when omitted. */
  manifest?: Partial<DevPluginManifest>;
  /** Minify the bundle. */
  minify?: boolean;
  /** Optional file the built expression is written to on every rebuild. */
  outfile?: string;
}

export interface DevSession {
  /** URL of the control page. */
  url: string;
  /** URL of the built plugin expression. */
  pluginUrl: string;
  /** Stops the watcher and the server. */
  close(): Promise<void>;
}

const YAPIN_URL = 'https://yapin.gg';

/** Turns a name into the id suffix the client uses for dev plugins. */
function slug(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'plugin'
  );
}

/**
 * Reads the plugin metadata from the nearest `package.json`.
 *
 * The lookup walks up from the entry file, so a plugin living in
 * `src/index.ts` still finds the manifest in the project root.
 */
async function readManifest(entry: string): Promise<DevPluginManifest> {
  let directory = dirname(entry);

  for (let depth = 0; depth < 5; depth += 1) {
    try {
      const raw = await readFile(join(directory, 'package.json'), 'utf8');
      const parsed = JSON.parse(raw) as Record<string, unknown>;

      return {
        name: typeof parsed.name === 'string' ? parsed.name : parse(entry).name,
        author: typeof parsed.author === 'string' ? parsed.author : 'Unknown Author',
        description: typeof parsed.description === 'string' ? parsed.description : '',
        version: typeof parsed.version === 'string' ? parsed.version : undefined,
      };
    } catch {
      const parent = dirname(directory);
      if (parent === directory) break;
      directory = parent;
    }
  }

  return { name: parse(entry).name, author: 'Unknown Author', description: '' };
}

/**
 * The control page.
 *
 * It is served from localhost, so it may use `fetch`, `EventSource` and
 * inline scripts freely. Its only job is to carry the built expression
 * into the Yapin window. Uses the same design tokens as @yapmod/ui so it
 * feels like part of the Yapmod ecosystem.
 */
function controlPage(options: {
  id: string;
  manifest: DevPluginManifest;
  yapinUrl: string;
  yapinOrigin: string;
}): string {
  const config = JSON.stringify({
    id: options.id,
    name: options.manifest.name,
    author: options.manifest.author,
    description: options.manifest.description,
    version: options.manifest.version,
    yapinUrl: options.yapinUrl,
    yapinOrigin: options.yapinOrigin,
  });

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Yapmod Dev — ${escapeHtml(options.manifest.name)}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <style>
      ${uiCss}

      /* Minimal hero layout — matches the docs landing page */
      body {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        padding: 24px;
      }

      .dev-container {
        width: 100%;
        max-width: 380px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        text-align: center;
      }

      .dev-title {
        font-size: 28px;
        font-weight: 700;
        margin: 0;
        line-height: 1.2;
        letter-spacing: -0.025em;
      }

      .dev-subtitle {
        color: var(--muted-foreground);
        font-size: 14px;
        margin: 0 0 8px 0;
        line-height: 1.5;
      }

      /* Status indicator */
      .dev-status {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 8px 14px;
        border-radius: var(--radius);
        background: var(--muted);
        font-size: 13px;
        color: var(--muted-foreground);
        width: 100%;
      }

      .dev-status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--muted-foreground);
        flex-shrink: 0;
        transition: background 200ms ease;
      }

      .dev-status-dot.connected {
        background: #3fcf82;
        box-shadow: 0 0 6px #3fcf82;
      }

      .dev-status-dot.error {
        background: var(--destructive);
      }

      .dev-status-text {
        flex: 1;
        white-space: pre-wrap;
        word-break: break-word;
        text-align: center;
      }

      /* Action button — full width */
      .yp-btn {
        width: 100%;
      }
    </style>
  </head>
  <body>
    <div class="dev-container">
      <h1 class="dev-title">${escapeHtml(options.manifest.name)}</h1>
      <p class="dev-subtitle">Hot reload for your Yapmod plugin</p>

      <button class="yp-btn" id="open">Open Yapin</button>

      <div class="dev-status" id="status">
        <span class="dev-status-dot" id="statusDot"></span>
        <span class="dev-status-text" id="statusText">Waiting for the first build…</span>
      </div>
    </div>

    <script>
      const config = ${config};
      const statusText = document.getElementById('statusText');
      const statusDot = document.getElementById('statusDot');
      const target = { window: null };
      let lastCode = null;
      let connected = false;

      function report(message, kind) {
        statusText.textContent = message;
        statusDot.className = 'dev-status-dot';
        if (kind === 'ok') statusDot.classList.add('connected');
        if (kind === 'bad') statusDot.classList.add('error');
      }

      function send(message) {
        const view = target.window;
        if (!view || view.closed) {
          report('No Yapin window connected. Click "Open Yapin".', 'bad');
          return;
        }
        view.postMessage(message, config.yapinOrigin);
      }

      function push(code, force) {
        if (!force && code === lastCode) return;
        lastCode = code;
        send({
          type: 'yapmod:dev:update',
          payload: {
            id: config.id,
            name: config.name,
            author: config.author,
            description: config.description,
            version: config.version,
            code: code,
          },
        });
      }

      document.getElementById('open').addEventListener('click', () => {
        // The window name makes a second click focus the same tab instead of
        // opening another one.
        target.window = window.open(config.yapinUrl, 'yapmod-dev-' + config.id);
        report('Opened Yapin. Waiting for the client to say hello…');
        ping();
        sendCurrent();
      });

      // The build may already be finished when the control page opens, so
      // the current bundle is pushed explicitly as well.
      function sendCurrent() {
        void fetch('/plugin.js')
          .then((response) => response.text())
          .then((code) => {
            if (code.trim()) push(code, true);
          })
          .catch(() => report('Could not read the current build.', 'bad'));
      }

      function ping() {
        const view = target.window;
        if (!view || view.closed) return;
        try {
          view.postMessage({ type: 'yapmod:dev:ping' }, config.yapinOrigin);
        } catch {
          report('Could not reach the Yapin window.', 'bad');
        }
      }

      // The window may still be loading when it is opened, so the probe is
      // repeated until the client answers.
      setInterval(() => {
        if (connected) return;
        if (target.window && !target.window.closed) ping();
      }, 1000);

      window.addEventListener('message', (event) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        if (data.type === 'yapmod:dev:ready') {
          // The answer to our probe: the client is listening.
          target.window = event.source;
          connected = true;
          report('Connected to Yapin.');
          sendCurrent();
          return;
        }

        if (data.type === 'yapmod:dev:hello') {
          // The Yapin page announced itself — it just (re)loaded, so the
          // current build is pushed again.
          target.window = event.source;
          connected = true;
          const enabled = !!(data.payload && data.payload.devFeatures);
          report(
            enabled
              ? 'Connected to Yapin.'
              : 'Yapmod: enable "Developer features" in Yapin → Settings.',
            enabled ? 'ok' : 'bad',
          );
          sendCurrent();
          return;
        }

        if (data.type === 'yapmod:dev:status') {
          const status = data.payload || {};
          report(
            status.ok ? 'Reloaded ' + new Date().toLocaleTimeString() : 'Error: ' + status.message,
            status.ok ? 'ok' : 'bad',
          );
        }
      });

      const events = new EventSource('/events');
      events.addEventListener('build', (event) => {
        push(JSON.parse(event.data));
      });
      events.addEventListener('error', (event) => {
        report('Build error: ' + (event.data || 'unknown error'), 'bad');
      });
    </script>
  </body>
</html>
`;
}

/** Escapes the few characters that would break the control page markup. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Starts a dev session: an esbuild watcher plus a control page.
 *
 * The returned session serves the control page, the built expression and a
 * server-sent event stream the page listens to. Nothing here reaches into
 * the browser — the control page does that, over `postMessage`.
 */
export async function startDevSession(options: DevSessionOptions): Promise<DevSession> {
  const host = options.host ?? '127.0.0.1';
  const port = options.port ?? 5173;
  const yapinUrl = YAPIN_URL;
  const yapinOrigin = new URL(yapinUrl).origin;

  const fromPackage = await readManifest(options.entry);
  const manifest: DevPluginManifest = {
    name: options.manifest?.name ?? fromPackage.name,
    author: options.manifest?.author ?? fromPackage.author,
    description: options.manifest?.description ?? fromPackage.description,
    version: options.manifest?.version ?? fromPackage.version,
  };

  const id = `dev:${slug(manifest.name)}`;
  const clients = new Set<ServerResponse>();

  let code = '';
  let buildError: string | undefined;

  function publish(): void {
    for (const client of clients) {
      client.write(`event: build\ndata: ${JSON.stringify(code)}\n\n`);
    }
  }

  function publishError(message: string): void {
    for (const client of clients) {
      client.write(`event: error\ndata: ${JSON.stringify(message)}\n\n`);
    }
  }

  const stopWatching = await watchPlugin({
    entry: options.entry,
    minify: options.minify,
    onRebuild(expression) {
      code = expression;
      buildError = undefined;
      publish();

      if (options.outfile) {
        void writeFile(options.outfile, expression, 'utf8').catch((error: unknown) => {
          console.error(`[yapmod] could not write ${options.outfile}:`, error);
        });
      }
    },
    onError(error) {
      buildError = error.message;
      publishError(error.message);
    },
  });

  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    const url = new URL(request.url ?? '/', `http://${host}:${port}`);

    if (url.pathname === '/events') {
      response.writeHead(200, {
        'content-type': 'text/event-stream',
        'cache-control': 'no-cache',
        connection: 'keep-alive',
      });
      response.write(': connected\n\n');
      clients.add(response);
      request.on('close', () => clients.delete(response));
      return;
    }

    if (url.pathname === '/plugin.js') {
      response.writeHead(200, {
        'content-type': 'text/javascript; charset=utf-8',
        'cache-control': 'no-store',
      });
      response.end(code);
      return;
    }

    if (url.pathname === '/manifest.json') {
      response.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      });
      response.end(JSON.stringify({ ...manifest, id, buildError }));
      return;
    }

    if (url.pathname === '/') {
      response.writeHead(200, {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-store',
      });
      response.end(controlPage({ id, manifest, yapinUrl, yapinOrigin }));
      return;
    }

    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
  });

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => resolve());
  });

  const address = server.address();
  const boundPort = typeof address === 'object' && address ? address.port : port;

  return {
    url: `http://${host}:${boundPort}/`,
    pluginUrl: `http://${host}:${boundPort}/plugin.js`,
    async close() {
      for (const client of clients) client.end();
      clients.clear();
      await stopWatching();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}
