# Sleep Well trailer

42-second product trailer for Superstate's Sleep Well. It is animated in code, and every frame is a pure function of `t`.

| File | What it is |
|---|---|
| `exports/superstate-sleep-well-trailer-16x9.mp4` | 1920×1080, 30 fps, H.264 + AAC, −14 LUFS: YouTube, LinkedIn, site |
| `exports/superstate-sleep-well-trailer-9x16.mp4` | 1080×1920, 30 fps, H.264 + AAC, −14 LUFS: Reels, Stories, Shorts |
| `sleep-well-trailer.html` | The trailer itself. Open in a browser. Space = play/pause, ← → = scenes |
| `make-audio.py` | Synthesises the score and sound design, locked to the trailer's event times |
| `render-mp4.cjs` | Renders the HTML frame by frame to MP4 and muxes in the audio |

## Page options

- `?ar=9x16` switches to the vertical layout, with key content inside the Reels safe zone.
- `?t=23.5` starts at a given second.
- `?paused` starts paused.

## Re-export after a copy change

```bash
pip install numpy scipy
python3 trailer/make-audio.py /tmp/score.wav
node trailer/render-mp4.cjs trailer/exports/superstate-sleep-well-trailer-16x9.mp4 30 16x9 /tmp/score.wav
node trailer/render-mp4.cjs trailer/exports/superstate-sleep-well-trailer-9x16.mp4 30 9x16 /tmp/score.wav
```

Rendering needs Playwright (Chromium) and ffmpeg, and each cut takes about 9 minutes.

If you change an animation's timing in the HTML, move the matching cue in `make-audio.py` too. The sound is scored to exact timestamps: typing, odometer ticks, card landings and the shatter at 3.0 s.
