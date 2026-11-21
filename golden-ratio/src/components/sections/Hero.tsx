'use client';

import { motion, type Variants } from 'framer-motion';
import { useEffect, useRef } from 'react';
import { useIntroPhase } from '@/components/layout/Intro';
import { TransitionLink } from '@/components/layout/PageTransition';
import { buttonClasses } from '@/components/ui/Button';
import { GoldenSpiral } from '@/components/ui/GoldenSpiral';
import { ArrowDown } from '@/components/ui/Icons';
import { EASE_EXPO, prefersReducedMotion } from '@/lib/animations';
import { hero } from '@/lib/copy';

/**
 * Hero (PRD §5.1). The headline is painted at full opacity under the intro
 * loader — good for LCP — then hidden the instant the loader starts to leave
 * and revealed word by word as the black field fades.
 */
const word: Variants = {
  rest: { y: '0%' },
  hidden: { y: '110%', transition: { duration: 0 } },
  show: (i: number) => ({ y: '0%', transition: { duration: 1.2, ease: EASE_EXPO, delay: 0.45 + i * 0.07 } }),
};

const fade: Variants = {
  rest: { opacity: 1, y: 0 },
  hidden: { opacity: 0, y: 21, transition: { duration: 0 } },
  show: (delay: number) => ({ opacity: 1, y: 0, transition: { duration: 1, ease: EASE_EXPO, delay } }),
};

export function Hero() {
  const phase = useIntroPhase();
  const state = phase === 'leaving' ? 'hidden' : phase === 'done' ? 'show' : 'rest';
  const words = hero.headline.split(' ');

  return (
    <section id="top" aria-labelledby="hero-title" className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink">
      {/* Background: slow golden spiral wireframe at 10% opacity + gold dust */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute left-1/2 top-1/2 w-[160vmax] max-w-none -translate-x-1/2 -translate-y-1/2 text-gold opacity-10 lg:w-[120vmax]"
          animate={{ rotate: 360 }}
          transition={{ duration: 240, repeat: Infinity, ease: 'linear' }}
        >
          <GoldenSpiral withSquares strokeWidth={1} />
        </motion.div>
        <GoldDust />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#0a0a0a_80%)]" />
      </div>

      <div className="container-site relative flex flex-col items-center text-center">
        <motion.p className="type-label mb-phi-4 text-muted" variants={fade} initial="rest" animate={state} custom={0.3}>
          (Studio) — Bengaluru, India
        </motion.p>

        <h1 id="hero-title" aria-label={hero.headline} className="type-display max-w-[15ch] text-gold">
          {words.map((w, i) => (
            <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.1em] align-bottom">
              <motion.span className="inline-block" variants={word} initial="rest" animate={state} custom={i}>
                {w}
              </motion.span>
              {i < words.length - 1 && ' '}
            </span>
          ))}
        </h1>

        <motion.p
          className="mt-phi-4 flex flex-col items-center justify-center gap-y-phi-1 font-sans text-[12px] uppercase tracking-[0.3em] text-paper sm:flex-row sm:gap-x-phi-2 sm:text-[14px]"
          style={{ fontVariant: 'small-caps' }}
          variants={fade}
          initial="rest"
          animate={state}
          custom={0.9}
        >
          {hero.subline.map((s, i) => (
            <span key={s} className="flex items-center gap-x-phi-2">
              {i > 0 && <span aria-hidden="true" className="hidden text-gold sm:inline">|</span>}
              {s}
            </span>
          ))}
        </motion.p>

        <motion.div className="mt-phi-5" variants={fade} initial="rest" animate={state} custom={1.1}>
          <TransitionLink href="/#work" className={buttonClasses('primary')} data-track="hero_see_work" data-cursor="View">
            {hero.cta}
            <ArrowDown className="h-4 w-4 transition-transform duration-300 group-hover:translate-y-0.5" />
          </TransitionLink>
        </motion.div>
      </div>

      {/* Editorial corner labels */}
      <motion.div
        aria-hidden="true"
        className="type-label absolute inset-x-0 bottom-phi-4 hidden text-muted sm:block"
        variants={fade}
        initial="rest"
        animate={state}
        custom={1.3}
      >
        <div className="container-site flex items-end justify-between">
          <span className="font-mono tracking-[0.12em]">12.9716° N, 77.5946° E</span>
          <span className="flex flex-col items-center gap-phi-1">
            Scroll
            <motion.span
              className="block h-[34px] w-px origin-top bg-gold"
              animate={{ scaleY: [0, 1, 0], originY: [0, 0, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            />
          </span>
          <span className="font-mono tracking-[0.12em] sm:mr-[72px]">φ = 1.618</span>
        </div>
      </motion.div>
    </section>
  );
}

/** Drifting gold dust on a canvas. Pauses off-screen; absent for reduced motion. */
function GoldDust() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || prefersReducedMotion()) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let raf = 0;
    let running = true;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const count = window.innerWidth < 640 ? 34 : 70;

    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; t: number };
    let particles: P[] = [];

    const resize = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: 0.4 + Math.random() * 1.4,
        vy: -(0.05 + Math.random() * 0.22),
        vx: (Math.random() - 0.5) * 0.08,
        a: 0.15 + Math.random() * 0.55,
        t: Math.random() * Math.PI * 2,
      }));
    };

    const tick = () => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.y += p.vy;
        p.x += p.vx;
        p.t += 0.012;
        if (p.y < -4) {
          p.y = height + 4;
          p.x = Math.random() * width;
        }
        ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(p.t));
        ctx.fillStyle = '#C8A95E';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };

    resize();
    tick();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      running = entry.isIntersecting;
      cancelAnimationFrame(raf);
      if (running) tick();
    });
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
    };
  }, []);

  return <canvas ref={ref} className="absolute inset-0 h-full w-full" />;
}
