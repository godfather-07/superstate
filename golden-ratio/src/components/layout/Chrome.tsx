'use client';

import { motion, useScroll, useSpring } from 'framer-motion';
import { WhatsAppIcon } from '@/components/ui/Icons';
import { site } from '@/lib/site';

/** Thin gold line along the left edge that fills as the page scrolls (PRD §7.2). */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 30, restDelta: 0.001 });
  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-40 h-full w-[2px] bg-gold/10">
      <motion.div className="h-full w-full origin-top bg-gold" style={{ scaleY }} />
    </div>
  );
}

/** Floating WhatsApp button, bottom-right (PRD §12). */
export function WhatsAppButton() {
  return (
    <a
      href={site.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Golden Ratio on WhatsApp"
      data-cursor="Chat"
      data-track="whatsapp"
      className="fixed bottom-phi-3 right-phi-3 z-40 flex h-[52px] w-[52px] items-center justify-center rounded-full border border-gold/70 bg-ink/80 text-gold backdrop-blur-sm transition-colors duration-300 hover:bg-gold hover:text-ink sm:bottom-phi-4 sm:right-phi-4"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  );
}
