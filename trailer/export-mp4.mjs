#!/usr/bin/env node
// Renders helix-trailer.html frame by frame in headless Chromium and encodes an MP4 with ffmpeg.
//
//   node trailer/export-mp4.mjs                      # 1920x1080, 60 fps -> trailer/out/helix-trailer.mp4
//   node trailer/export-mp4.mjs --fps 30 --workers 4 --out ~/Desktop/helix.mp4
//   node trailer/export-mp4.mjs --from 27 --to 31.5  # export one section only
//   node trailer/export-mp4.mjs --png                # lossless frames (slower)
//
// Needs: ffmpeg on PATH, and Playwright with Chromium (npm i -D playwright && npx playwright install chromium).
// Each frame is drawn with window.render(t), so the result is the same however fast the machine is.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).reduce((acc, a, i, all) => {
  if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']);
  return acc;
}, []));
const fps = Number(args.fps || 60);
const scale = Number(args.scale || 1);                       // 0.5 = 960x540 preview, 2 = 4K
const workers = Math.max(1, Number(args.workers || 2));
const crf = String(args.crf || 18);
const png = args.png === 'true';                           // lossless frames: sharper, ~3x slower
const out = resolve(args.out || resolve(here, 'out/helix-trailer.mp4'));
const page = pathToFileURL(resolve(here, 'helix-trailer.html')).href + '?render';

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  try { ({ chromium } = createRequire(import.meta.url)('playwright')); } catch {
    console.error('Playwright is not installed. Run:  npm i -D playwright && npx playwright install chromium');
    process.exit(1);
  }
}

const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
const pages = await Promise.all(Array.from({ length: workers }, async () => {
  const p = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: scale });
  await p.goto(page, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  return p;
}));
const duration = await pages[0].evaluate(() => window.HELIX_DURATION);
const from = Number(args.from || 0), to = Math.min(Number(args.to || duration), duration);
const total = Math.round((to - from) * fps);

mkdirSync(dirname(out), { recursive: true });
const ff = spawn('ffmpeg', [
  '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', png ? 'png' : 'mjpeg', '-i', '-',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', crf, '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out,
], { stdio: ['pipe', 'inherit', 'inherit'] });
const ffDone = new Promise((ok, fail) => ff.on('close', c => (c === 0 ? ok() : fail(new Error('ffmpeg exited with code ' + c)))));
const write = buf => new Promise(ok => (ff.stdin.write(buf) ? ok() : ff.stdin.once('drain', ok)));

async function frame(p, i) {
  await p.evaluate(t => new Promise(done => {
    window.render(t);
    requestAnimationFrame(() => requestAnimationFrame(done));   // let blur filters and fonts paint
  }), from + i / fps);
  return p.screenshot(png ? { type: 'png' } : { type: 'jpeg', quality: 95 });
}

const started = Date.now();
for (let i = 0; i < total; i += workers) {
  const batch = await Promise.all(pages.map((p, w) => (i + w < total ? frame(p, i + w) : null)));
  for (const buf of batch) if (buf) await write(buf);
  const done = Math.min(i + workers, total), secs = (Date.now() - started) / 1000;
  process.stdout.write(`\rframe ${done}/${total}  ${(done / secs).toFixed(1)} fps  eta ${Math.round((total - done) / (done / secs))}s   `);
}
ff.stdin.end();
await ffDone;
await browser.close();
console.log(`\nWrote ${out}`);
