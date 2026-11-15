/**
 * Type contract tests.
 *
 * This file verifies that types across packages remain consistent.
 * It uses TypeScript's type system to assert that:
 * - UI prop types from @yapmod/types match those from @yapmod/ui
 * - PluginUi interface is structurally compatible with the runtime ui object
 * - ClientHandle matches the expected shape
 *
 * Run with: `tsc --noEmit test/contracts.ts`
 */

// Types from @yapmod/types (the public surface)
import type {
  ButtonProps as TypesButtonProps,
  IconProps as TypesIconProps,
  SwitchProps as TypesSwitchProps,
  InputProps as TypesInputProps,
  TextareaProps as TypesTextareaProps,
  SelectProps as TypesSelectProps,
  SettingsPageProps as TypesSettingsPageProps,
  SectionProps as TypesSectionProps,
  SettingRowProps as TypesSettingRowProps,
  SettingTextProps as TypesSettingTextProps,
  PluginUi,
  YapmodPluginApi,
  ClientHandle,
  PluginManifest,
  PluginSettingsSection,
  SharedSolid,
} from '@yapmod/types';

// Types from @yapmod/ui (the source of truth)
import type {
  ButtonProps as UiButtonProps,
  IconProps as UiIconProps,
  SwitchProps as UiSwitchProps,
  InputProps as UiInputProps,
  TextareaProps as UiTextareaProps,
  SelectProps as UiSelectProps,
  SettingsPageProps as UiSettingsPageProps,
  SectionProps as UiSectionProps,
  SettingRowProps as UiSettingRowProps,
  SettingTextProps as UiSettingTextProps,
} from '@yapmod/ui';

/* ------------------------------------------------------------------ */
/* UI prop types: @yapmod/types must match @yapmod/ui exactly          */
/* ------------------------------------------------------------------ */

type AssertEqual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;

type _BtnMatch = AssertEqual<TypesButtonProps, UiButtonProps>;
type _IconMatch = AssertEqual<TypesIconProps, UiIconProps>;
type _SwitchMatch = AssertEqual<TypesSwitchProps, UiSwitchProps>;
type _InputMatch = AssertEqual<TypesInputProps, UiInputProps>;
type _TextareaMatch = AssertEqual<TypesTextareaProps, UiTextareaProps>;
type _SelectMatch = AssertEqual<TypesSelectProps, UiSelectProps>;
type _SettingsPageMatch = AssertEqual<TypesSettingsPageProps, UiSettingsPageProps>;
type _SectionMatch = AssertEqual<TypesSectionProps, UiSectionProps>;
type _SettingRowMatch = AssertEqual<TypesSettingRowProps, UiSettingRowProps>;
type _SettingTextMatch = AssertEqual<TypesSettingTextProps, UiSettingTextProps>;

// Force evaluation: these will error if any assertion is false
const _assertions: [
  _BtnMatch,
  _IconMatch,
  _SwitchMatch,
  _InputMatch,
  _TextareaMatch,
  _SelectMatch,
  _SettingsPageMatch,
  _SectionMatch,
  _SettingRowMatch,
  _SettingTextMatch,
] = [true, true, true, true, true, true, true, true, true, true];

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
