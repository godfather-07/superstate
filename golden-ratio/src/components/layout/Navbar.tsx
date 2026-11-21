'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TransitionLink } from './PageTransition';
import { SoundToggle } from './SoundToggle';
import { Logo } from '@/components/ui/GoldenSpiral';
import { buttonClasses } from '@/components/ui/Button';
import { EASE_EXPO } from '@/lib/animations';
import { navLinks, site } from '@/lib/site';
import { cn } from '@/lib/utils';

/**
 * Fixed navbar (PRD §4): transparent over the hero, solid once the page
 * scrolls. Desktop shows centred links; below 1024px a hamburger opens a
 * full-screen menu with a staggered reveal.
 */
export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Highlight the section currently in view (home page only).
  useEffect(() => {
    if (!isHome) return setActive(null);
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => e.isIntersecting && setActive(e.target.id));
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    document.querySelectorAll('main section[id]').forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [isHome]);

  // Lock scroll + close on Escape while the mobile menu is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => setOpen(false), [pathname]);

  const solid = scrolled || !isHome || open;

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-[80px] transition-[background-color,border-color,backdrop-filter] duration-500',
        solid && !open ? 'border-b border-line/40 bg-ink/85 backdrop-blur-md' : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="container-site flex h-full items-center justify-between gap-phi-2" aria-label="Main">
        <TransitionLink href="/#top" aria-label="Golden Ratio — home" className="relative z-[61] shrink-0" data-cursor="Home">
          <Logo markId="nav-logo-mark" />
        </TransitionLink>

        <ul className="hidden items-center gap-phi-5 lg:flex">
          {navLinks.map((link) => {
            const id = link.href.split('#')[1];
            return (
              <li key={link.href}>
                <TransitionLink
                  href={link.href}
                  className={cn(
                    'type-label link-draw !text-[12px] transition-colors',
                    active === id ? '!text-gold' : '!text-paper/80 hover:!text-gold',
                  )}
                  aria-current={active === id ? 'true' : undefined}
                >
                  {link.label}
                </TransitionLink>
              </li>
            );
          })}
        </ul>

        <div className="flex shrink-0 items-center gap-1 sm:gap-phi-2">
          {/* Wrapper does the hiding: buttonClasses sets its own display. */}
          <span className="hidden sm:block">
            <TransitionLink
              href="/#contact"
              className={buttonClasses('primary', '!px-[21px] !py-[10px] !text-[12px]')}
              data-track="nav_book_call"
              data-cursor="Book"
            >
              Book a Call
            </TransitionLink>
          </span>
          <SoundToggle />
          <button
            type="button"
            className="relative z-[61] flex h-10 w-10 flex-col items-end justify-center gap-[7px] lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            <motion.span className="block h-px w-7 bg-gold" animate={open ? { rotate: 45, y: 4, width: 26 } : { rotate: 0, y: 0, width: 28 }} />
            <motion.span className="block h-px w-5 bg-gold" animate={open ? { rotate: -45, y: -4, width: 26 } : { rotate: 0, y: 0, width: 20 }} />
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            className="fixed inset-0 z-[60] flex flex-col bg-ink lg:hidden"
            initial={{ clipPath: 'inset(0 0 100% 0)' }}
            animate={{ clipPath: 'inset(0 0 0% 0)' }}
            exit={{ clipPath: 'inset(0 0 100% 0)' }}
            transition={{ duration: 0.7, ease: EASE_EXPO }}
          >
            <div className="container-site flex flex-1 flex-col justify-center gap-phi-5 pt-[80px]">
              <ul className="flex flex-col gap-phi-3">
                {navLinks.map((link, i) => (
                  <motion.li
                    key={link.href}
                    initial={{ opacity: 0, y: 34 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.2 + i * 0.07, duration: 0.8, ease: EASE_EXPO }}
                  >
                    <TransitionLink
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className="flex items-baseline gap-phi-3 font-serif text-[44px] leading-none text-paper sm:text-[56px]"
                    >
                      <span className="font-mono text-[12px] text-gold">{String(i + 1).padStart(2, '0')}</span>
                      {link.label}
                    </TransitionLink>
                  </motion.li>
                ))}
              </ul>
              <motion.div
                className="flex flex-col gap-phi-3 border-t border-line pt-phi-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.55, duration: 0.6 }}
              >
                <TransitionLink href="/#contact" onClick={() => setOpen(false)} className={buttonClasses('primary', 'self-start')} data-track="menu_book_call">
                  Book a Call
                </TransitionLink>
                <a href={`mailto:${site.email}`} className="type-label text-muted">
                  {site.email}
                </a>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
