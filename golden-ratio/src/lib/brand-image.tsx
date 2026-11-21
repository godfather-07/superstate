import { SPIRAL_HEIGHT, SPIRAL_WIDTH, spiralPath, squaresPath } from './spiral';

const PAD = 2;
const VIEWBOX = `${-PAD} ${-PAD} ${SPIRAL_WIDTH + PAD * 2} ${SPIRAL_HEIGHT + PAD * 2}`;

/** Spiral as plain SVG for next/og ImageResponse (no client code, no CSS classes). */
export function SpiralSvg({ width, stroke, withSquares = true }: { width: number; stroke: number; withSquares?: boolean }) {
  const height = Math.round((width * (SPIRAL_HEIGHT + PAD * 2)) / (SPIRAL_WIDTH + PAD * 2));
  return (
    <svg width={width} height={height} viewBox={VIEWBOX} fill="none">
      {withSquares && <path d={squaresPath(10)} stroke="#C8A95E" strokeOpacity={0.4} strokeWidth={stroke * 0.6} />}
      <path d={spiralPath(10)} stroke="#C8A95E" strokeWidth={stroke} strokeLinecap="round" />
    </svg>
  );
}
