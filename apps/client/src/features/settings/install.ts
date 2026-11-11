import type { Client } from '@yapmod/types';
import { createIcon, injectStyle, removeStyle, type IconName } from '@yapmod/ui';
import type { JSX } from 'solid-js';
import { render } from 'solid-js/web';

/**
 * A single entry shown in Yapin's settings navigation.
 */
export interface SettingsSection {
  /** Stable identifier, written to the nav entry's DOM attribute. */
  id: string;
  /** Label shown in Yapin's settings navigation. */
  label: string;
  /** Icon rendered in front of the label. */
  icon?: IconName;
  /** Solid content rendered into the section's panel. */
  render: () => JSX.Element;
}

/**
 * A group of sections: a heading in the navigation with its entries
 * underneath, the way Yapin groups its own settings.
 */
export interface SettingsGroup {
  /** Heading shown above the group's entries. */
  label: string;
  /** The entries of this group, in navigation order. */
  sections: SettingsSection[];
}

const STYLE_ID = 'yapmod-settings-styles';

// The class and attribute names used by HOST_CSS below.
const ACTIVE_CLASS = 'yp-active';
const SECTION_ATTRIBUTE = 'data-yp-section';
const CURRENT_ATTRIBUTE = 'data-yp-current';
const NAV_LABEL_CLASS = 'settings-nav-label';
const PANEL_CLASS = 'yp-panel';

const SETTINGS_SELECTOR = '.settings';
const NAV_SELECTOR = ':scope > .settings-nav';
const NATIVE_PANEL_SELECTOR = ':scope > .settings-main:not(.yp-panel)';

/*
 * How a Yapmod section is shown inside the host settings modal.
 *
 * All three rules are purely structural: they re-apply by themselves when
 * React swaps the native panel or the navigation out from under us, so
 * there is no `hidden` state in JavaScript that could go stale. Our panel
 * carries the host `settings-main` class and lives in the light DOM, so the
 * host stylesheet lays it out exactly like a native settings page.
 */
const HOST_CSS = `
.settings.yp-active > .settings-main:not(.yp-panel) {
  display: none;
}

.settings > .yp-panel {
  display: none;
}

.settings.yp-active > .yp-panel[data-yp-current] {
  display: block;
}
`;

interface SectionEntry {
  section: SettingsSection;
  /** The button inserted into Yapin's settings navigation. */
  button: HTMLButtonElement;
  /** The panel inserted next to Yapin's native settings panel. */
  panel: HTMLElement;
  /** Disposes the Solid root that renders the section's content. */
  disposeContent: () => void;
}

/**
 * Finds the settings modal root: a `.settings` element that still has both
 * a native navigation and a native panel (our own panels are excluded).
 */
function findSettingsRoot(): HTMLElement | null {
  for (const candidate of document.querySelectorAll<HTMLElement>(SETTINGS_SELECTOR)) {
    if (candidate.querySelector(NAV_SELECTOR) && candidate.querySelector(NATIVE_PANEL_SELECTOR)) {
      return candidate;
    }
  }

  return null;
}

function createEntry(section: SettingsSection): SectionEntry {
  // A plain button, so Yapin's own `.settings-nav button` rules style it.
  const button = document.createElement('button');
  button.type = 'button';
  button.setAttribute(SECTION_ATTRIBUTE, section.id);
  if (section.icon) button.append(createIcon(section.icon, { size: 24 }));

  const label = document.createElement('span');
  label.textContent = section.label;
  button.append(label);

  // The panel is a light-DOM sibling of the native panel and carries the
  // host `settings-main` class. Host CSS gives it the native padding and
  // scrolling; the section itself uses the host's `ss2-` page classes.
  const panel = document.createElement('section');
  panel.className = `settings-main ${PANEL_CLASS}`;
  panel.setAttribute('aria-label', section.label);
  const disposeContent = render(section.render, panel);

  return { section, button, panel, disposeContent };
}

