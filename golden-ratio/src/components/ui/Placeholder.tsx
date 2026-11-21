import Image from 'next/image';
import { GoldenSpiral } from './GoldenSpiral';
import type { ImageAsset } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * PRD §9: until real photography exists, every image is a solid dark
 * rectangle with a centred label describing what the image should be.
 * Never stock photos or AI-generated images. Once an asset has a `src`, the
 * same component renders it through next/image (AVIF/WebP, lazy-loaded).
 */
export function Media({
  asset,
  className,
  sizes = '(min-width: 1024px) 50vw, 100vw',
  priority = false,
}: {
  asset: ImageAsset;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (asset.src) {
    return (
      <div className={cn('relative h-full w-full bg-ink-3', className)}>
        <Image src={asset.src} alt={asset.alt} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      role="img"
      aria-label={asset.alt}
      className={cn(
        'relative flex h-full w-full items-center justify-center overflow-hidden bg-ink-3',
        'bg-[radial-gradient(ellipse_at_30%_20%,rgba(200,169,94,0.10),transparent_60%)]',
        className,
      )}
    >
      <GoldenSpiral withSquares strokeWidth={1} className="absolute inset-x-[10%] top-1/2 w-[80%] -translate-y-1/2 text-gold/[0.07]" />
      <span className="absolute inset-[13px] border border-gold/15" aria-hidden="true" />
      <span className="type-label relative max-w-[30ch] px-phi-4 text-center leading-relaxed text-muted">
        <span className="mb-2 block font-mono tracking-normal text-gold/60">[ IMAGE ]</span>
        {asset.placeholder}
      </span>
    </div>
  );
}
