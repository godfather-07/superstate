'use client';

import { useGSAP } from '@gsap/react';
import { useRef, useState, type MouseEvent } from 'react';
import { TransitionLink } from '@/components/layout/PageTransition';
import { ArrowRight } from './Icons';
import { Media } from './Placeholder';
import { RevealImage } from './Reveal';
import { isTouchDevice, parallax, registerGsap } from '@/lib/animations';
import type { Project } from '@/lib/types';
import { cn } from '@/lib/utils';

registerGsap();

/**
 * Portfolio card (PRD §5.2, §6.4, §7.3). Sharp corners, full-bleed image,
 * gradient overlay. Hover: image scales to 1.03, overlay darkens, title and
 * CTA slide up. The image drifts at 0.9× scroll speed. On touch screens the
 * first tap reveals the project info and the second opens the case study.
 */
export function ProjectCard({ project, index }: { project: Project; index: number }) {
  const root = useRef<HTMLDivElement>(null);
  const media = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useGSAP(() => {
    if (media.current && root.current) parallax(media.current, 0.9, root.current);
  }, []);

  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isTouchDevice() && !revealed) {
      e.preventDefault();
      setRevealed(true);
    }
  };

  return (
    <div ref={root}>
      <TransitionLink
        href={`/case-study/${project.slug}`}
        onClick={onClick}
        onBlur={() => setRevealed(false)}
        data-cursor="View"
        aria-label={`${project.name} — ${project.category}. View project`}
        className={cn('group relative block overflow-hidden bg-ink-3', revealed && 'is-revealed')}
      >
        <RevealImage className={project.orientation === 'portrait' ? 'aspect-[4/5]' : 'aspect-[16/9]'}>
          <div className="h-full w-full overflow-hidden">
            <div ref={media} className="h-[112%] w-full -translate-y-[6%]">
              <div className="h-full w-full transition-transform duration-700 ease-expo group-hover:scale-[1.03] group-[.is-revealed]:scale-[1.03]">
                <Media asset={project.hero} sizes="(min-width: 1024px) 45vw, 100vw" />
              </div>
            </div>
          </div>
        </RevealImage>

        {/* Overlay: linear-gradient(transparent 40%, rgba(0,0,0,0.8)), darkening on hover */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_40%,rgba(0,0,0,0.8))] transition-colors duration-500 group-hover:bg-black/45 group-[.is-revealed]:bg-black/45"
        />

        <div className="pointer-events-none absolute left-phi-3 top-phi-3 font-mono text-[12px] text-gold/80">
          {String(index + 1).padStart(2, '0')}
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-phi-1 p-phi-3 sm:p-phi-4">
          <span className="type-label text-paper/90" style={{ fontVariant: 'small-caps' }}>
            {project.category}
          </span>
          <h3 className="type-h3 text-gold">{project.name}</h3>
          <div className="grid grid-rows-[0fr] transition-[grid-template-rows] duration-500 ease-expo group-hover:grid-rows-[1fr] group-focus-visible:grid-rows-[1fr] group-[.is-revealed]:grid-rows-[1fr]">
            <div className="overflow-hidden">
              <p className="max-w-[44ch] pt-phi-1 text-[14px] text-paper-2">{project.summary}</p>
              <span className="type-label mt-phi-2 inline-flex items-center gap-phi-1 text-gold">
                View Project <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>
        </div>
      </TransitionLink>
    </div>
  );
}