/** Flattens the groups into the navigation elements, in visual order. */
function createNavElements(groups: SettingsGroup[]): {
  entries: SectionEntry[];
  navElements: HTMLElement[];
} {
  const entries: SectionEntry[] = [];
  const navElements: HTMLElement[] = [];

  for (const group of groups) {
    const heading = document.createElement('div');
    heading.className = NAV_LABEL_CLASS;
    heading.textContent = group.label;
    // Yapin separates later nav groups with this exact inline margin.
    heading.style.marginTop = '14px';
    navElements.push(heading);

    for (const section of group.sections) {
      const entry = createEntry(section);
      entries.push(entry);
      navElements.push(entry.button);
    }
  }

  return { entries, navElements };
}

/**
 * Registers the Yapmod groups and sections in Yapin's native settings
 * interface.
 *
 * The host owns the modal and recreates it whenever it is opened, so the
 * integration runs on three observers:
 *
 * - One on `document.body` (child list only) notices the modal appearing or
 *   disappearing. It is the only observer that outlives an open modal,
 *   because the host creates the modal lazily and gives no other signal.
 * - One on the settings root and one on its navigation run only while the
 *   modal is open: React may replace or drop our elements at any time, and
 *   it re-applies `.active` to its own nav entries while one of ours is
 *   selected.
 *
 * Everything created here is undone by a single cleanup registered on the
 * client: observers, listeners, Solid roots, injected elements and styles.
 */
