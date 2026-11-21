'use client';

import { motion, type Variants } from 'framer-motion';
import type { ElementType, ReactNode } from 'react';
import { EASE_EXPO } from '@/lib/animations';
import { cn } from '@/lib/utils';

/**
 * Scroll reveals (PRD §7.2), all triggered at 20% visibility.
 *  RevealWords — headline split into words, each rising with a 0.05s stagger
 *  Reveal      — a block that fades up
 *  RevealImage — clip-path wipe from the bottom with a 1.1 → 1.0 scale
 * Framer Motion's MotionConfig (reducedMotion="user") turns these into plain
 * fades for visitors who prefer reduced motion.
 */

const VIEWPORT = { once: true, amount: 0.2 } as const;

// motion.create() must run once per tag, never inside render.
// Typed as motion.div: the props we pass are common to every block element.
type MotionBlock = typeof motion.div;
const motionCache = new Map<ElementType, MotionBlock>();
function motionFor(tag: ElementType): MotionBlock {
  let component = motionCache.get(tag);
  if (!component) {
    component = (typeof tag === 'string' && tag in motion ? motion[tag as 'div'] : motion.create(tag)) as MotionBlock;
    motionCache.set(tag, component);
  }
  return component;
}

const wordVariants: Variants = {
  hidden: { y: '110%' },
  show: (i: number) => ({ y: '0%', transition: { duration: 1.1, ease: EASE_EXPO, delay: i * 0.05 } }),
};

type RevealWordsProps = {
  text: string;
  as?: ElementType;
  className?: string;
  /** Delay before the first word, in seconds. */
  delay?: number;
  /** Play immediately (or when it becomes true) instead of on scroll. */
  play?: boolean;
  id?: string;
};

export function RevealWords({ text, as: Tag = 'h2', className, delay = 0, play, id }: RevealWordsProps) {
  const words = text.split(' ');
  const MotionTag = motionFor(Tag);
  const trigger =
    play === undefined
      ? { initial: 'hidden', whileInView: 'show', viewport: VIEWPORT }
      : { initial: 'hidden', animate: play ? 'show' : 'hidden' };

  return (
    <MotionTag className={className} aria-label={text} id={id} {...trigger}>
      {words.map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] align-bottom">
          <motion.span className="inline-block will-change-transform" variants={wordVariants} custom={i + delay / 0.05}>
            {word}
          </motion.span>
          {i < words.length - 1 && ' '}
        </span>
      ))}
    </MotionTag>
  );
}

export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  y = 34,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: ElementType;
  y?: number;
}) {
  const MotionTag = motionFor(Tag);
  return (
    <MotionTag
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEWPORT}
      transition={{ duration: 1, ease: EASE_EXPO, delay }}
    >
      {children}
    </MotionTag>
  );
}

// The viewport trigger sits on an unclipped wrapper: Chromium's
// IntersectionObserver never reports an element hidden by its own clip-path.
const clipVariants: Variants = {
  hidden: { clipPath: 'inset(100% 0% 0% 0%)' },
  show: { clipPath: 'inset(0% 0% 0% 0%)', transition: { duration: 1.2, ease: EASE_EXPO } },
};
const scaleVariants: Variants = {
  hidden: { scale: 1.1 },
  show: { scale: 1, transition: { duration: 1.6, ease: EASE_EXPO } },
};

export function RevealImage({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={cn('relative', className)} initial="hidden" whileInView="show" viewport={VIEWPORT}>
      <motion.div className="absolute inset-0 overflow-hidden" variants={clipVariants}>
        <motion.div className="h-full w-full" variants={scaleVariants}>
          {children}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
