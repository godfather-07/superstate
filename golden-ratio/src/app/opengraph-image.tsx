import { ImageResponse } from 'next/og';
import { SpiralSvg } from '@/lib/brand-image';
import { site } from '@/lib/site';

export const alt = 'Golden Ratio — Every Brand Has Its Golden Ratio.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: 'radial-gradient(ellipse at 75% 40%, #1a1a1a 0%, #0a0a0a 65%)',
          color: '#FAFAFA',
          padding: '72px 80px',
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', right: -60, top: 120, display: 'flex', opacity: 0.9 }}>
          <SpiralSvg width={720} stroke={0.9} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <SpiralSvg width={72} stroke={4} />
            <span style={{ fontSize: 26, letterSpacing: 10, fontWeight: 600 }}>GOLDEN RATIO</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <span style={{ fontSize: 76, color: '#C8A95E', lineHeight: 1.05, maxWidth: 680 }}>Every Brand Has Its Golden Ratio.</span>
            <span style={{ fontSize: 22, letterSpacing: 7, color: '#E0E0E0' }}>BRAND STRATEGY | CREATIVE DIRECTION | MARKETING</span>
          </div>
          <span style={{ fontSize: 20, color: '#888888', letterSpacing: 3 }}>{site.url.replace('https://', '')} — Bengaluru</span>
        </div>
      </div>
    ),
    size,
  );
}
