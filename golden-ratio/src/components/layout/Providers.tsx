'use client';

import { MotionConfig } from 'framer-motion';
import type { ReactNode } from 'react';
import { IntroProvider } from './Intro';
import { TransitionProvider } from './PageTransition';

/** Client-side providers. MotionConfig honours prefers-reduced-motion everywhere. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user" transition={{ ease: [0.16, 1, 0.3, 1] }}>
      <TransitionProvider>
        <IntroProvider>{children}</IntroProvider>
      </TransitionProvider>
    </MotionConfig>
  );
}
