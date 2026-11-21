'use client';

import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useState } from 'react';

/**
 * Custom cursor (PRD §7.3): a 12px gold dot with a 40px trailing ring. Over
 * interactive elements the ring grows to 60px and can carry a label taken
 * from the element's data-cursor attribute ("View", "Play", "Book").
 * Only on devices with a fine pointer that can hover; touch keeps native
 * feedback. Containers marked data-cursor="hide" (the Calendly iframe) hand
 * control back to the native cursor.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [label, setLabel] = useState('');
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 380, damping: 32, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 380, damping: 32, mass: 0.6 });

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    document.documentElement.classList.add('has-custom-cursor');

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
    };
    const over = (e: PointerEvent) => {
      const target = e.target as Element | null;
      if (target?.closest('[data-cursor="hide"]')) {
        setVisible(false);
        return;
      }
      const interactive = target?.closest('a, button, [role="button"], [data-cursor], input, select, textarea, label, summary');
      setHovering(Boolean(interactive));
      setLabel(interactive?.getAttribute('data-cursor') ?? '');
    };
    const leave = () => setVisible(false);
    const down = () => setPressed(true);
    const up = () => setPressed(false);

    window.addEventListener('pointermove', move, { passive: true });
    document.addEventListener('pointerover', over, { passive: true });
    document.documentElement.addEventListener('pointerleave', leave);
    window.addEventListener('blur', leave);
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    return () => {
      document.documentElement.classList.remove('has-custom-cursor');
      window.removeEventListener('pointermove', move);
      document.removeEventListener('pointerover', over);
      document.documentElement.removeEventListener('pointerleave', leave);
      window.removeEventListener('blur', leave);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  const ringSize = label ? 72 : hovering ? 60 : 40;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[120]" style={{ opacity: visible ? 1 : 0, transition: 'opacity .2s' }}>
      <motion.div
        className="absolute left-0 top-0 flex items-center justify-center rounded-full border border-gold"
        style={{ x: ringX, y: ringY, translateX: '-50%', translateY: '-50%' }}
        animate={{
          width: ringSize,
          height: ringSize,
          backgroundColor: label ? 'rgba(200,169,94,0.92)' : 'rgba(200,169,94,0)',
          scale: pressed ? 0.85 : 1,
        }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      >
        {label && <span className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-ink">{label}</span>}
      </motion.div>
      <motion.div
        className="absolute left-0 top-0 h-3 w-3 rounded-full bg-gold"
        style={{ x, y, translateX: '-50%', translateY: '-50%' }}
        animate={{ scale: hovering ? 0.5 : 1, opacity: label ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      />
    </div>
  );
}
