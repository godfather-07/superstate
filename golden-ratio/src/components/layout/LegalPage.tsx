import type { ReactNode } from 'react';
import { TransitionLink } from './PageTransition';

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <article className="bg-ink pb-phi-7 pt-[160px]">
      <div className="container-site">
        <TransitionLink href="/" className="type-label link-draw">
          ← Golden Ratio
        </TransitionLink>
        <h1 className="type-h2 mt-phi-5 text-gold">{title}</h1>
        <p className="type-label mt-phi-3 text-muted">Last updated {updated}</p>
        <div className="prose-gr mt-phi-4">{children}</div>
      </div>
    </article>
  );
}
