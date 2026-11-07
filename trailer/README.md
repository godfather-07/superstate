# Helix trailer

A 46-second product trailer, animated entirely in code: `helix-trailer.html`.

## Watch it live

Open `helix-trailer.html` in Chrome or Safari (double-click it, or drag it into a browser window). It autoplays and loops.

| Key | Action |
| --- | --- |
| Space | Play / pause |
| ← / → | Previous / next scene |

Add `?t=12.5&paused` to the URL to open on a specific moment.

## Export an MP4

Needs [ffmpeg](https://ffmpeg.org) and Playwright with Chromium:

```bash
npm i -D playwright && npx playwright install chromium
```

```bash
node trailer/export-mp4.mjs
```

That writes `trailer/out/helix-trailer.mp4` at 1920×1080, 60 fps (the `out` folder is git-ignored). Options:

| Flag | Default | Meaning |
| --- | --- | --- |
| `--fps` | 60 | Frame rate |
| `--scale` | 1 | 0.5 = 960×540 preview, 2 = 3840×2160 |
| `--from` / `--to` | 0 / 46 | Export one section, in seconds |
| `--crf` | 18 | x264 quality (lower = better, bigger) |
| `--png` | off | Lossless frames, about 3× slower |
| `--workers` | 2 | Browser pages rendering in parallel |
| `--out` | `trailer/out/helix-trailer.mp4` | Output file |

Every frame is drawn with `window.render(t)`, so the video is identical however fast the machine is. The trailer has no audio track; add music in your editor.
