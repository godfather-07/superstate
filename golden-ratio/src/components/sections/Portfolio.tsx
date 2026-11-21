import { ProjectCard } from '@/components/ui/Card';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Reveal } from '@/components/ui/Reveal';
import type { Project } from '@/lib/types';

/**
 * The Work (PRD §5.2). Oversized "The Work" set at 10% gold, clipped by the
 * viewport edge, over a two-column masonry: the second column starts lower
 * so the cards stagger like a gallery wall. Single column on mobile.
 */
export function Portfolio({ projects }: { projects: Project[] }) {
  const left = projects.filter((_, i) => i % 2 === 0);
  const right = projects.filter((_, i) => i % 2 === 1);

  return (
    <section id="work" aria-labelledby="work-title" className="relative overflow-hidden bg-ink section-pad">
      <p
        aria-hidden="true"
        className="pointer-events-none -ml-[0.06em] select-none whitespace-nowrap font-serif text-[clamp(120px,22vw,340px)] font-medium leading-[0.8] text-gold opacity-10"
      >
        The Work
      </p>

      <div className="container-site relative -mt-[clamp(40px,7vw,110px)]">
        <div className="mb-phi-6 flex flex-col justify-between gap-phi-4 lg:flex-row lg:items-end">
          <SectionHeading index="01" label="The Work" title="Selected work. Built to last." id="work-title" />
          <Reveal className="max-w-[40ch] text-paper-2">
            <p>Identity, packaging and campaigns for founders who would rather be remembered than noticed.</p>
          </Reveal>
        </div>

        {/* Mobile / tablet: in order. Tablet shows two columns (PRD §11.3). */}
        <div className="grid gap-phi-4 sm:grid-cols-2 lg:hidden">
          {projects.map((p, i) => (
            <ProjectCard key={p.slug} project={p} index={i} />
          ))}
        </div>

        {/* Desktop: staggered masonry */}
        <div className="hidden gap-phi-5 lg:grid lg:grid-cols-2">
          <div className="flex flex-col gap-phi-6">
            {left.map((p) => (
              <ProjectCard key={p.slug} project={p} index={projects.indexOf(p)} />
            ))}
          </div>
          <div className="flex flex-col gap-phi-6 pt-phi-7">
            {right.map((p) => (
              <ProjectCard key={p.slug} project={p} index={projects.indexOf(p)} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
