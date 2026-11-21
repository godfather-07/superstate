'use client';

import { motion } from 'framer-motion';
import NextLink from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
} from 'react';
import { EASE_EXPO, prefersReducedMotion } from '@/lib/animations';

/**
 * Route transitions (PRD §7.4).
 * Into a case study: a black panel wipes in from the left, the route changes
 * underneath it, then it wipes off to the right and the new page fades in.
 * Back to the main page: the same, mirrored (right → left).
 * Same-page anchors (/#work while on /) smooth-scroll instead.
 */

type Phase = 'idle' | 'cover' | 'reveal';
type Direction = 'ltr' | 'rtl';

type TransitionApi = { navigate: (href: string) => void; phase: Phase };

const TransitionContext = createContext<TransitionApi>({ navigate: () => {}, phase: 'idle' });

export const useTransitionRouter = () => useContext(TransitionContext);

export function scrollToHash(hash: string, behavior: ScrollBehavior = 'smooth') {
  const id = decodeURIComponent(hash.replace(/^#/, ''));
  if (!id) return window.scrollTo({ top: 0, behavior });
  const el = document.getElementById(id);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - 80; // fixed header offset
  window.scrollTo({ top, behavior: prefersReducedMotion() ? 'auto' : behavior });
}

const WIPE = 0.6;

export function TransitionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>('idle');
  const [direction, setDirection] = useState<Direction>('ltr');
  const pending = useRef<{ href: string; pathname: string; hash: string } | null>(null);
  const safety = useRef<number | undefined>(undefined);

  const navigate = useCallback(
    (href: string) => {
      const url = new URL(href, window.location.href);
      if (url.origin !== window.location.origin) {
        window.location.href = href;
        return;
      }
      // Same page: just scroll.
      if (url.pathname === window.location.pathname) {
        if (url.hash) {
          history.replaceState(null, '', url.hash);
          scrollToHash(url.hash);
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
      if (prefersReducedMotion()) {
        router.push(url.pathname + url.hash, { scroll: !url.hash });
        if (url.hash) pending.current = { href, pathname: url.pathname, hash: url.hash };
        return;
      }
      pending.current = { href: url.pathname + url.search + url.hash, pathname: url.pathname, hash: url.hash };
      setDirection(url.pathname.startsWith('/case-study') ? 'ltr' : 'rtl');
      setPhase('cover');
      router.prefetch(url.pathname);
    },
    [router],
  );

  // Panel fully covers the screen → change route underneath it.
  const onCovered = () => {
    if (phase !== 'cover' || !pending.current) return;
    router.push(pending.current.href, { scroll: false });
    window.clearTimeout(safety.current);
    safety.current = window.setTimeout(() => setPhase('reveal'), 8000);
  };

  // Route changed → position the new page, then wipe the panel away.
  useEffect(() => {
    const target = pending.current;
    if (!target || target.pathname !== pathname) return;
    pending.current = null;
    window.clearTimeout(safety.current);
    requestAnimationFrame(() => {
      if (target.hash) scrollToHash(target.hash, 'instant');
      else window.scrollTo({ top: 0, behavior: 'instant' });
      setPhase((p) => (p === 'cover' ? 'reveal' : p));
    });
  }, [pathname]);

  const covering = phase === 'cover';
  const originX = covering ? (direction === 'ltr' ? 0 : 1) : direction === 'ltr' ? 1 : 0;

  return (
    <TransitionContext.Provider value={{ navigate, phase }}>
      {children}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[90] bg-ink"
        style={{ originX, pointerEvents: phase === 'idle' ? 'none' : 'auto' }}
        initial={false}
        animate={{ scaleX: covering ? 1 : 0 }}
        transition={{ duration: phase === 'idle' ? 0 : WIPE, ease: [0.76, 0, 0.24, 1] }}
        onAnimationComplete={() => {
          if (phase === 'cover') onCovered();
          else if (phase === 'reveal') setPhase('idle');
        }}
      >
        <span className="absolute inset-y-0 w-px bg-gold/60" style={{ [direction === 'ltr' ? 'right' : 'left']: 0 }} />
      </motion.div>
    </TransitionContext.Provider>
  );
}

/** Wraps page content so it fades in as the wipe leaves. Keep the navbar outside it. */
export function TransitionContent({ children }: { children: ReactNode }) {
  const { phase } = useTransitionRouter();
  const covering = phase === 'cover';
  return (
    <motion.div
      initial={false}
      animate={{ opacity: covering ? 0 : 1 }}
      transition={{ duration: covering ? 0 : 0.9, ease: EASE_EXPO, delay: covering ? WIPE : 0.15 }}
    >
      {children}
    </motion.div>
  );
}

type LinkProps = Omit<ComponentPropsWithoutRef<typeof NextLink>, 'href'> & { href: string; children: ReactNode };

/** A Link that plays the page transition. Modified clicks (new tab etc.) behave normally. */
export function TransitionLink({ href, onClick, children, ...rest }: LinkProps) {
  const { navigate } = useTransitionRouter();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };
  return (
    <NextLink href={href} onClick={handle} scroll={false} {...rest}>
      {children}
    </NextLink>
  );
}
