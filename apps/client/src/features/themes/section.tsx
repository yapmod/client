import { CollectionGroup } from '../collections/section';
import { collectionNameMatches } from '../collections/membership';
import { themeCatalogs } from '../collections/store';
import type { CollectionEntry, ThemeCollection } from '../collections/manifest';
import { Button, Icon, Input, SettingsPage, Switch } from '@yapmod/ui';
import { For, Show, createMemo, createSignal } from 'solid-js';
import { openConfirmModal } from '../../lib/modal';
import { showToast } from '../../lib/toast';
import { openThemeEditor } from './editor';
import { safeHttpUrl } from './metadata';
import { onlineModeLabel, onlineThemeName, parseOnlineTheme, type OnlineThemeMode } from './online';
import {
  addOnlineTheme,
  removeLocalTheme,
  removeOnlineTheme,
  setLocalThemeEnabled,
  setOnlineThemeEnabled,
  themeState,
} from './store';
import type { LocalTheme } from './types';

type ThemeItem =
  | { kind: 'local'; key: string; theme: LocalTheme; enabled: boolean }
  | {
      kind: 'online';
      key: string;
      line: string;
      url: string;
      mode: OnlineThemeMode;
      name: string;
      enabled: boolean;
    };

function themeName(item: ThemeItem): string {
  return item.kind === 'local' ? item.theme.name : item.name;
}

function searchText(item: ThemeItem): string {
  if (item.kind === 'local') {
    return `${item.theme.name}\n${item.theme.author}\n${item.theme.description}`;
  }

  return `${item.name}\n${item.url}\n${onlineModeLabel(item.mode)}`;
}

