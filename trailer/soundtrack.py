#!/usr/bin/env python3
"""Original soundtrack for the Helix trailer, synthesized from scratch (no samples, nothing to license).

120 BPM in A minor (Am - F - C - G, one chord per 2 s bar). Sound effects are placed on the
trailer's own timeline: the shatter at 0.35 s, each counter step, the ⌥ Space key presses,
wheel and panel opens, typing, the "Answer copied" toast, carousel steps and the logo pop.

    python3 trailer/soundtrack.py [out.wav]        # needs numpy + scipy

Then mux it onto the video (export-mp4.mjs does this for you with --audio):
    ffmpeg -i trailer/out/helix-trailer.mp4 -i soundtrack.wav -c:v copy -c:a aac -b:a 192k -shortest out.mp4
"""
import sys, wave
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 44100
DUR = 46.0
N = int(SR * DUR)
BEAT = 0.5          # 120 BPM
BAR = 4 * BEAT
rng = np.random.default_rng(7)

L = {k: np.zeros((2, N)) for k in ('drums', 'bass', 'music', 'fx', 'send')}


def add(bus, t0, sig, gain=1.0, pan=0.0, send=0.0):
    """Mix a mono (or stereo) signal into a bus at time t0 with equal-power panning."""
    i0 = int(round(t0 * SR))
    if i0 >= N:
        return
    if sig.ndim == 1:
        a = (pan + 1) * np.pi / 4
        sig = np.vstack([sig * np.cos(a), sig * np.sin(a)]) * np.sqrt(2)
    if i0 < 0:
        sig, i0 = sig[:, -i0:], 0
    n = min(sig.shape[1], N - i0)
    L[bus][:, i0:i0 + n] += sig[:, :n] * gain
    if send:
        L['send'][:, i0:i0 + n] += sig[:, :n] * gain * send


def tl(d):
    return np.arange(int(d * SR)) / SR


def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(f, d, fc=4000.0, detune=0.0):
    """Additive band-limited saw with a built-in lowpass roll-off (fc)."""
    t = tl(d)
    out = np.zeros_like(t)
    ph = rng.random() * 2 * np.pi
    k = 1
    while k * f < min(SR / 2.2, fc * 6):
        amp = (1 / k) / np.sqrt(1 + (k * f / fc) ** 4)
        out += amp * np.sin(2 * np.pi * k * f * (1 + detune) * t + ph * k)
        k += 1
    return out


def hp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'hp', fs=SR, output='sos'), x)


def lp(x, fc, order=2):
    return sosfilt(butter(order, fc, 'lp', fs=SR, output='sos'), x)


def bp(x, lo, hi, order=2):
    return sosfilt(butter(order, [lo, hi], 'bp', fs=SR, output='sos'), x)


def adsr(n, a=0.005, r=0.05):
    e = np.ones(n)
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na)
    e[-nr:] *= np.linspace(1, 0, nr)
    return e


def sweep_lp(x, f0, f1):
    """Time-varying one-pole lowpass (cutoff glides f0 -> f1, exponentially)."""
    fc = f0 * (f1 / f0) ** np.linspace(0, 1, len(x))
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty_like(x)
    s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s)
        y[i] = s
    return y

# ------------------------------------------------------------------ instruments


def kick(g=1.0):
    t = tl(0.45)
    f = 45 + 110 * np.exp(-t / 0.035)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.16)
    click = hp(rng.standard_normal(len(t)), 2500) * np.exp(-t / 0.004) * 0.35
    return np.tanh(1.6 * (body + click)) * g


def clap():
    t = tl(0.3)
    n = bp(rng.standard_normal(len(t)), 900, 5000)
    env = np.exp(-t / 0.09)
    for d in (0.0, 0.011, 0.022):                # the three-flam clap
        env += np.exp(-np.clip(t - d, 0, None) / 0.008) * (t >= d) * 0.8
    tone = np.sin(2 * np.pi * 185 * t) * np.exp(-t / 0.05) * 0.3
    return (n * env + tone) * 0.5


def hat(open_=False):
    t = tl(0.35 if open_ else 0.06)
    n = hp(rng.standard_normal(len(t)), 7000, 4)
    return n * np.exp(-t / (0.12 if open_ else 0.018)) * 0.5


def pluck(m, d=0.22, fc=2600):
    s = saw(mtof(m), d, fc) + 0.5 * saw(mtof(m), d, fc, detune=0.004)
    t = tl(d)
    return s * np.exp(-t / 0.09) * adsr(len(t), 0.002, 0.03)


