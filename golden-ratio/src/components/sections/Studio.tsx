import { Media } from '@/components/ui/Placeholder';
import { Reveal, RevealImage, RevealWords } from '@/components/ui/Reveal';
import { studio } from '@/lib/copy';
import { site } from '@/lib/site';

/** The Studio (PRD §5.4). Split screen: portrait left, philosophy right. */
export function Studio() {
  return (
    <section id="studio" aria-labelledby="studio-title" className="relative bg-ink-2">
      <div className="grid sm:grid-cols-[2fr_3fr] lg:grid-cols-2">
        <RevealImage className="aspect-[4/5] sm:aspect-auto sm:min-h-[640px]">
          <Media
            asset={{
              alt: `${site.founder.name}, ${site.founder.title} of Golden Ratio`,
              placeholder: 'George Alias — editorial portrait, Renaissance chiaroscuro, single window light',
            }}
            sizes="(min-width: 1024px) 50vw, (min-width: 640px) 40vw, 100vw"
          />
        </RevealImage>

        <div className="flex flex-col justify-center gap-phi-4 px-[21px] py-phi-6 sm:px-phi-5 lg:px-phi-6 lg:py-phi-7 xl:px-phi-7">
          <p className="type-label flex items-center gap-phi-2 text-gold">
            <span className="font-mono tracking-normal text-muted">(03)</span>
            <span aria-hidden="true" className="h-px w-[34px] bg-gold/60" />
            {studio.label}
          </p>
          <RevealWords text={studio.headline} id="studio-title" className="type-h2 text-gold" />

          <div className="flex max-w-[52ch] flex-col gap-phi-2 text-paper-2">
            {studio.body.map((p, i) => (
              <Reveal key={i} delay={i * 0.08}>
                <p>{p}</p>
              </Reveal>
            ))}
          </div>

          <Reveal className="mt-phi-2 border-t border-line pt-phi-4">
            <p className="font-serif text-[24px] font-semibold text-gold">
              {site.founder.name} — {site.founder.title}
            </p>
            <p className="mt-phi-2 max-w-[52ch] text-[15px] text-paper-2">{studio.bio}</p>
          </Reveal>

          <Reveal as="blockquote" className="mt-phi-3">
            <p className="font-serif text-[clamp(28px,3.2vw,44px)] italic leading-[1.15] text-paper">
              <span className="text-gold">“</span>
              {studio.quote}
              <span className="text-gold">”</span>
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
