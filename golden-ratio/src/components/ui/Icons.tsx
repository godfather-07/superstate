'use client';

import { motion } from 'framer-motion';
import { spiralGeometry } from './GoldenSpiral';
import { EASE_EXPO } from '@/lib/animations';

/**
 * Line icons in the language of Renaissance drafting instruments (PRD §6.4):
 * 1.5px gold stroke, geometric, minimal. When `animate` is set, strokes draw
 * themselves when the icon scrolls into view.
 */

export type IconName = 'compass' | 'spiral' | 'quill' | 'ear' | 'spiral-out' | 'spiral-loop';

const paths: Record<IconName, string[]> = {
  compass: [
    'M32 6v5', // handle
    'M32 11a4 4 0 1 1 0 8a4 4 0 1 1 0-8', // hinge
    'M30 19L16 56', // left leg
    'M34 19l14 37', // right leg
    'M20.5 44a24 24 0 0 0 23 0', // drawn arc
    'M14 58l2-2', // needle tip
  ],
  spiral: [spiralGeometry.SPIRAL],
  quill: [
    'M52 8C34 12 22 26 16 50', // shaft
    'M52 8c-2 14-10 26-24 32', // vane outer
    'M52 8c-8 4-16 12-22 22', // barbs
    'M40 18l-8 2', 'M36 26l-9 1', 'M32 33l-8 0',
    'M16 50l-4 8', // nib
    'M8 58h20', // ink line
  ],
  ear: [
    'M22 40c-4-4-6-9-6-14a16 16 0 0 1 32 0c0 8-6 11-9 15s-3 10-9 10c-4 0-6-3-6-6',
    'M26 27a6 6 0 0 1 12 0c0 4-4 5-4 9',
  ],
  'spiral-out': [spiralGeometry.SPIRAL, 'M150 6l10-6', 'M152 18l12-2', 'M146 -4l4-10'],
  'spiral-loop': [spiralGeometry.SPIRAL_FROM_CENTER, spiralGeometry.SQUARES],
};

const viewBoxes: Partial<Record<IconName, string>> = {
  spiral: spiralGeometry.VIEWBOX,
  'spiral-out': '-4 -16 172 120',
  'spiral-loop': spiralGeometry.VIEWBOX,
};

export function Icon({
  name,
  className,
  animate = false,
  delay = 0,
}: {
  name: IconName;
  className?: string;
  animate?: boolean;
  delay?: number;
}) {
  const viewBox = viewBoxes[name] ?? '0 0 64 64';
  // Stroke widths are in viewBox units (non-scaling strokes break pathLength
  // animation in Chrome). The spiral's viewBox is ~2.6× wider than 64.
  const strokeWidth = viewBox === '0 0 64 64' ? 1.5 : 2.8;
  return (
    <svg viewBox={viewBox} className={className} fill="none" stroke="currentColor" strokeWidth={strokeWidth} aria-hidden="true">
      {paths[name].map((d, i) =>
        animate ? (
          <motion.path
            key={i}
            d={d}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={name === 'spiral-loop' && i === 1 ? 0.35 : 1}
            initial={{ pathLength: 0, opacity: 0 }}
            whileInView={{ pathLength: 1, opacity: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 1.6, delay: delay + i * 0.12, ease: EASE_EXPO }}
          />
        ) : (
          <path
            key={i}
            d={d}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity={name === 'spiral-loop' && i === 1 ? 0.35 : 1}
          />
        ),
      )}
    </svg>
  );
}

/* Small UI glyphs ---------------------------------------------------- */

export function ArrowDown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.25} aria-hidden="true">
      <path d="M8 2v12M3 9l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function ArrowRight({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.25} aria-hidden="true">
      <path d="M2 8h12M9 3l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Chevron({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.25} aria-hidden="true">
      <path d="M3 6l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth={1.25} aria-hidden="true">
      <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
    </svg>
  );
}

export function SocialIcon({ name, className }: { name: 'Instagram' | 'LinkedIn' | 'X' | 'Behance'; className?: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {name === 'Instagram' && (
        <g {...common}>
          <rect x="4" y="4" width="16" height="16" rx="4.5" />
          <circle cx="12" cy="12" r="3.6" />
          <circle cx="16.8" cy="7.2" r="0.6" fill="currentColor" />
        </g>
      )}
      {name === 'LinkedIn' && (
        <g {...common}>
          <path d="M6.5 10v8M6.5 6.5v.01" />
          <path d="M10.5 18v-8M10.5 13.5c0-2 1.3-3.5 3.2-3.5s2.8 1.3 2.8 3.4V18" />
        </g>
      )}
      {name === 'X' && (
        <g {...common}>
          <path d="M5 5l14 14M19 5l-5.6 6.2M10.6 12.8L5 19" />
        </g>
      )}
      {name === 'Behance' && (
        <g {...common}>
          <path d="M4 7h4.2a2.3 2.3 0 0 1 0 4.6H4V7zM4 11.6h4.8a2.7 2.7 0 0 1 0 5.4H4v-5.4z" />
          <path d="M14 13.6h6c0-2-1.3-3.6-3-3.6s-3 1.6-3 3.5 1.3 3.5 3.1 3.5c1.2 0 2.2-.6 2.7-1.5M15 7.5h4" />
        </g>
      )}
    </svg>
  );
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.4} aria-hidden="true">
      <path
        d="M4.5 19.5l1.1-3.9A8 8 0 1 1 8.6 18.5l-4.1 1z"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 8.6c.2-.4.5-.4.7-.4h.5c.2 0 .4 0 .5.4l.6 1.5c.1.2 0 .4-.1.6l-.5.6c-.1.1-.1.3 0 .5.6 1 1.4 1.8 2.4 2.3.2.1.4.1.5-.1l.6-.7c.2-.2.4-.2.6-.1l1.4.7c.2.1.3.3.3.5 0 .6-.3 1.2-.8 1.5-.6.3-1.4.4-2.4 0-2.2-.8-4-2.6-4.8-4.7-.3-1-.2-1.9.5-2.6z"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
}
