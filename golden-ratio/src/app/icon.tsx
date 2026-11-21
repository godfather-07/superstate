import { ImageResponse } from 'next/og';
import { SpiralSvg } from '@/lib/brand-image';

/** Favicons: golden spiral mark at 16, 32 and 512px (180px is apple-icon.tsx). */
export function generateImageMetadata() {
  return [16, 32, 512].map((px) => ({ id: String(px), size: { width: px, height: px }, contentType: 'image/png', alt: 'Golden Ratio' }));
}

export default async function Icon({ id }: { id: Promise<string | number> }) {
  const px = Number(await id);
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0A0A0A' }}>
        <SpiralSvg width={Math.round(px * 0.86)} stroke={px <= 32 ? 9 : 3} withSquares={px > 32} />
      </div>
    ),
    { width: px, height: px },
  );
}
