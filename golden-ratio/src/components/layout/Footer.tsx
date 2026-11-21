import { TransitionLink } from './PageTransition';
import { Logo } from '@/components/ui/GoldenSpiral';
import { SocialIcon } from '@/components/ui/Icons';
import { navLinks, site } from '@/lib/site';

/** PRD §5.9 — minimal, charcoal, everything one tap away. */
export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line/50 bg-ink-2">
      <div className="container-site grid gap-phi-5 py-phi-6 lg:grid-cols-3 lg:items-center">
        <div className="flex flex-col gap-phi-2">
          <TransitionLink href="/#top" aria-label="Golden Ratio — back to top">
            <Logo />
          </TransitionLink>
          <p className="font-serif text-[20px] italic text-paper-2">{site.tagline}</p>
        </div>

        <nav aria-label="Footer">
          <ul className="flex flex-wrap gap-x-phi-4 gap-y-phi-2 lg:justify-center">
            {navLinks.map((link) => (
              <li key={link.href}>
                <TransitionLink href={link.href} className="type-label link-draw !text-paper/80 hover:!text-gold">
                  {link.label}
                </TransitionLink>
              </li>
            ))}
          </ul>
        </nav>

        <ul className="flex gap-phi-2 lg:justify-end" aria-label="Social media">
          {site.socials.map((s) => (
            <li key={s.name}>
              <a
                href={s.url || '#'}
                target={s.url ? '_blank' : undefined}
                rel={s.url ? 'noopener noreferrer' : undefined}
                aria-label={s.url ? `Golden Ratio on ${s.name}` : `${s.name} — coming soon`}
                aria-disabled={!s.url || undefined}
                title={s.url ? undefined : 'Coming soon'}
                className="flex h-[44px] w-[44px] items-center justify-center rounded-full border border-gold/60 text-gold transition-colors duration-300 hover:bg-gold hover:text-ink aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                <SocialIcon name={s.name} className="h-[18px] w-[18px]" />
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className="border-t border-line/30">
        <div className="container-site flex flex-col gap-phi-1 py-phi-3 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {site.legalName}. All rights reserved.
          </p>
          <p className="flex gap-phi-3">
            <TransitionLink href="/privacy" className="hover:text-gold">
              Privacy
            </TransitionLink>
            <TransitionLink href="/terms" className="hover:text-gold">
              Terms
            </TransitionLink>
            <a href={`mailto:${site.email}`} className="hover:text-gold">
              {site.email}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