export function installSettings(client: Client, groups: SettingsGroup[]): void {
  if (groups.length === 0) return;

  const { entries, navElements } = createNavElements(groups);

  let root: HTMLElement | null = null;
  let nav: HTMLElement | null = null;
  let activeId: string | null = null;
  let bodyObserver: MutationObserver | null = null;
  let rootObserver: MutationObserver | null = null;
  let navObserver: MutationObserver | null = null;

  function findEntry(id: string | null): SectionEntry | undefined {
    return id ? entries.find((entry) => entry.section.id === id) : undefined;
  }

  /** Puts the nav elements back where they belong. React may drop them. */
  function mountNav(): void {
    if (!nav) return;

    // `reference` is the element each of our elements must FOLLOW: we fill
    // the spot right after the Shards button, or the end of the nav when
    // Yapin has none. Skip over our own elements, so the anchor is never
    // one of them (inserting an element before itself queues records
    // without moving anything, and the check would never accept that
    // state). Walking backwards keeps our elements consecutive, and moving
    // only what is actually out of place keeps the observer quiet: every
    // insertion this performs has to be a change the next check accepts,
    // or the two retrigger each other forever.
    let anchor: Element | null =
      nav.querySelector<HTMLElement>(':scope > button:has(.shard-icon)')?.nextElementSibling ??
      null;
    while (anchor && navElements.includes(anchor as HTMLElement)) {
      anchor = anchor.nextElementSibling;
    }

    let reference: Element | null = anchor;
    for (let index = navElements.length - 1; index >= 0; index -= 1) {
      const element = navElements[index];
      if (!element) continue;

      if (element.parentElement !== nav || element.nextElementSibling !== reference) {
        nav.insertBefore(element, reference);
      }
      reference = element;
    }
  }

  /** Puts the section panels back into the settings root. React may drop them. */
  function mountPanels(): void {
    if (!root) return;

    for (const { panel } of entries) {
      if (panel.parentElement !== root) root.append(panel);
    }
  }

  function activate(id: string): void {
    const entry = findEntry(id);
    if (!entry || !root || activeId === id) return;

    activeId = id;
    root.classList.add(ACTIVE_CLASS);

    for (const candidate of entries) {
      const current = candidate === entry;
      candidate.button.classList.toggle('active', current);
      candidate.panel.toggleAttribute(CURRENT_ATTRIBUTE, current);
    }

    // Yapin tracks its own selected section in React state. Drop the
    // highlight from the entry we took over so only one entry looks
    // selected, even though the host still believes it is on its own.
    for (const button of nav?.querySelectorAll<HTMLElement>('button.active') ?? []) {
      if (button !== entry.button) button.classList.remove('active');
    }
  }

  function deactivate(): void {
    if (!activeId || !root) return;

    activeId = null;
    root.classList.remove(ACTIVE_CLASS);

    for (const { button, panel } of entries) {
      button.classList.remove('active');
      panel.removeAttribute(CURRENT_ATTRIBUTE);
    }
  }

  function handleNavClick(event: Event): void {
    const button = (event.target as Element | null)?.closest<HTMLElement>('button');
    if (!button || !nav?.contains(button)) return;

    const id = button.getAttribute(SECTION_ATTRIBUTE);

    if (id) {
      // Our entry is outside React's tree; keep its click out of Yapin's
      // routing so the host does not navigate away behind our back.
      event.preventDefault();
      event.stopPropagation();
      activate(id);
      return;
    }

    // A native entry was clicked: hand the settings view back to the host.
    deactivate();
  }

  function observeNav(element: HTMLElement): void {
    navObserver = new MutationObserver(() => {
      if (!nav) return;

      // React may drop our entries; put them back.
      mountNav();

      const active = findEntry(activeId);
      if (!active) return;

      // Keep exactly one entry highlighted. The whole nav is reconciled
      // instead of only the changed buttons: a nav React just recreated
      // arrives with its own `.active` classes already in place, which
      // never produces a record for us to react to. Every write here fixes
      // a state the next pass accepts, so the observer settles instead of
      // retriggering itself forever.
      for (const button of nav.querySelectorAll('button')) {
        const shouldBeActive = button === active.button;
        const isActive = button.classList.contains('active');

        if (shouldBeActive && !isActive) {
          button.classList.add('active');
        } else if (!shouldBeActive && isActive) {
          button.classList.remove('active');
        }
      }
    });

    navObserver.observe(element, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  function observeRoot(element: HTMLElement): void {
    rootObserver = new MutationObserver(() => {
      if (!root) return;

      // React may replace the navigation; rebind before putting entries back.
      const currentNav = root.querySelector<HTMLElement>(NAV_SELECTOR);
      if (currentNav && currentNav !== nav) {
        nav?.removeEventListener('click', handleNavClick);
        navObserver?.disconnect();
        nav = currentNav;
        nav.addEventListener('click', handleNavClick);
        observeNav(nav);
        mountNav();
      }

      mountPanels();
    });

    rootObserver.observe(element, { childList: true });
  }

  function attach(element: HTMLElement): void {
    const navElement = element.querySelector<HTMLElement>(NAV_SELECTOR);
    if (!navElement) return;

    root = element;
    nav = navElement;
    nav.addEventListener('click', handleNavClick);

    mountPanels();
    mountNav();
    observeRoot(element);
    observeNav(navElement);
  }

  function detach(): void {
    if (!root) return;

    deactivate();

    rootObserver?.disconnect();
    rootObserver = null;
    navObserver?.disconnect();
    navObserver = null;
    nav?.removeEventListener('click', handleNavClick);

    root = null;
    nav = null;
  }

  /** Re-attaches to the settings modal, or detaches when it is closed. */
  function sync(): void {
    const found = findSettingsRoot();
    if (found === root) return;

    detach();
    if (found) attach(found);
  }

  function onDomReady(): void {
    bodyObserver?.observe(document.body, { childList: true });
  }

  function armBodyObserver(): void {
    bodyObserver = new MutationObserver(sync);

    if (document.body) {
      // The modal is a React portal: it is appended to (and removed from)
      // the body each time it opens, which is the only signal we get.
      bodyObserver.observe(document.body, { childList: true });
    } else {
      document.addEventListener('DOMContentLoaded', onDomReady, { once: true });
    }
  }

  function teardown(): void {
    document.removeEventListener('DOMContentLoaded', onDomReady);
    bodyObserver?.disconnect();
    bodyObserver = null;

    detach();

    for (const element of navElements) element.remove();
    for (const entry of entries) {
      entry.disposeContent();
      entry.panel.remove();
    }

    removeStyle(STYLE_ID);
  }

  injectStyle(STYLE_ID, HOST_CSS);
  sync(); // the settings modal may already be open
  armBodyObserver(); // ...or it may open later
  client.onDispose(teardown);
}
