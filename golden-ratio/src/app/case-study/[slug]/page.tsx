import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { TransitionLink } from '@/components/layout/PageTransition';
import { buttonClasses } from '@/components/ui/Button';
import { Gallery } from '@/components/ui/Gallery';
import { ArrowRight } from '@/components/ui/Icons';
import { JsonLd } from '@/components/ui/JsonLd';
import { Media } from '@/components/ui/Placeholder';
import { Reveal, RevealWords } from '@/components/ui/Reveal';
import { getProjects } from '@/lib/sanity';
import { breadcrumbSchema } from '@/lib/structured-data';
import { site } from '@/lib/site';

export const revalidate = 60;

type Params = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  const projects = await getProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const project = (await getProjects()).find((p) => p.slug === slug);
  if (!project) return {};
  const title = `${project.name} — ${project.category}`;
  return {
    title,
    description: project.summary,
    alternates: { canonical: `/case-study/${project.slug}` },
    openGraph: { type: 'article', url: `/case-study/${project.slug}`, title: `${title} | ${site.name}`, description: project.summary },
    twitter: { card: 'summary_large_image', title: `${title} | ${site.name}`, description: project.summary },
  };
}

export default async function CaseStudyPage({ params }: Params) {
  const { slug } = await params;
  const projects = await getProjects();
  const index = projects.findIndex((p) => p.slug === slug);
  if (index === -1) notFound();
  const project = projects[index];
  const next = projects[(index + 1) % projects.length];

  return (
    <article className="bg-ink">
      <JsonLd data={breadcrumbSchema(project)} />

      {/* Hero */}
      <header className="relative flex min-h-[88svh] items-end overflow-hidden">
        <div className="absolute inset-0">
          <Media asset={project.hero} sizes="100vw" priority />
        </div>
        <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(transparent_30%,rgba(10,10,10,0.92))]" />
        <div className="container-site relative pb-phi-6 pt-[160px]">
          <TransitionLink href="/#work" className="type-label link-draw mb-phi-5 inline-block">
            ← All Work
          </TransitionLink>
          <p className="type-label mb-phi-3 text-paper/80">
            {project.category} <span className="text-gold">·</span> {project.year}
          </p>
          <RevealWords as="h1" text={project.name} className="font-serif text-[clamp(44px,6vw,72px)] font-semibold leading-none text-gold" />
          <p className="mt-phi-3 max-w-[52ch] text-[17px] text-paper-2">{project.summary}</p>
        </div>
      </header>

      {/* Facts */}
      <div className="border-y border-line/50">
        <dl className="container-site grid gap-phi-4 py-phi-5 sm:grid-cols-3">
          <div>
            <dt className="type-label text-muted">Client</dt>
            <dd className="mt-phi-1 font-serif text-[22px] text-paper">{project.name}</dd>
          </div>
          <div>
            <dt className="type-label text-muted">Services</dt>
            <dd className="mt-phi-1 text-paper-2">{project.services.join(', ')}</dd>
          </div>
          <div>
            <dt className="type-label text-muted">Year</dt>
            <dd className="mt-phi-1 text-paper-2">{project.year}</dd>
          </div>
        </dl>
      </div>

      <CaseSection index="01" title="The Challenge" paragraphs={project.challenge} />
      <CaseSection index="02" title="The Approach" paragraphs={project.approach} />

      <section aria-labelledby="the-work" className="section-pad !pt-0">
        <div className="container-site">
          <SectionLabel index="03" id="the-work" title="The Work" />
          <Gallery images={project.gallery} />
        </div>
      </section>

      <section aria-labelledby="the-results" className="border-t border-line/50 bg-ink-2 section-pad">
        <div className="container-site">
          <SectionLabel index="04" id="the-results" title="The Results" />
          <ul className="grid gap-phi-5 sm:grid-cols-3">
            {project.results.map((r, i) => (
              <Reveal as="li" key={i} delay={i * 0.1} className="border-t border-line pt-phi-4">
                <p className="font-serif text-[clamp(56px,7vw,104px)] font-semibold leading-none text-gold">{r.value}</p>
                <p className="type-label mt-phi-3 text-paper-2">{r.label}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Next project */}
      <nav aria-label="Next project" className="border-t border-line/50">
        <TransitionLink href={`/case-study/${next.slug}`} className="group block" data-cursor="Next">
          <div className="container-site flex flex-col gap-phi-3 py-phi-6 sm:flex-row sm:items-end sm:justify-between lg:py-phi-7">
            <div>
              <p className="type-label text-muted">Next Project</p>
              <p className="mt-phi-2 font-serif text-[clamp(40px,6vw,96px)] font-medium leading-none text-paper transition-colors duration-500 group-hover:text-gold">
                {next.name}
              </p>
            </div>
            <span className="type-label inline-flex items-center gap-phi-2 text-gold">
              Next Project <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </div>
        </TransitionLink>
      </nav>

      <div className="container-site flex flex-col items-start gap-phi-3 pb-phi-6 sm:flex-row sm:items-center sm:justify-between">
        <TransitionLink href="/#work" className="type-label link-draw">
          ← All Work
        </TransitionLink>
        <TransitionLink href="/#contact" className={buttonClasses('primary')} data-track="case_study_book_call" data-cursor="Book">
          Start a project
        </TransitionLink>
      </div>
    </article>
  );
}

function SectionLabel({ index, id, title }: { index: string; id: string; title: string }) {
  return (
    <div className="mb-phi-5 flex items-center gap-phi-3">
      <span className="font-mono text-[12px] text-muted">({index})</span>
      <h2 id={id} className="type-h2 text-gold">
        {title}
      </h2>
    </div>
  );
}

function CaseSection({ index, title, paragraphs }: { index: string; title: string; paragraphs: string[] }) {
  const id = title.toLowerCase().replace(/\s+/g, '-');
  return (
    <section aria-labelledby={id} className="section-pad">
      <div className="container-site grid gap-phi-4 lg:grid-cols-[1fr_1.618fr]">
        <SectionLabel index={index} id={id} title={title} />
        <div className="flex max-w-[60ch] flex-col gap-phi-3 text-[17px] text-paper-2">
          {paragraphs.map((p, i) => (
            <Reveal key={i} delay={i * 0.08}>
              <p>{p}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
