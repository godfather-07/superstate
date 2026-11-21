'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

/**
 * GSAP scroll configuration (PRD §7). GSAP drives everything that is tied to
 * scroll position — parallax, the pinned process pipeline, the rendering
 * counter. Framer Motion handles entrance reveals, route transitions and
 * layout animation.
 */

let registered = false;

export function registerGsap() {
  if (registered || typeof window === 'undefined') return { gsap, ScrollTrigger };
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'expo.out', duration: 1 });
  registered = true;
  return { gsap, ScrollTrigger };
}

/** Default ease from the PRD: cubic-bezier(0.16, 1, 0.3, 1). */
export const EASE_EXPO = [0.16, 1, 0.3, 1] as const;

export const DURATION = { reveal: 1, hover: 0.3 } as const;

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function isTouchDevice() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

/**
 * Parallax: an element that scrolls at `speed`× page speed. 0.9 lags slightly
 * behind the page (foreground images); 0.5 lags a lot (background layers).
 * Disabled for reduced motion and on touch devices (PRD §11.2).
 */
export function parallax(target: Element, speed: number, trigger: Element = target) {
  if (prefersReducedMotion() || isTouchDevice()) return;
  const { gsap } = registerGsap();
  const distance = () => (1 - speed) * window.innerHeight;
  return gsap.fromTo(
    target,
    { y: () => -distance() / 2 },
    {
      y: () => distance() / 2,
      ease: 'none',
      scrollTrigger: { trigger, start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true },
    },
  );
}
