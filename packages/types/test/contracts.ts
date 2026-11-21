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
    onActivate({ length, maxLength, focus }) {
      const remaining = maxLength === null ? undefined : maxLength - length;
      if (remaining === 0) focus();
    },
  });
}
