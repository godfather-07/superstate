import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'solid';

/**
 * PRD §6.4 buttons.
 * primary   — gold outline; fills gold with black text on hover
 * secondary — white outline; fills white on hover
 * solid     — gold fill, black text; darkens on hover (form submit)
 */
export function buttonClasses(variant: Variant = 'primary', className?: string) {
  return cn(
    'group relative inline-flex items-center justify-center gap-3 overflow-hidden border px-[26px] py-[14px]',
    'font-sans text-[13px] font-semibold uppercase tracking-[0.22em] lg:text-[14px]',
    'transition-colors duration-300 ease-expo disabled:cursor-not-allowed disabled:opacity-60',
    variant === 'primary' && 'border-gold text-gold hover:bg-gold hover:text-ink',
    variant === 'secondary' && 'border-paper/80 text-paper hover:bg-paper hover:text-ink',
    variant === 'solid' && 'border-gold bg-gold text-ink hover:border-gold-dark hover:bg-gold-dark',
    className,
  );
}

type ButtonProps = ComponentPropsWithoutRef<'button'> & { variant?: Variant; children: ReactNode };

export function Button({ variant = 'primary', className, children, ...rest }: ButtonProps) {
  return (
    <button className={buttonClasses(variant, className)} {...rest}>
      {children}
    </button>
  );
}
