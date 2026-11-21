import { TransitionLink } from '@/components/layout/PageTransition';
import { buttonClasses } from '@/components/ui/Button';
import { GoldenSpiral } from '@/components/ui/GoldenSpiral';

export default function NotFound() {
  return (
    <section className="relative flex min-h-[100svh] items-center overflow-hidden bg-ink">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 w-[130vmax] -translate-x-1/2 -translate-y-1/2 text-gold opacity-[0.07]">
        <GoldenSpiral withSquares strokeWidth={1} />
      </div>
      <div className="container-site relative flex flex-col items-center gap-phi-4 text-center">
        <p className="font-mono text-[13px] tracking-[0.3em] text-muted">404</p>
        <h1 className="type-display text-gold">This room is empty.</h1>
        <p className="max-w-[40ch] text-paper-2">The page you were looking for has moved, or was never hung.</p>
        <TransitionLink href="/" className={buttonClasses('primary', 'mt-phi-2')}>
          Return to the gallery
        </TransitionLink>
      </div>
    </section>
  );
}
