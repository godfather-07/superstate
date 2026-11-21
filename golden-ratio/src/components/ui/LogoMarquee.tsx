import Image from 'next/image';
import type { Client } from '@/lib/types';

/**
 * Auto-scrolling client logo strip (PRD §5.6). Monochrome white at 40%
 * opacity, full on hover; 40px tall (28px on mobile). The list is rendered
 * twice so the loop is seamless; the copy is hidden from assistive tech.
 * Pauses on hover; reduced-motion users get a static row.
 */
export function LogoMarquee({ clients }: { clients: Client[] }) {
  const row = (copy: boolean) => (
    <ul className="flex shrink-0 items-center gap-phi-6 pr-phi-6" aria-hidden={copy || undefined}>
      {clients.map((c, i) => (
        <li key={`${c.id}-${copy}`} className="flex h-[28px] items-center opacity-40 transition-opacity duration-300 hover:opacity-100 sm:h-[40px]">
          {c.logo ? (
            <Image src={c.logo} alt={copy ? '' : c.name} width={160} height={40} className="h-full w-auto" />
          ) : (
            <PlaceholderLogo name={c.name} variant={i % 3} />
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <div className="group relative flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_10%,#000_90%,transparent)]">
      <div className="flex w-max animate-marquee group-hover:[animation-play-state:paused]">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/** Stand-in wordmark until the real SVG logo is supplied. */
function PlaceholderLogo({ name, variant }: { name: string; variant: number }) {
  const styles = [
    'font-serif text-[22px] italic sm:text-[30px]',
    'font-sans text-[13px] font-semibold uppercase tracking-[0.32em] sm:text-[16px]',
    'font-serif text-[20px] font-semibold uppercase tracking-[0.12em] sm:text-[26px]',
  ];
  return <span className={`whitespace-nowrap text-paper ${styles[variant]}`}>{name}</span>;
}