def bassnote(m, d, fc=380):
    s = saw(mtof(m), d, fc) + 0.6 * np.sin(2 * np.pi * mtof(m) * tl(d))
    return np.tanh(1.4 * s) * adsr(len(s), 0.004, 0.03)


def pad(notes, d, fc=1100, a=0.5):
    out = np.zeros((2, int(d * SR)))
    for m in notes:
        for det, side in ((-0.006, 0), (0.0, None), (0.006, 1)):
            s = saw(mtof(m), d, fc, detune=det) * 0.5
            if side is None:
                out += s
            else:
                out[side] += s * 1.3
    return out * adsr(out.shape[1], a, 0.6) * 0.32


def riser(d, f0=300, f1=9000, g=0.5):
    t = tl(d)
    n = sweep_lp(rng.standard_normal(len(t)), f0, f1)
    tone = np.sin(2 * np.pi * np.cumsum(220 * 4 ** (t / d)) / SR) * 0.15
    return (n + tone) * (t / d) ** 2 * g


def impact(g=1.0, crash=0.6):
    t = tl(2.2)
    f = 30 + 45 * np.exp(-t / 0.12)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.55)
    noise = hp(rng.standard_normal(len(t)), 3000) * np.exp(-t / 0.45) * crash
    return np.tanh(1.3 * (boom + noise)) * g


def whoosh(d=0.45, lo=400, hi=4500, g=0.5):
    t = tl(d)
    n = bp(rng.standard_normal(len(t)), lo, hi)
    return n * np.sin(np.pi * t / d) ** 2 * g


def tick(f=2200, g=0.25):
    t = tl(0.03)
    return np.sin(2 * np.pi * f * t) * np.exp(-t / 0.006) * g


def keyclick(g=0.6):
    t = tl(0.09)
    thock = np.sin(2 * np.pi * np.cumsum(260 - 120 * t / 0.09) / SR) * np.exp(-t / 0.02)
    clk = bp(rng.standard_normal(len(t)), 1500, 6000) * np.exp(-t / 0.004)
    return (thock * 0.8 + clk * 0.6) * g


def typeclick():
    t = tl(0.025)
    return bp(rng.standard_normal(len(t)), 2000, 7000) * np.exp(-t / 0.003) * (0.10 + 0.05 * rng.random())


def pop(f0=320, f1=720, g=0.35):
    t = tl(0.12)
    f = f0 + (f1 - f0) * (1 - np.exp(-t / 0.02))
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.035) * g


def bell(m, d=1.6, g=0.3):
    t = tl(d)
    f = mtof(m)
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (dc)) for r, a, dc in
            ((1, 1, 0.9), (2.0, 0.4, 0.5), (3.01, 0.25, 0.3), (4.2, 0.12, 0.15)))
    return s * adsr(len(t), 0.002, 0.2) * g


def shatter(g=0.5):
    """Glass-like debris: a burst of short resonant pings spread over 0.5 s."""
    out = np.zeros((2, int(0.8 * SR)))
    for _ in range(40):
        t0 = rng.random() ** 2 * 0.5
        f = 2500 + rng.random() * 6000
        d = 0.05 + rng.random() * 0.12
        t = tl(d)
        s = np.sin(2 * np.pi * f * t) * np.exp(-t / (d / 4)) * (0.3 + 0.7 * rng.random())
        i = int(t0 * SR)
        a = rng.random() * np.pi / 2
        out[0, i:i + len(s)] += s * np.cos(a)
        out[1, i:i + len(s)] += s * np.sin(a)
    return out * g

# ------------------------------------------------------------------ music


CHORDS = [  # (bass root midi, chord tones for arp/pad)
    (45, [57, 60, 64]),   # Am
    (41, [53, 57, 60]),   # F
    (48, [55, 60, 64]),   # C
    (43, [55, 59, 62]),   # G
]


