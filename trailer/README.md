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
| `--audio` | none | Soundtrack to add (normalised to -14 LUFS, AAC 192k) |
| `--out` | `trailer/out/helix-trailer.mp4` | Output file |

Every frame is drawn with `window.render(t)`, so the video is identical however fast the machine is.

## Music

`soundtrack.py` synthesizes an original 46-second track (120 BPM, A minor), so there is nothing to license. Its hits follow the trailer's timeline: the shatter, counter steps, ⌥ Space key presses, typing, the "Answer copied" chime, carousel swooshes and the logo pop. It needs numpy and scipy.

```bash
python3 trailer/soundtrack.py trailer/out/soundtrack.wav
```

```bash
node trailer/export-mp4.mjs --audio trailer/out/soundtrack.wav
```

To add it to a video you already exported, without rendering again:

```bash
ffmpeg -i trailer/out/helix-trailer.mp4 -i trailer/out/soundtrack.wav -map 0:v -map 1:a -c:v copy -af loudnorm=I=-14:TP=-1.5:LRA=11 -c:a aac -b:a 192k -ar 48000 -shortest trailer/out/helix-trailer-music.mp4
```
