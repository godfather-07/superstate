'use client';

import { animate, AnimatePresence, motion } from 'framer-motion';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { spiralGeometry } from '@/components/ui/GoldenSpiral';
import { EASE_EXPO } from '@/lib/animations';

/**
 * Intro sequence (PRD §5.1, §7.1). Plays once per browser session on the
 * home page: the golden spiral draws itself from its centre over three
 * seconds while a counter runs 000 → 100, then the spiral flies into the
 * navbar and becomes the logo mark. Click or press any key to skip.
 *
 * Whether it plays is decided before first paint by the inline script in the
 * root layout (it sets <html data-intro="pending" | "seen">), so returning
 * visitors and reduced-motion users never see a flash of the loader.
 */

export type IntroPhase = 'playing' | 'leaving' | 'done';

const IntroContext = createContext<IntroPhase>('playing');
export const useIntroPhase = () => useContext(IntroContext);

import { INTRO_STORAGE_KEY } from '@/lib/intro';
const DRAW_SECONDS = 3;

export function IntroProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<IntroPhase>('playing');
  const [mounted, setMounted] = useState(true);

  useEffect(() => {
    if (document.documentElement.dataset.intro !== 'pending') {
      setPhase('done');
      setMounted(false);
    }
  }, []);

  const finish = useCallback(() => {
    try {
      sessionStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch {}
    document.documentElement.dataset.intro = 'seen';
    setPhase('done');
    setMounted(false);
  }, []);

  return (
    <IntroContext.Provider value={phase}>
      {children}
      {mounted && <IntroLoader phase={phase} onLeave={() => setPhase('leaving')} onDone={finish} />}
    </IntroContext.Provider>
  );
}

function IntroLoader({ phase, onLeave, onDone }: { phase: IntroPhase; onLeave: () => void; onDone: () => void }) {
  const [count, setCount] = useState(0);
  const [flight, setFlight] = useState<{ x: number; y: number; scale: number } | null>(null);
  const spiralRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);
  const leaving = phase === 'leaving';

  const leave = useCallback(() => {
    if (started.current === false || leaving) return;
    // Measure where the navbar's logo mark sits and fly the spiral there.
    const target = document.getElementById('nav-logo-mark')?.getBoundingClientRect();
    const source = spiralRef.current?.getBoundingClientRect();
    if (target && source && source.width > 0) {
      setFlight({
        x: target.left + target.width / 2 - (source.left + source.width / 2),
        y: target.top + target.height / 2 - (source.top + source.height / 2),
        scale: target.width / source.width,
      });
    } else {
      setFlight({ x: 0, y: 0, scale: 0.2 });
    }
    setCount(100);
    onLeave();
  }, [leaving, onLeave]);

  // Start the draw + counter once we know the intro should play.
  useEffect(() => {
    if (document.documentElement.dataset.intro !== 'pending') return;
    started.current = true;
    const controls = animate(0, 100, {
      duration: DRAW_SECONDS,
      ease: [0.65, 0, 0.35, 1],
      onUpdate: (v) => setCount(Math.round(v)),
      onComplete: () => window.setTimeout(leave, 250),
    });
    return () => controls.stop();
  }, [leave]);

  // Skip on click / key press.
  useEffect(() => {
    const skip = () => leave();
    window.addEventListener('keydown', skip);
    return () => window.removeEventListener('keydown', skip);
  }, [leave]);

  return (
    <div
      id="intro-loader"
      className="fixed inset-0 z-[100] select-none"
      onClick={leave}
      role="presentation"
    >
      {/* Black field that fades to reveal the hero */}
      <motion.div
        className="absolute inset-0 bg-ink"
        initial={false}
        animate={{ opacity: leaving ? 0 : 1 }}
        transition={{ duration: 0.9, delay: leaving ? 0.35 : 0, ease: EASE_EXPO }}
        onAnimationComplete={() => leaving && onDone()}
      />

      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          ref={spiralRef}
          className="w-[min(64vw,440px)] text-gold"
          initial={false}
          animate={flight ? { x: flight.x, y: flight.y, scale: flight.scale } : { x: 0, y: 0, scale: 1 }}
          transition={{ duration: 1, ease: EASE_EXPO }}
        >
          <svg viewBox={spiralGeometry.VIEWBOX} fill="none" stroke="currentColor" className="overflow-visible" aria-hidden="true">
            <motion.path
              d={spiralGeometry.SQUARES}
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
              initial={{ opacity: 0 }}
              animate={{ opacity: leaving ? 0.45 : 0.18 }}
              transition={{ duration: 1.2, delay: leaving ? 0 : 0.6 }}
            />
            <motion.path
              d={spiralGeometry.SPIRAL_FROM_CENTER}
              // No non-scaling-stroke here: Chrome mis-measures dashes with it, which breaks pathLength.
              // 0.6 viewBox units ≈ 1.5px at the loader's size.
              strokeWidth={0.6}
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: leaving ? 1 : count / 100 }}
              transition={{ duration: leaving ? 0.3 : 0.12, ease: 'linear' }}
            />
          </svg>
        </motion.div>
      </div>

      <AnimatePresence>
        {!leaving && (
          <motion.div key="chrome" exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
            <p className="absolute bottom-phi-4 right-phi-4 font-mono text-[13px] tracking-[0.2em] text-gold tabular-nums sm:bottom-phi-5 sm:right-phi-5">
              {String(count).padStart(3, '0')}
            </p>
            <motion.p
              className="type-label absolute bottom-phi-4 left-1/2 -translate-x-1/2 text-muted sm:bottom-phi-5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
            >
              Click to skip
            </motion.p>
            <p className="type-label absolute left-phi-4 top-phi-4 text-paper/70 sm:left-phi-5 sm:top-phi-5">Golden Ratio</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
