// Renders sleep-well-trailer.html to an MP4, frame by frame, from its master clock.
// Usage: node trailer/render-mp4.cjs [out.mp4] [fps]
// Needs Playwright (Chromium) and ffmpeg on PATH.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

const OUT = path.resolve(process.argv[2] || 'sleep-well-trailer.mp4');
const FPS = Number(process.argv[3] || 30);
const PAGE = 'file://' + path.join(__dirname, 'sleep-well-trailer.html') + '?paused';

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(PAGE);
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1000);
  await page.evaluate(() => { window.pause(); document.getElementById('hud').style.display = 'none'; });

  const dur = await page.evaluate(() => window.DURATION);
  const frames = Math.round(dur * FPS);

  const ff = spawn('ffmpeg', [
    '-y', '-loglevel', 'error',
    '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-tune', 'film',
    '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-movflags', '+faststart', OUT
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const t0 = Date.now();
  for (let i = 0; i < frames; i++) {
    const t = i / FPS;
    await page.evaluate(t => new Promise(r => {
      window.seek(t);
      requestAnimationFrame(() => requestAnimationFrame(r)); // let the frame rasterise
    }), t);
    const png = await page.screenshot({ type: 'png' });
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    if (i % (FPS * 3) === 0) console.log(`frame ${i}/${frames}  t=${t.toFixed(2)}s  ${((Date.now() - t0) / 1000).toFixed(0)}s elapsed`);
  }
  ff.stdin.end();
  await new Promise((res, rej) => ff.on('close', c => c === 0 ? res() : rej(new Error('ffmpeg exited ' + c))));
  await browser.close();
  console.log(`done: ${OUT} (${frames} frames @ ${FPS}fps)`, errors.length ? { errors } : '');
})().catch(e => { console.error(e); process.exit(1); });