function LocalThemeCard(props: { theme: LocalTheme; enabled: boolean }) {
  const theme = () => props.theme;

  async function remove(): Promise<void> {
    const confirmed = await openConfirmModal({
      title: 'Delete theme',
      body: `Delete ${theme().name}? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });

    if (!confirmed) return;

    removeLocalTheme(theme().fileName);
    showToast(`${theme().name} deleted.`, 'success');
  }

  return (
    <section class="ss2-card">
      <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '12px' }}>
        <div style={{ flex: '1 1 0', 'min-width': '0' }}>
          <div class="toggle-label">{theme().name}</div>
          <div class="hint">
            by {theme().author}
            <Show when={theme().version}> · v{theme().version}</Show>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'flex-end',
            'flex-wrap': 'wrap',
            gap: '4px',
          }}
        >
          <button
            type="button"
            class="icon-btn muted"
            title="Delete theme"
            aria-label={`Delete ${theme().name}`}
            onClick={() => void remove()}
          >
            <Icon name="trash" size={16} />
          </button>

          <Switch
            checked={props.enabled}
            aria-label={`Enable ${theme().name}`}
            onChange={(enabled) => setLocalThemeEnabled(theme().fileName, enabled)}
          />
        </div>
      </div>

      <div class="hint">{theme().description}</div>

      <Show when={theme().website || theme().invite}>
        <div class="row-gap" style={{ 'margin-top': '8px' }}>
          <Show when={theme().website}>
            <a href={theme().website} target="_blank" rel="noreferrer">
              Website
            </a>
          </Show>
          <Show when={theme().website && theme().invite}>
            <span class="hint">•</span>
          </Show>
          <Show when={theme().invite}>
            <a href={`https://discord.gg/${theme().invite}`} target="_blank" rel="noreferrer">
              Discord Server
            </a>
          </Show>
        </div>
      </Show>
    </section>
  );
}

function OnlineThemeCard(props: {
  line: string;
  url: string;
  mode: OnlineThemeMode;
  name: string;
  enabled: boolean;
}) {
  const safeUrl = () => safeHttpUrl(props.url);

  async function remove(): Promise<void> {
    const confirmed = await openConfirmModal({
      title: 'Delete theme',
      body: `Delete ${props.name}? This cannot be undone.`,
      confirmText: 'Delete',
      danger: true,
    });

    if (!confirmed) return;

    removeOnlineTheme(props.line);
    showToast(`${props.name} deleted.`, 'success');
  }

  return (
    <section class="ss2-card">
      <div style={{ display: 'flex', 'align-items': 'flex-start', gap: '12px' }}>
        <div style={{ flex: '1 1 0', 'min-width': '0' }}>
          <div class="toggle-label">{props.name}</div>
          <div class="hint">Online theme · {onlineModeLabel(props.mode)}</div>
        </div>

        <div
          style={{
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'flex-end',
            'flex-wrap': 'wrap',
            gap: '4px',
          }}
        >
          <button
            type="button"
            class="icon-btn muted"
            title="Delete theme"
            aria-label={`Delete ${props.name}`}
            onClick={() => void remove()}
          >
            <Icon name="trash" size={16} />
          </button>

          <Switch
            checked={props.enabled}
            aria-label={`Enable ${props.name}`}
            onChange={(enabled) => setOnlineThemeEnabled(props.line, enabled)}
          />
        </div>
      </div>

      <div class="hint" style={{ 'word-break': 'break-all' }}>
        <Show when={safeUrl()} fallback={<span>{props.url}</span>}>
          <a href={safeUrl()} target="_blank" rel="noreferrer">
            {props.url}
          </a>
        </Show>
      </div>
    </section>
  );
}

function matchingThemes(collection: ThemeCollection, search: string) {
  if (collectionNameMatches(collection, search)) return collection.themes;
  const term = search.trim().toLowerCase();
  return collection.themes.filter((entry) =>
    [entry.name, entry.author, entry.description, entry.url].some((field) =>
      field.toLowerCase().includes(term),
    ),
  );
}

function CollectionThemeCard(props: { entry: CollectionEntry }) {
  const installed = () => themeState().online.includes(props.entry.url);
  return (
    <Show
      when={installed()}
      fallback={
        <section class="ss2-card yp-collection-item">
          <div class="ss2-card-head">
            <div class="ss2-card-text">
              <div class="toggle-label">{props.entry.name}</div>
              <Show when={props.entry.author}>
                <div class="hint">by {props.entry.author}</div>
              </Show>
              <Show when={props.entry.description}>
                <div class="hint">{props.entry.description}</div>
              </Show>
            </div>
            <Button
              size="small"
              variant="secondary"
              onClick={() => {
                addOnlineTheme(props.entry.url, false);
                showToast('Theme installed. Enable it when you are ready.', 'success');
              }}
            >
              Install
            </Button>
          </div>
        </section>
      }
    >
      <OnlineThemeCard
        line={props.entry.url}
        url={props.entry.url}
        name={props.entry.name}
        mode="always"
        enabled={themeState().enabledOnline.includes(props.entry.url)}
      />
    </Show>
  );
}

/**
 * The Themes page.
 *
 * It follows the same layout as the Plugins page: a search field and an
 * "Add Theme" button, a safety card, and one full-width card per installed
 * theme. Local and online themes live in the same list and both have an
 * enable switch and a delete action.
 */
export function ThemesPage() {
  const [search, setSearch] = createSignal('');

  const grouped = createMemo(
    () =>
      new Set(
        themeCatalogs
          .collections()
          .flatMap((collection) => collection.themes.map((entry) => entry.url)),
      ),
  );
  const visibleCollections = createMemo(() =>
    themeCatalogs
      .collections()
      .filter(
        (collection) =>
          collectionNameMatches(collection, search()) ||
          matchingThemes(collection, search()).length > 0,
      ),
  );

  const items = createMemo<ThemeItem[]>(() => {
    const state = themeState();
    const localEnabled = new Set(state.enabledLocal);
    const onlineEnabled = new Set(state.enabledOnline);

    const local: ThemeItem[] = state.local.map((theme) => ({
      kind: 'local',
      key: `local:${theme.fileName}`,
      theme,
      enabled: localEnabled.has(theme.fileName),
    }));

    const online: ThemeItem[] = state.online
      .filter((line) => !grouped().has(line))
      .map((line) => {
        const parsed = parseOnlineTheme(line);

        return {
          kind: 'online',
          key: `online:${line}`,
          line,
          url: parsed.url,
          mode: parsed.mode,
          name: onlineThemeName(parsed.url),
          enabled: onlineEnabled.has(line),
        };
      });

    // `toSorted` is newer than the client's configured lib target.
    // oxlint-disable-next-line unicorn/no-array-sort
    return [...local, ...online].sort((left, right) =>
      themeName(left).localeCompare(themeName(right)),
    );
  });

  const visible = createMemo(() => {
    const term = search().trim().toLowerCase();
    if (!term) return items();

    return items().filter((item) => searchText(item).toLowerCase().includes(term));
  });

  return (
    <SettingsPage
      title="Themes"
      description="Install CSS themes from files, direct links, or collections. Themes are stored in this browser and applied to Yapin."
    >
      <div class="row-gap" style={{ 'margin-bottom': '14px' }}>
        <Input
          type="search"
          placeholder="Search themes..."
          aria-label="Search themes"
          value={search()}
          onChange={setSearch}
          style={{ flex: '1 1 220px', width: 'auto' }}
        />
        <Button onClick={openThemeEditor}>
          <Icon name="plus" size={14} />
          Add Theme
        </Button>
      </div>

      <Show
        when={items().length > 0 || themeCatalogs.collections().length > 0}
        fallback={
          <p class="hint" style={{ 'margin-top': '12px' }}>
            No themes installed yet.
          </p>
        }
      >
        <Show
          when={visible().length > 0 || visibleCollections().length > 0}
          fallback={
            <p class="hint" style={{ 'margin-top': '12px' }}>
              No themes or collections match your search.
            </p>
          }
        >
          <div
            style={{
              display: 'flex',
              'flex-direction': 'column',
              gap: '10px',
              'margin-top': '12px',
            }}
          >
            <For each={visible()}>
              {(item) =>
                item.kind === 'local' ? (
                  <LocalThemeCard theme={item.theme} enabled={item.enabled} />
                ) : (
                  <OnlineThemeCard
                    line={item.line}
                    url={item.url}
                    mode={item.mode}
                    name={item.name}
                    enabled={item.enabled}
                  />
                )
              }
            </For>
            <For each={visibleCollections()}>
              {(collection) => (
                <CollectionGroup
                  collection={collection}
                  search={search()}
                  kind="themes"
                  count={collection.themes.length}
                  installed={
                    collection.themes.filter((entry) => themeState().online.includes(entry.url))
                      .length
                  }
                  refresh={themeCatalogs.refreshCollection}
                  remove={themeCatalogs.removeCollection}
                >
                  <For each={matchingThemes(collection, search())}>
                    {(entry) => <CollectionThemeCard entry={entry} />}
                  </For>
                </CollectionGroup>
              )}
            </For>
          </div>
        </Show>
      </Show>
    </SettingsPage>
  );
}
