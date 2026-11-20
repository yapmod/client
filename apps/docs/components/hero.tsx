'use client';

import type { PointerEvent, ReactNode } from 'react';

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

export function PixelHero({ children }: { children: ReactNode }) {
  return (
    <section className="pixel-hero" onPointerMove={lightPixels}>
      {children}
    </section>
  );
}
