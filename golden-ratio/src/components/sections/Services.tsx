'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Chevron, Icon } from '@/components/ui/Icons';
import { Reveal } from '@/components/ui/Reveal';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { EASE_EXPO } from '@/lib/animations';
import { services } from '@/lib/copy';
import { cn } from '@/lib/utils';

/**
 * Services (PRD §5.3). Three pillars divided by thin gold rules.
 * Desktop: the service list rises in, item by item, on hover or focus.
 * Tablet: two columns, the third spanning below. Mobile: an accordion.
 */
export function Services() {
  const [desktop, setDesktop] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 640px)');
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  return (
    <section id="services" aria-labelledby="services-title" className="relative bg-ink section-pad">
      <div className="container-site">
        <SectionHeading index="02" label="Services" title="Three disciplines. One proportion." id="services-title" className="mb-phi-6" />

        <div className="grid border-t border-line sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s, i) => {
            const isOpen = desktop ? hovered === s.id : open === s.id;
            return (
              <Reveal
                key={s.id}
                delay={i * 0.12}
                className={cn(
                  'border-b border-line sm:py-phi-5',
                  'sm:[&:nth-child(odd)]:pr-phi-4 sm:[&:nth-child(even)]:border-l sm:[&:nth-child(even)]:pl-phi-4',
                  'sm:[&:nth-child(3)]:col-span-2 lg:[&:nth-child(3)]:col-span-1 lg:[&:nth-child(3)]:border-l lg:[&:nth-child(3)]:pl-phi-4',
                  'lg:[&:nth-child(1)]:pr-phi-4 lg:[&:nth-child(2)]:px-phi-4',
                )}
              >
                <article
                  className="group flex h-full flex-col"
                  onMouseEnter={() => desktop && setHovered(s.id)}
                  onMouseLeave={() => desktop && setHovered(null)}
                  onFocus={() => desktop && setHovered(s.id)}
                  onBlur={(e) => desktop && !e.currentTarget.contains(e.relatedTarget) && setHovered(null)}
                  tabIndex={desktop ? 0 : undefined}
                  aria-labelledby={`svc-${s.id}`}
                >
                  <button
                    type="button"
                    className="flex w-full items-center gap-phi-3 py-phi-4 text-left sm:pointer-events-none sm:flex-col sm:items-start sm:py-0"
                    onClick={() => !desktop && setOpen(isOpen ? null : s.id)}
                    aria-expanded={isOpen}
                    aria-controls={`svc-list-${s.id}`}
                    tabIndex={desktop ? -1 : 0}
                  >
                    <span className="flex w-[55px] shrink-0 justify-start sm:w-auto">
                      <Icon
                        name={s.icon}
                        animate
                        delay={0.2 + i * 0.15}
                        className={cn('text-gold', s.icon === 'spiral' ? 'h-[34px] w-[55px] sm:h-[55px] sm:w-[89px]' : 'h-[34px] w-[34px] sm:h-[55px] sm:w-[55px]')}
                      />
                    </span>
                    <h3 id={`svc-${s.id}`} className="type-h3 flex-1 text-gold sm:mt-phi-4">
                      {s.name}
                    </h3>
                    <Chevron className={cn('h-4 w-4 text-gold transition-transform duration-300 sm:hidden', isOpen && 'rotate-180')} />
                  </button>

                  <p className="hidden text-paper-2 sm:mt-phi-3 sm:block">{s.description}</p>

                  {/* Desktop: list reserved in layout, items fade in on hover. Mobile: accordion. */}
                  {desktop ? (
                    <ul id={`svc-list-${s.id}`} className="mt-phi-4 flex flex-col border-t border-line/50 pt-phi-3" aria-label={`${s.name} services`}>
                      {s.items.map((item, j) => (
                        <motion.li
                          key={item}
                          className="type-label flex items-center gap-phi-2 py-[7px] text-paper/90"
                          initial={false}
                          animate={{ opacity: isOpen ? 1 : 0.28, x: isOpen ? 0 : -8 }}
                          transition={{ duration: 0.5, ease: EASE_EXPO, delay: isOpen ? j * 0.06 : 0 }}
                        >
                          <span className="font-mono text-[10px] tracking-normal text-gold">{String(j + 1).padStart(2, '0')}</span>
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  ) : (
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          id={`svc-list-${s.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.5, ease: EASE_EXPO }}
                          className="overflow-hidden"
                        >
                          <p className="text-paper-2">{s.description}</p>
                          <ul className="mt-phi-3 flex flex-col pb-phi-4" aria-label={`${s.name} services`}>
                            {s.items.map((item, j) => (
                              <motion.li
                                key={item}
                                className="type-label flex items-center gap-phi-2 border-t border-line/40 py-[10px] text-paper/90"
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + j * 0.05, duration: 0.4 }}
                              >
                                <span className="font-mono text-[10px] tracking-normal text-gold">{String(j + 1).padStart(2, '0')}</span>
                                {item}
                              </motion.li>
                            ))}
                          </ul>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </article>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