def chord_at(t):
    return CHORDS[int(t // BAR) % 4]


def energy(t):
    """Arrangement map: which parts play at time t (start of a beat/16th)."""
    if t < 0.5:
        return dict()
    if t < 7.5:
        return dict(kick=1, clap=1, hat=1, bass=1, arp=0.8)
    if t < 8.0:
        return dict(hat=1, arp=0.6)
    if t < 10.0:
        return dict(arp=0.45, slow=1)
    if t < 11.0:
        return dict(kick=1, hat=1, bass=0.8)
    if t < 27.0:
        quiet = (14.75 <= t < 15.0) or (21.75 <= t < 22.0)
        return {} if quiet else dict(kick=1, hat=1, bass=0.75, arp=0.4, clap=0.6)
    if t < 31.5:
        return dict(kick=1, clap=1, hat=1, bass=1, arp=0.75)
    if t < 35.0:
        return dict(kick=1, clap=1, hat=1, hat16=1, bass=1, arp=0.9)
    if t < 35.5:
        return dict(roll=1, hat16=1, arp=0.7)
    if t < 41.0:
        return dict(kick=1, clap=1, hat=1, hat16=1, ohat=1, bass=1, arp=1)
    if t < 41.5:
        return dict(roll=1, arp=0.6)
    return dict(arp=0.5, slow=1)


kicks = []
for b in range(int(DUR / BEAT)):
    t = b * BEAT
    e = energy(t)
    if e.get('kick'):
        add('drums', t, kick(), 0.95)
        kicks.append(t)
    if e.get('clap') and b % 2 == 1:
        add('drums', t, clap(), 0.55 * e['clap'], 0.05, send=0.25)
    if e.get('roll'):
        for k in range(4):
            add('drums', t + k * BEAT / 4, clap(), 0.25 + 0.12 * k + 0.2 * (t % 1), 0.0, send=0.2)
    for s in range(4):                         # sixteenths
        ts = t + s * BEAT / 4
        es = energy(ts)
        if es.get('hat') and s == 2:
            add('drums', ts, hat(es.get('ohat', 0) and b % 2 == 1), 0.45, 0.3)
        elif es.get('hat16') and s in (1, 3):
            add('drums', ts, hat(), 0.18, -0.3)

# bass: driving eighths, octave jump on the offbeat
for i in range(int(DUR / (BEAT / 2))):
    t = i * BEAT / 2
    e = energy(t)
    if not e.get('bass'):
        continue
    root = chord_at(t)[0]
    m = root + (12 if i % 2 else 0)
    add('bass', t, bassnote(m - 12, BEAT / 2 * 0.92, 300 + 300 * e['bass']), 0.32 * e['bass'])

# arp: sixteenth plucks over the chord (eighths in the slow sections)
ARP = [0, 1, 2, 3, 2, 1, 2, 3]
for i in range(int(DUR / (BEAT / 4))):
    t = i * BEAT / 4
    e = energy(t)
    if not e.get('arp') or (e.get('slow') and i % 2):
        continue
    tones = chord_at(t)[1]
    deg = ARP[i % 8]
    m = tones[deg] + 12 if deg < 3 else tones[0] + 24
    fc = 1800 + 2200 * e['arp'] * (0.6 + 0.4 * np.sin(t * 0.7))
    add('music', t, pluck(m, 0.2, fc), 0.16 * e['arp'], pan=0.35 if i % 2 else -0.35, send=0.35)

# pads: title (8-10 s), three looks (27-31.5 s) and the end card (41.5-46 s)
for t0, t1, g in ((7.9, 10.1, 1.0), (27.0, 31.5, 0.55), (41.5, 46.0, 1.0)):
    t = t0
    while t < t1 - 1e-6:
        nb = min((np.floor(t / BAR + 1e-9) + 1) * BAR, t1)
        root, tones = chord_at(t + 0.01)
        add('music', t, pad([root + 12] + tones, nb - t + 0.6), g, send=0.3)
        t = nb

# ------------------------------------------------------------------ sound design on the trailer's timeline
add('fx', 0.0, riser(0.35, 400, 6000, 0.35))
add('fx', 0.35, impact(1.0, 0.7), 0.9, send=0.3)
add('fx', 0.36, shatter(0.5), 1.0, send=0.4)
for t in (2.1, 3.6, 5.1, 6.6):                       # counter steps
    add('fx', t - 0.18, whoosh(0.4, 500, 5000, 0.25), pan=0.3)
    add('fx', t, tick(2600, 0.22), pan=0.4)
    add('fx', t + 0.04, tick(3100, 0.15), pan=0.45)
for t in (2.35, 6.85):                               # arc sub-menus unfolding
    for j in range(3):
        add('fx', t + 0.1 + j * 0.06, pop(500 + 120 * j, 1100 + 150 * j, 0.12), pan=-0.2 + 0.2 * j)
add('fx', 7.4, riser(0.6, 300, 8000, 0.35))
add('fx', 8.0, impact(0.55, 0.35), send=0.4)
add('fx', 9.85, whoosh(0.45, 300, 3000, 0.4))
add('fx', 10.36, keyclick(0.7), pan=-0.25)          # ⌥
add('fx', 10.48, keyclick(0.8), pan=0.05)           # Space
add('fx', 10.74, pop(260, 640, 0.45), send=0.2)     # wheel in
add('fx', 10.75, riser(0.45, 500, 7000, 0.18))
for t in (11.2, 15.0, 22.0, 27.0, 31.5, 35.5):       # blur transitions
    add('fx', t - 0.2, whoosh(0.45, 350, 4000, 0.32))
for t in (11.6, 15.4, 22.3):                         # wheel opens on the desktop
    add('fx', t, pop(280, 680, 0.32), send=0.15)
    add('fx', t + 0.2, tick(1800, 0.12))
for t in (12.35, 16.15, 23.05):                      # panel opens
    add('fx', t, pop(420, 900, 0.22), send=0.2)


def typing(a, b, chars):
    for i in range(chars):
        add('fx', a + (i + 1) / chars * (b - a), typeclick(), pan=rng.uniform(-0.2, 0.2))


typing(12.8, 13.85, 17)                              # "Read SIMA 2 paper"
typing(16.6, 18.3, 46)                               # prompt (thinned out)
typing(25.1, 25.75, 12)                              # "Best regards"
add('fx', 14.05, tick(1500, 0.2))                    # note saved
add('fx', 20.3, bell(84, 1.2, 0.18), pan=0.1, send=0.3)   # Answer copied
add('fx', 20.42, bell(88, 1.4, 0.18), pan=0.15, send=0.3)
add('fx', 20.88, whoosh(0.3, 800, 6000, 0.15))      # answer lands in the mail
add('fx', 24.12, keyclick(0.5))                      # ↵ paste
add('fx', 24.45, pop(600, 1200, 0.15))
for t in (28.5, 30.0):                               # theme morphs
    add('fx', t - 0.2, whoosh(0.4, 600, 6000, 0.3), pan=0.4)
    add('fx', t, bell(81 if t < 29 else 86, 1.0, 0.1), pan=0.4, send=0.4)
add('fx', 33.35, riser(0.4, 800, 9000, 0.2), pan=0.0)   # ring 1 -> 2
add('fx', 33.6, pop(400, 1000, 0.25), send=0.2)
for t in (36.3, 37.15, 38.0, 38.85, 39.7, 40.55):    # carousel steps
    add('fx', t - 0.05, whoosh(0.5, 400, 3500, 0.3), pan=-0.4)
add('fx', 40.9, riser(0.6, 300, 9000, 0.4))
add('fx', 41.5, impact(0.85, 0.5), send=0.4)
add('fx', 41.75, bell(81, 2.5, 0.3), send=0.5)       # logo pop
add('fx', 41.78, bell(88, 2.5, 0.2), send=0.5)
add('fx', 42.7, pop(500, 1000, 0.18), send=0.2)      # download button

# ------------------------------------------------------------------ mix
t = np.arange(N) / SR
duck = np.ones(N)
for k in kicks:                                      # sidechain the bass and music under the kick
    i = int(k * SR)
    seg = np.arange(min(int(0.25 * SR), N - i)) / SR
    duck[i:i + len(seg)] = np.minimum(duck[i:i + len(seg)], 1 - 0.65 * np.exp(-seg / 0.07))
ir_t = np.arange(int(2.2 * SR)) / SR
ir = np.vstack([rng.standard_normal(len(ir_t)), rng.standard_normal(len(ir_t))]) * np.exp(-ir_t / 0.55)
ir[:, :int(0.012 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
verb = np.vstack([fftconvolve(lp(L['send'][c], 6000), ir[c])[:N] for c in range(2)]) * 0.35
d = int(0.375 * SR)                                  # dotted-eighth ping-pong delay on the music bus
dly = np.zeros_like(L['music'])
src = L['music'] * 0.3
for k in range(1, 4):
    sh = d * k
    dly[k % 2, sh:] += src[(k + 1) % 2, :-sh] * 0.45 ** (k - 1)

mix = L['drums'] + (L['bass'] + L['music'] + dly * 0.6) * duck + L['fx'] + verb
mix[0] = hp(mix[0], 28)
mix[1] = hp(mix[1], 28)
fade = np.clip((DUR - t) / 1.0, 0, 1) ** 1.5 * np.clip(t / 0.01, 0, 1)
mix *= fade
mix *= 1.3 / np.abs(mix).max()                       # gentle soft-clip on the loudest hits only
mix = np.tanh(mix) / np.tanh(1.3) * 0.89

out = sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav'
with wave.open(out, 'wb') as w:
    w.setnchannels(2)
    w.setsampwidth(2)
    w.setframerate(SR)
    w.writeframes((mix.T * 32767).astype('<i2').tobytes())
print('wrote', out, f'{DUR:.1f}s')
