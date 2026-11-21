import { RevealWords } from './Reveal';
import { cn } from '@/lib/utils';

/**
 * Editorial section opener: a numbered small-caps label, then a serif
 * headline that reveals word by word.
 */
export function SectionHeading({
  index,
  label,
  title,
  id,
  className,
  align = 'left',
}: {
  index?: string;
  label: string;
  title?: string;
  id?: string;
  className?: string;
  align?: 'left' | 'center';
}) {
  return (
    <div className={cn('flex flex-col gap-phi-3', align === 'center' && 'items-center text-center', className)}>
      <p className="type-label flex items-center gap-phi-2 text-gold">
        {index && <span className="font-mono tracking-normal text-muted">({index})</span>}
        <span aria-hidden="true" className="h-px w-[34px] bg-gold/60" />
        {label}
      </p>
      {title && <RevealWords text={title} id={id} className="type-h2 max-w-[18ch] text-gold" />}
    </div>
  );
}
