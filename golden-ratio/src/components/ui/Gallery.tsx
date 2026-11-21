'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CloseIcon } from './Icons';
import { Media } from './Placeholder';
import { RevealImage } from './Reveal';
import { EASE_EXPO } from '@/lib/animations';
import type { ImageAsset } from '@/lib/types';
import { cn, pad } from '@/lib/utils';

/** Case-study gallery: 2–3 column grid with a keyboard-friendly lightbox (PRD §5.10). */
export function Gallery({ images }: { images: ImageAsset[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const lastTrigger = useRef<HTMLButtonElement | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const count = images.length;

  const close = useCallback(() => {
    setOpen(null);
    lastTrigger.current?.focus();
  }, []);
  const step = useCallback((d: number) => setOpen((i) => (i === null ? i : (i + d + count) % count)), [count]);

  useEffect(() => {
    if (open === null) return;
    closeBtn.current?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, close, step]);

  return (
    <>
      <ul className="grid gap-phi-3 sm:grid-cols-2 lg:grid-cols-3">
        {images.map((img, i) => (
          <li key={i} className={cn(i % 5 === 0 && 'sm:col-span-2 lg:col-span-2')}>
            <button
              type="button"
              className="group block w-full overflow-hidden text-left"
              onClick={(e) => {
                lastTrigger.current = e.currentTarget;
                setOpen(i);
              }}
              aria-label={`Open image: ${img.alt}`}
              data-cursor="View"
            >
              <RevealImage className={i % 5 === 0 ? 'aspect-[16/9]' : 'aspect-[4/5]'}>
                <div className="h-full w-full transition-transform duration-700 ease-expo group-hover:scale-[1.03]">
                  <Media asset={img} sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" />
                </div>
              </RevealImage>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Image ${open + 1} of ${count}: ${images[open].alt}`}
            className="fixed inset-0 z-[95] flex flex-col bg-ink/95 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="container-site flex h-[80px] shrink-0 items-center justify-between">
              <p className="font-mono text-[13px] tracking-[0.2em] text-paper/80">
                <span className="text-gold">{pad(open + 1)}</span> / {pad(count)}
              </p>
              <button ref={closeBtn} type="button" onClick={close} aria-label="Close gallery" className="flex h-11 w-11 items-center justify-center text-gold">
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-phi-3 pb-phi-5" onClick={close}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={open}
                  className="aspect-[4/3] max-h-full w-full max-w-[1100px]"
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: EASE_EXPO }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Media asset={images[open]} sizes="100vw" />
                </motion.div>
              </AnimatePresence>
              <LightboxArrow dir="prev" onClick={() => step(-1)} />
              <LightboxArrow dir="next" onClick={() => step(1)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function LightboxArrow({ dir, onClick }: { dir: 'prev' | 'next'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={dir === 'prev' ? 'Previous image' : 'Next image'}
      className={cn(
        'absolute top-1/2 flex h-[55px] w-[55px] -translate-y-1/2 items-center justify-center border border-gold/50 bg-ink/70 text-gold transition-colors hover:bg-gold hover:text-ink',
        dir === 'prev' ? 'left-phi-2 sm:left-phi-4' : 'right-phi-2 sm:right-phi-4',
      )}
    >
      <svg viewBox="0 0 16 16" className={cn('h-4 w-4', dir === 'prev' && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth={1.25} aria-hidden="true">
        <path d="M2 8h12M9 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
