'use client';

import type { PointerEvent, ReactNode } from 'react';
import { useState } from 'react';
import { FileCode2, Palette } from 'lucide-react';
import '../public/rose-grid.theme.css';

export function PixelHero({ children }: { children: ReactNode }) {
  function lightPixels(event: PointerEvent<HTMLElement>) {
    if (
      event.pointerType === 'touch' ||
      !globalThis.matchMedia('(hover: hover) and (prefers-reduced-motion: no-preference)').matches
    ) {
      return;
    }

    const hero = event.currentTarget;
    const bounds = hero.getBoundingClientRect();
    hero.style.setProperty('--pointer-x', `${event.clientX - bounds.left}px`);
    hero.style.setProperty('--pointer-y', `${event.clientY - bounds.top}px`);
  }

  return (
    <section className="pixel-hero" onPointerMove={lightPixels}>
      {children}
    </section>
  );
}

export function ThemePreview() {
  const [enabled, setEnabled] = useState(true);

  return (
    <figure className="theme-specimen">
      <figcaption className="mb-3 flex items-center gap-2 text-sm font-medium">
        <Palette size={16} aria-hidden="true" />
        Theme preview
      </figcaption>

      <div className={enabled ? 'yp-panel' : undefined}>
        <div className="ss2-card specimen-card">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="toggle-label font-heading text-3xl">Rose Grid</p>
              <p className="hint text-sm">by Yapmod</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-label="Apply Rose Grid to the preview"
              aria-checked={enabled}
              onClick={() => setEnabled(!enabled)}
              className="specimen-switch"
            >
              <span />
            </button>
          </div>
          <div className="mt-10 flex items-center gap-2 font-mono text-xs">
            <FileCode2 size={15} aria-hidden="true" />
            rose-grid.theme.css
          </div>
        </div>
      </div>
    </figure>
  );
}
