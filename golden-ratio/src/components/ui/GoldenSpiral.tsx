import { SPIRAL_HEIGHT, SPIRAL_WIDTH, spiralPath, squaresPath } from '@/lib/spiral';
import { cn } from '@/lib/utils';

const PAD = 2;
const VIEWBOX = `${-PAD} ${-PAD} ${SPIRAL_WIDTH + PAD * 2} ${SPIRAL_HEIGHT + PAD * 2}`;

const SPIRAL = spiralPath(10);
const SPIRAL_FROM_CENTER = spiralPath(10, 'center');
const SQUARES = squaresPath(10);

type Props = {
  className?: string;
  /** Draw the Fibonacci squares behind the spiral. */
  withSquares?: boolean;
  strokeWidth?: number;
  title?: string;
};

/** The golden spiral mark, static. Inherits colour from `currentColor`. */
export function GoldenSpiral({ className, withSquares = false, strokeWidth = 1.5, title }: Props) {
  return (
    <svg
      viewBox={VIEWBOX}
      className={cn('overflow-visible', className)}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      vectorEffect="non-scaling-stroke"
      role={title ? 'img' : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {withSquares && <path d={SQUARES} strokeOpacity={0.45} vectorEffect="non-scaling-stroke" />}
      <path d={SPIRAL} strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export const spiralGeometry = { VIEWBOX, SPIRAL, SPIRAL_FROM_CENTER, SQUARES, ratio: SPIRAL_WIDTH / SPIRAL_HEIGHT };

/** Logo: spiral mark + wordmark. */
export function Logo({ className, markId }: { className?: string; markId?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-gold sm:gap-3', className)}>
      <span id={markId} className="inline-block w-[28px] sm:w-[34px]">
        <GoldenSpiral strokeWidth={1.5} withSquares />
      </span>
      <span className="whitespace-nowrap font-serif text-[13px] font-semibold tracking-[0.16em] text-paper sm:text-[15px] sm:tracking-[0.24em]">
        GOLDEN RATIO
      </span>
    </span>
  );
}
