import { LogoMarquee } from '@/components/ui/LogoMarquee';
import { RevealWords } from '@/components/ui/Reveal';
import { moreBrandsCount } from '@/lib/content';
import type { Client } from '@/lib/types';

/** Clients (PRD §5.6). */
export function Clients({ clients }: { clients: Client[] }) {
  return (
    <section id="clients" aria-labelledby="clients-title" className="relative border-y border-line/40 bg-ink py-phi-6 lg:py-phi-7">
      <div className="container-site mb-phi-5 flex flex-col items-center gap-phi-2 text-center">
        <p className="type-label text-muted">(05)</p>
        <RevealWords text="Collaborated With" id="clients-title" className="type-h2 text-gold" />
      </div>
      <LogoMarquee clients={clients} />
      <p className="mt-phi-5 text-center text-[13px] text-paper/70">+ {moreBrandsCount} more brands</p>
    </section>
  );
}
