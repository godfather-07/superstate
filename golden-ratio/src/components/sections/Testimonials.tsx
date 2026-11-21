'use client';

import { motion, type PanInfo } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EASE_EXPO, prefersReducedMotion } from '@/lib/animations';
import type { Testimonial } from '@/lib/types';
import { cn, pad } from '@/lib/utils';

const ADVANCE_MS = 6000;

/**
 * Testimonials (PRD §5.7, §7.5). A horizontal carousel that advances every
 * six seconds with a progress bar under the active card. Pauses on hover,
 * focus, or when off-screen. Swipe on touch, arrow keys on desktop.
 */
export function Testimonials({ testimonials }: { testimonials: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  const [cycle, setCycle] = useState(0); // restarts the progress bar
  const count = testimonials.length;
  const firstCard = useRef<HTMLLIElement>(null);
  const [step, setStep] = useState(0);

  // Distance between slides = card width + 34px gap; re-measured on resize.
  useEffect(() => {
    const el = firstCard.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStep(el.offsetWidth + 34));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = useCallback(
    (next: number) => {
      setIndex(((next % count) + count) % count);
      setCycle((c) => c + 1);
    },
    [count],
  );

  const running = !paused && inView && !prefersReducedMotionSafe();

  useEffect(() => {
    if (!running) return;
    const t = window.setTimeout(() => go(index + 1), ADVANCE_MS);
    return () => window.clearTimeout(t);
  }, [running, index, cycle, go]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60 || info.velocity.x < -400) go(index + 1);
    else if (info.offset.x > 60 || info.velocity.x > 400) go(index - 1);
  };

  return (
    <motion.section
      id="testimonials"
      aria-roledescription="carousel"
      aria-labelledby="testimonials-title"
      className="relative overflow-hidden bg-ink section-pad"
      onViewportEnter={() => setInView(true)}
      onViewportLeave={() => setInView(false)}
      viewport={{ amount: 0.3 }}
    >
      <div className="container-site">
        <div className="mb-phi-5 flex items-end justify-between gap-phi-4">
          <SectionHeading index="06" label="Testimonials" title="In their words." id="testimonials-title" />
          <div className="hidden items-center gap-phi-3 sm:flex">
            <p className="font-mono text-[13px] tracking-[0.2em] text-paper/80 tabular-nums" aria-live="polite">
              <span className="text-gold">{pad(index + 1)}</span> / {pad(count)}
            </p>
            <div className="flex">
              <CarouselButton label="Previous testimonial" onClick={() => go(index - 1)} dir="prev" />
              <CarouselButton label="Next testimonial" onClick={() => go(index + 1)} dir="next" />
            </div>
          </div>
        </div>

        <div
          className="relative"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={() => setPaused(false)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight') go(index + 1);
            if (e.key === 'ArrowLeft') go(index - 1);
          }}
        >
          <motion.ul
            className="flex cursor-grab touch-pan-y gap-phi-4 active:cursor-grabbing"
            animate={{ x: -index * step }}
            transition={{ duration: 1, ease: EASE_EXPO }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.18}
            onDragEnd={onDragEnd}
            style={{ ['--card-w' as string]: 'min(100%, 760px)' }}
          >
            {testimonials.map((t, i) => (
              <li
                key={t.id}
                ref={i === 0 ? firstCard : undefined}
                aria-roledescription="slide"
                aria-label={`${i + 1} of ${count}`}
                aria-hidden={i !== index}
                className={cn(
                  'relative w-[var(--card-w)] shrink-0 border border-line/60 bg-ink-2 p-phi-4 transition-opacity duration-700 sm:p-phi-5',
                  i === index ? 'opacity-100' : 'opacity-35',
                )}
              >
                <span aria-hidden="true" className="block h-[60px] font-serif text-[120px] leading-none text-gold">
                  “
                </span>
                <blockquote className="mt-phi-2">
                  <p className="font-serif text-[20px] italic leading-[1.45] text-paper lg:text-[24px]">{t.quote}</p>
                  <footer className="mt-phi-4 text-[13px] text-gold">
                    <cite className="not-italic">
                      <span className="font-semibold">{t.name}</span>
                      <span className="text-gold/80">
                        {' '}
                        — {t.title}, {t.company}
                      </span>
                    </cite>
                  </footer>
                </blockquote>
                {/* Auto-advance progress */}
                <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-gold/15">
                  {i === index && (
                    <motion.div
                      key={cycle}
                      className="h-full origin-left bg-gold"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: running ? 1 : 0 }}
                      transition={{ duration: running ? ADVANCE_MS / 1000 : 0.3, ease: 'linear' }}
                    />
                  )}
                </div>
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Dots (mobile) */}
        <div className="mt-phi-4 flex items-center justify-center gap-phi-2 sm:hidden">
          {testimonials.map((t, i) => (
            <button
              key={t.id}
              type="button"
              aria-label={`Show testimonial ${i + 1}`}
              aria-current={i === index}
              onClick={() => go(i)}
              className="flex h-8 w-8 items-center justify-center"
            >
              <span className={cn('block h-[6px] rounded-full transition-all duration-300', i === index ? 'w-[21px] bg-gold' : 'w-[6px] bg-paper/30')} />
            </button>
          ))}
        </div>
      </div>
    </motion.section>
  );
}

function prefersReducedMotionSafe() {
  return typeof window !== 'undefined' && prefersReducedMotion();
}

function CarouselButton({ label, onClick, dir }: { label: string; onClick: () => void; dir: 'prev' | 'next' }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-[44px] w-[44px] items-center justify-center border border-gold/50 text-gold transition-colors duration-300 hover:bg-gold hover:text-ink [&+&]:-ml-px"
    >
      <svg viewBox="0 0 16 16" className={cn('h-4 w-4', dir === 'prev' && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth={1.25} aria-hidden="true">
        <path d="M2 8h12M9 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
