import { PHI } from './utils';

/**
 * Geometry for the golden spiral — the logo mark and the design system's
 * recurring motif. Built the classical way: repeatedly cut a square off a
 * golden rectangle and draw a quarter-circle in each square.
 */

type Square = { x: number; y: number; size: number };
type Arc = { sx: number; sy: number; ex: number; ey: number; r: number };

export const SPIRAL_HEIGHT = 100;
export const SPIRAL_WIDTH = SPIRAL_HEIGHT * PHI; // ≈ 161.8

function build(steps: number) {
  let x = 0;
  let y = 0;
  let w = SPIRAL_WIDTH;
  let h = SPIRAL_HEIGHT;
  const squares: Square[] = [];
  const arcs: Arc[] = [];

  for (let i = 0; i < steps; i++) {
    switch (i % 4) {
      case 0: // square on the left
        squares.push({ x, y, size: h });
        arcs.push({ sx: x, sy: y + h, ex: x + h, ey: y, r: h });
        x += h;
        w -= h;
        break;
      case 1: // square on top
        squares.push({ x, y, size: w });
        arcs.push({ sx: x, sy: y, ex: x + w, ey: y + w, r: w });
        y += w;
        h -= w;
        break;
      case 2: // square on the right
        squares.push({ x: x + w - h, y, size: h });
        arcs.push({ sx: x + w, sy: y, ex: x + w - h, ey: y + h, r: h });
        w -= h;
        break;
      case 3: // square on the bottom
        squares.push({ x, y: y + h - w, size: w });
        arcs.push({ sx: x + w, sy: y + h, ex: x, ey: y + h - w, r: w });
        h -= w;
        break;
    }
  }
  return { squares, arcs };
}

const f = (n: number) => Number(n.toFixed(3));

/**
 * SVG path for the spiral. `from: 'center'` draws it outward from the eye of
 * the spiral, which is how the intro animation reveals it.
 */
export function spiralPath(steps = 10, from: 'outside' | 'center' = 'outside') {
  const { arcs } = build(steps);
  if (from === 'outside') {
    const [first] = arcs;
    return `M${f(first.sx)} ${f(first.sy)}` + arcs.map((a) => ` A${f(a.r)} ${f(a.r)} 0 0 1 ${f(a.ex)} ${f(a.ey)}`).join('');
  }
  const rev = [...arcs].reverse();
  return (
    `M${f(rev[0].ex)} ${f(rev[0].ey)}` + rev.map((a) => ` A${f(a.r)} ${f(a.r)} 0 0 0 ${f(a.sx)} ${f(a.sy)}`).join('')
  );
}

/** The Fibonacci squares behind the spiral, as a single path (for wireframes). */
export function squaresPath(steps = 10) {
  const { squares } = build(steps);
  return squares.map((s) => `M${f(s.x)} ${f(s.y)}h${f(s.size)}v${f(s.size)}h${f(-s.size)}Z`).join('');
}
