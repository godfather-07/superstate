'use client';

import { useGSAP } from '@gsap/react';
import { useRef } from 'react';
import { Icon } from '@/components/ui/Icons';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { prefersReducedMotion, registerGsap } from '@/lib/animations';
import { process } from '@/lib/copy';

const { gsap, ScrollTrigger } = registerGsap();

/**
 * Process (PRD §5.5). Desktop: the section pins and the five steps travel
 * horizontally as you scroll, like a production pipeline, with a
 * "Rendering 0%" counter and progress rule. Mobile and tablet: a vertical
 * stepper with the same counter, each step revealing on scroll.
 */
export function Process() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLDivElement>(null);
  const counter = useRef<HTMLSpanElement>(null);

  // Written straight to the DOM: no React re-render on every scroll frame.
  const render = (progress: number) => {
    if (counter.current) counter.current.textContent = String(Math.round(progress * 100)).padStart(3, '\u2007');
    if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
  };

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      const reduced = prefersReducedMotion();

      mm.add('(min-width: 1024px)', () => {
        const el = track.current;
        if (!el || !section.current) return;
        const distance = () => el.scrollWidth - window.innerWidth;
        const tween = gsap.to(el, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: section.current,
            start: 'top top',
            end: () => `+=${distance()}`,
            pin: true,
            scrub: reduced ? true : 0.6,
            invalidateOnRefresh: true,
            anticipatePin: 1,
            onUpdate: (self) => render(self.progress),
          },
        });
        return () => tween.kill();
      });

      mm.add('(max-width: 1023px)', () => {
        const st = ScrollTrigger.create({
          trigger: track.current,
          start: 'top 70%',
          end: 'bottom 60%',
          onUpdate: (self) => render(self.progress),
        });
        return () => st.kill();
      });

      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <section ref={section} id="process" aria-labelledby="process-title" className="relative overflow-hidden bg-ink lg:h-[100svh]">
      <div className="flex h-full flex-col">
        <div className="container-site flex flex-col gap-phi-4 pt-phi-6 lg:flex-row lg:items-end lg:justify-between lg:pt-[120px]">
          <SectionHeading index="04" label="Process" title="How the work is made." id="process-title" />
          <div>
            <p className="font-mono text-[13px] tracking-[0.2em] text-gold" aria-live="off">
              RENDERING <span ref={counter} className="tabular-nums">{'\u2007\u20070'}</span>%
            </p>
            <div className="mt-phi-1 h-px w-full bg-gold/20 lg:w-[233px]">
              <div ref={bar} className="h-full w-full origin-left scale-x-0 bg-gold" />
            </div>
          </div>
        </div>

        <div className="flex flex-1 items-center">
          <div
            ref={track}
            className="flex flex-col gap-0 px-[21px] pb-phi-6 pt-phi-4 sm:px-phi-4 lg:flex-row lg:gap-0 lg:px-phi-5 lg:pb-0 lg:pt-0 lg:will-change-transform"
          >
            {process.map((step, i) => (
              <article
                key={step.id}
                className="relative flex gap-phi-3 border-l border-line pb-phi-5 pl-phi-4 last:pb-0 lg:w-[38vw] lg:min-w-[440px] lg:flex-col lg:border-l-0 lg:border-t lg:pb-0 lg:pl-0 lg:pr-phi-5 lg:pt-phi-4"
              >
                {/* Node on the pipeline */}
                <span aria-hidden="true" className="absolute -left-[5px] top-0 h-[9px] w-[9px] rotate-45 border border-gold bg-ink lg:-top-[5px] lg:left-0" />
                <div className="flex flex-col gap-phi-3">
                  <div className="flex items-center gap-phi-3">
                    <span className="font-mono text-[12px] text-muted">{String(i + 1).padStart(2, '0')} / 05</span>
                    <Icon
                      name={step.icon}
                      animate
                      className={step.icon.startsWith('spiral') ? 'h-[34px] w-[55px] text-gold' : 'h-[40px] w-[40px] text-gold'}
                    />
                  </div>
                  <h3 className="font-serif text-[clamp(40px,4.5vw,72px)] font-medium leading-none text-gold">{step.name}</h3>
                  <p className="font-serif text-[22px] italic text-paper">{step.line}</p>
                  <p className="max-w-[36ch] text-paper-2">{step.description}</p>
                </div>
              </article>
            ))}
            <div aria-hidden="true" className="hidden w-[20vw] shrink-0 lg:block" />
          </div>
        </div>
      </div>
    </section>
  );
}
