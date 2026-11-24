/**
 * Type contract tests.
 *
 * This file verifies that the public contracts keep their shape.
 * It uses TypeScript's type system to assert that:
 * - PluginUi exposes the members the runtime ui object provides
 * - ClientHandle matches the expected shape
 * - The plugin, manifest and settings contracts keep their required members
 *
 * Run with: `tsc --noEmit test/contracts.ts`
 */

// Types from @yapmod/types (the public surface)
import type {
  PluginUi,
  YapmodPluginApi,
  ClientHandle,
  PluginManifest,
  PluginSettingsSection,
  SharedSolid,
} from '@yapmod/types';

/* ------------------------------------------------------------------ */
/* PluginUi: verify structural compatibility                           */
/* ------------------------------------------------------------------ */

// PluginUi must contain all expected UI component keys
type _PluginUiHasButton = PluginUi extends { Button: PluginUi['Button'] } ? true : false;
type _PluginUiHasSwitch = PluginUi extends { Switch: PluginUi['Switch'] } ? true : false;
type _PluginUiHasInput = PluginUi extends { Input: PluginUi['Input'] } ? true : false;
type _PluginUiHasSelect = PluginUi extends { Select: PluginUi['Select'] } ? true : false;
type _PluginUiHasShowToast = PluginUi extends { showToast: PluginUi['showToast'] } ? true : false;
type _PluginUiHasOpenModal = PluginUi extends { openModal: PluginUi['openModal'] } ? true : false;

const _pluginUiAssertions: [
  _PluginUiHasButton,
  _PluginUiHasSwitch,
  _PluginUiHasInput,
  _PluginUiHasSelect,
  _PluginUiHasShowToast,
  _PluginUiHasOpenModal,
] = [true, true, true, true, true, true];

/* ------------------------------------------------------------------ */
/* YapmodPluginApi: verify required members                            */
/* ------------------------------------------------------------------ */

export function messageMenuContract(api: YapmodPluginApi): () => void {
  return api.contextMenus.registerAction('message', {
    id: 'details',
    label: 'Details',
    icon: 'settings',
    visible: ({ messageId }) => messageId.length > 0,
    onSelect: ({ messageId }) => api.log(messageId),
  });
}

export function sliderContract(ui: PluginUi, change: (value: number) => void) {
  return ui.Slider({
    label: 'Opacity',
    min: 50,
    defaultValue: 85,
    formatValue: (value) => `${value.toFixed()}%`,
    onChange: change,
  });
}

type _ApiHasId = YapmodPluginApi extends { readonly id: string } ? true : false;
type _ApiHasStorage = YapmodPluginApi extends { readonly storage: Record<string, unknown> }
  ? true
  : false;
type _ApiHasUi = YapmodPluginApi extends { readonly ui: PluginUi } ? true : false;
type _ApiHasSolid = YapmodPluginApi extends { readonly solid: SharedSolid['solid'] } ? true : false;

const _apiAssertions: [_ApiHasId, _ApiHasStorage, _ApiHasUi, _ApiHasSolid] = [
  true,
  true,
  true,
  true,
];

/* ------------------------------------------------------------------ */
/* ClientHandle: verify required members                               */
/* ------------------------------------------------------------------ */

type _HandleHasVersion = ClientHandle extends { readonly version: string } ? true : false;
type _HandleHasState = ClientHandle extends { readonly state: ClientHandle['state'] }
  ? true
  : false;
type _HandleHasApi = ClientHandle extends { readonly api: SharedSolid } ? true : false;
type _HandleHasUi = ClientHandle extends { readonly ui: PluginUi } ? true : false;

const _handleAssertions: [_HandleHasVersion, _HandleHasState, _HandleHasApi, _HandleHasUi] = [
  true,
  true,
  true,
  true,
];

/* ------------------------------------------------------------------ */
/* PluginManifest: verify required fields                              */
/* ------------------------------------------------------------------ */

type _ManifestHasName = PluginManifest extends { name: string } ? true : false;
type _ManifestHasAuthor = PluginManifest extends { author: string } ? true : false;
type _ManifestHasDescription = PluginManifest extends { description: string } ? true : false;

const _manifestAssertions: [_ManifestHasName, _ManifestHasAuthor, _ManifestHasDescription] = [
  true,
  true,
  true,
];

/* ------------------------------------------------------------------ */
/* PluginSettingsSection: verify required fields                       */
/* ------------------------------------------------------------------ */

type _SectionHasId = PluginSettingsSection extends { id: string } ? true : false;
type _SectionHasLabel = PluginSettingsSection extends { label: string } ? true : false;
type _SectionHasRender = PluginSettingsSection extends { render: () => unknown } ? true : false;

const _sectionAssertions: [_SectionHasId, _SectionHasLabel, _SectionHasRender] = [true, true, true];

export function composerBlockContract(api: YapmodPluginApi): () => void {
  return api.composer.registerBlock((composer) => String(composer.length));
}

export function composerStatusContract(api: YapmodPluginApi): () => void {
  return api.composer.registerStatus(({ length, maxLength }) => {
    if (maxLength === null) return String(length);
    return { text: String(maxLength - length), tone: 'warning' };
  });
}

export function composerToolContract(api: YapmodPluginApi): () => void {
  return api.composer.registerTool({
    id: 'settings',
    label: 'Open settings',
    icon: 'settings',
    onActivate({ length, maxLength, focus, insertText }) {
      const remaining = maxLength === null ? undefined : maxLength - length;
      if (remaining === 0) focus();
      const result = insertText('Hello');
      if (!result.ok) {
        const reason: 'stale-target' | 'draft-changed' | 'max-length' | 'not-editable' =
          result.reason;
        api.log(reason);
      }
      // @ts-expect-error Insertion accepts plain text only.
      insertText(42);
    },
  });
}

export function commandsContract(api: YapmodPluginApi): () => void {
  const remove: () => void = api.commands.register({
    name: 'hello',
    description: 'Show a greeting',
    async execute({ args, signal }) {
      const text: string = args;
      const aborted: boolean = signal.aborted;
      if (!aborted) api.ui.showToast(text);
    },
  });
  // @ts-expect-error Commands require an execute callback.
  api.commands.register({ name: 'missing', description: 'Missing callback' });
  return remove;
}

export function locationsContract(api: YapmodPluginApi): void {
  api.ui.registerHeaderAction({
    id: 'header',
    label: 'Header',
    onSelect: ({ chatId }) => {
      api.log(chatId);
    },
  });
  api.ui.registerSidebarEntry({ id: 'sidebar', label: 'Sidebar', onSelect: () => {} });
  api.contextMenus.registerAction('channel', {
    id: 'channel',
    label: 'Channel',
    onSelect: (context) => {
      const id: string = context.channelId;
      api.log(id);
      // @ts-expect-error Channel contexts are not user contexts.
      api.log(context.userId);
    },
  });
  api.contextMenus.registerAction('user', {
    id: 'user',
    label: 'User',
    onSelect: (context) => {
      const id: string = context.userId;
      api.log(id);
      // @ts-expect-error Member contexts are not message contexts.
      api.log(context.messageId);
    },
  });
  api.ui.openPanel({ id: 'notes', title: 'Notes', render: ({ chatId }) => chatId });
}
