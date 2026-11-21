'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/utils';

/**
 * Optional ambient sound (PRD §4, §7.5). Off by default. Rather than ship an
 * audio file, a quiet drone is synthesised with the Web Audio API: an open
 * fifth on A with a slow breathing swell, filtered warm. Zero bytes to load.
 */
class AmbientDrone {
  private ctx: AudioContext;
  private master: GainNode;
  private nodes: AudioScheduledSourceNode[] = [];

  constructor() {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.Q.value = 0.4;
    filter.connect(this.master);
    this.master.connect(this.ctx.destination);

    const voices: [number, number, OscillatorType][] = [
      [110, 0.3, 'sine'],
      [164.81, 0.18, 'sine'],
      [220, 0.12, 'triangle'],
      [329.63, 0.05, 'sine'],
    ];
    voices.forEach(([freq, level, type], i) => {
      const osc = this.ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = freq;
      osc.detune.value = (i % 2 ? 1 : -1) * 4;
      const gain = this.ctx.createGain();
      gain.gain.value = level;
      // Slow swell — each voice breathes at its own rate.
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.05 + i * 0.023;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = level * 0.6;
      lfo.connect(lfoGain).connect(gain.gain);
      osc.connect(gain).connect(filter);
      osc.start();
      lfo.start();
      this.nodes.push(osc, lfo);
    });
  }

  async fadeTo(on: boolean) {
    if (on && this.ctx.state === 'suspended') await this.ctx.resume();
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(on ? 0.06 : 0, now + (on ? 2.5 : 0.8));
    if (!on) window.setTimeout(() => this.ctx.state === 'running' && this.ctx.suspend(), 900);
  }
}

export function SoundToggle({ className }: { className?: string }) {
  const [on, setOn] = useState(false);
  const drone = useRef<AmbientDrone | null>(null);

  useEffect(() => {
    const pause = () => document.hidden && drone.current?.fadeTo(false);
    const resume = () => !document.hidden && on && drone.current?.fadeTo(true);
    const handler = () => (document.hidden ? pause() : resume());
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [on]);

  const toggle = () => {
    const next = !on;
    if (!drone.current) drone.current = new AmbientDrone();
    drone.current.fadeTo(next);
    setOn(next);
    track('sound_toggle', { state: next ? 'on' : 'off' });
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? 'Turn ambient sound off' : 'Turn ambient sound on'}
      data-cursor={on ? 'Mute' : 'Play'}
      className={className ?? 'flex h-10 w-10 items-center justify-center text-gold transition-colors hover:text-gold-light'}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 9.5h3l4.5-4v13l-4.5-4H4z" />
        <motion.path d="M15 9.5a3.5 3.5 0 0 1 0 5" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: 0.4 }} />
        <motion.path d="M17.5 7a7 7 0 0 1 0 10" initial={false} animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }} transition={{ duration: 0.5, delay: on ? 0.1 : 0 }} />
        <motion.path d="M15.5 10l4 4M19.5 10l-4 4" initial={false} animate={{ pathLength: on ? 0 : 1, opacity: on ? 0 : 1 }} transition={{ duration: 0.3 }} />
      </svg>
    </button>
  );
}
