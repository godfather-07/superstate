#!/usr/bin/env python3
"""Synthesises the Sleep Well trailer soundtrack (score + sound design), locked to the
trailer's event times. Same 42 s timeline for the 16:9 and 9:16 cuts.

Usage:  python3 trailer/make-audio.py out.wav
Needs:  numpy, scipy. Deterministic: same input -> same file.
"""
import sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
DUR = 42.0
N = int(SR * DUR)
rng = np.random.default_rng(7)

mus = np.zeros((2, N))   # music bus
sfx = np.zeros((2, N))   # sound-design bus
send = np.zeros((2, N))  # reverb send


# ---------------------------------------------------------------- helpers
def mtof(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def T(n):
    return np.arange(n) / SR


def noise(n):
    return rng.standard_normal(n)


def _sos(kind, f, order=2):
    nyq = SR / 2
    if kind == 'band':
        lo, hi = f
        return butter(order, [max(lo, 20) / nyq, min(hi, nyq * 0.95) / nyq], 'band', output='sos')
    return butter(order, min(max(f, 20), nyq * 0.95) / nyq, kind, output='sos')


def lp(x, f, o=2):
    return sosfilt(_sos('low', f, o), x, axis=-1)


def hp(x, f, o=2):
    return sosfilt(_sos('high', f, o), x, axis=-1)


def bp(x, lo, hi, o=2):
    return sosfilt(_sos('band', (lo, hi), o), x, axis=-1)


def sweep(x, f0, f1, kind='low', chunk=256):
    """Time-varying 2nd-order filter, cutoff glides exponentially f0 -> f1."""
    out = np.empty_like(x)
    zi = np.zeros((1, 2))
    n = len(x)
    for s in range(0, n, chunk):
        p = s / max(1, n - 1)
        sos = _sos(kind, f0 * (f1 / f0) ** p)
        out[s:s + chunk], zi = sosfilt(sos, x[s:s + chunk], zi=zi)
    return out


def place(bus, sig, t, gain=1.0, pan=0.0, rev=0.0):
    if sig.ndim == 1:
        l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
        st = np.vstack([sig * l, sig * r]) * np.sqrt(2)
    else:
        st = sig
    i = int(round(t * SR))
    if i >= N:
        return
    s0 = 0
    if i < 0:
        s0, i = -i, 0
    j = min(N, i + st.shape[1] - s0)
    seg = st[:, s0:s0 + (j - i)] * gain
    bus[:, i:j] += seg
    if rev:
        send[:, i:j] += seg * rev


def bez(x1, y1, x2, y2):
    cx = 3 * x1; bx = 3 * (x2 - x1) - cx; ax = 1 - cx - bx
    cy = 3 * y1; by = 3 * (y2 - y1) - cy; ay = 1 - cy - by

    def f(x):
        if x <= 0: return 0.0
        if x >= 1: return 1.0
        lo, hi = 0.0, 1.0
        for _ in range(40):
            u = (lo + hi) / 2
            if ((ax * u + bx) * u + cx) * u < x: lo = u
            else: hi = u
        u = (lo + hi) / 2
        return ((ay * u + by) * u + cy) * u
    return f


EASE = bez(0.22, 1, 0.36, 1)  # same entrance curve as the trailer


def odo_ticks(digits, t0, dur, stag, cycles=1):
    """Times at which any odometer column clicks past a digit (mirrors odoR in the page)."""
    ts = []
    for k, v in enumerate(digits):
        total = cycles * 10 + v
        last = 0
        for t in np.arange(t0, t0 + stag * k + dur + 0.01, 0.001):
            p = EASE(min(1, max(0, (t - t0 - k * stag) / dur))) * total
            if int(p) > last:
                ts.append(t); last = int(p)
    ts.sort()
    out = []
    for t in ts:  # merge clicks closer than 14 ms
        if not out or t - out[-1] > 0.014:
            out.append(t)
    return out


# ---------------------------------------------------------------- instruments
def pad(notes, dur, cutoff, a=0.5, r=0.8, det=0.08, wob=0.25):
    n = int((dur + r) * SR); t = T(n)
    L = np.zeros(n); R = np.zeros(n)
    for m in notes:
        for c, pan in ((-det, -0.75), (0.0, 0.0), (det, 0.75)):
            f = mtof(m + c); ph0 = rng.random() * 2 * np.pi
            s = np.zeros(n)
            for h in range(1, int(min(18, max(1, cutoff * 1.6 / f))) + 1):
                s += np.sin(2 * np.pi * f * h * t + ph0 * h) / h
            L += s * np.cos((pan + 1) * np.pi / 4); R += s * np.sin((pan + 1) * np.pi / 4)
    st = lp(np.vstack([L, R]), cutoff)
    e = np.minimum(1, t / max(a, 1e-3)) * np.clip((dur + r - t) / r, 0, 1)
    e = e * (1 + 0.07 * np.sin(2 * np.pi * wob * t))
    return st * e * 0.055 / np.sqrt(len(notes))


def ep(m, dur=1.4, bright=1.0):
    n = int(dur * SR); t = T(n); f = mtof(m)
    s = (np.sin(2 * np.pi * f * t) * np.exp(-t * 2.0)
         + 0.45 * bright * np.sin(2 * np.pi * 2 * f * t) * np.exp(-t * 5)
         + 0.12 * bright * np.sin(2 * np.pi * 3 * f * t) * np.exp(-t * 8)
         + 0.05 * bright * np.sin(2 * np.pi * 7.1 * f * t) * np.exp(-t * 30))
    return s * np.minimum(1, t / 0.003) * np.clip((dur - t) / 0.15, 0, 1) * 0.3


def bell(m, dur=3.0, g=1.0):
    n = int(dur * SR); t = T(n); f = mtof(m)
    s = sum(a * np.sin(2 * np.pi * f * k * t) * np.exp(-t * d)
            for k, a, d in ((1, 1, 1.1), (2.0, .5, 2.0), (2.76, .32, 3.2), (5.4, .18, 5.5), (8.93, .07, 9)))
    return s * np.minimum(1, t / 0.002) * 0.16 * g


def bass(m, dur=0.42, g=1.0):
    n = int(dur * SR); t = T(n); f = mtof(m)
    s = np.sin(2 * np.pi * f * t) + 0.22 * np.sin(2 * np.pi * 2 * f * t)
    e = np.minimum(1, t / 0.006) * np.exp(-t * 2.4) * np.clip((dur - t) / 0.05, 0, 1)
    return np.tanh(s * e * 1.5) * 0.42 * g


def kick(g=1.0, tone=1.0):
    n = int(0.5 * SR); t = T(n)
    f = 46 + 95 * np.exp(-t * 30)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5)
    s += noise(n) * np.exp(-t * 320) * 0.12 * tone
    return np.tanh(s * 1.7) * 0.75 * g


def clap(g=1.0):
    n = int(0.35 * SR); t = T(n)
    e = sum((t >= d) * np.exp(-np.clip(t - d, 0, None) * 170) for d in (0, 0.011, 0.023))
    e = e + np.exp(-t * 13) * 0.35
    return bp(noise(n), 900, 4200) * e * 0.42 * g


def hat(g=1.0, open_=False):
    n = int((0.28 if open_ else 0.06) * SR); t = T(n)
    return hp(noise(n), 7500, 4) * np.exp(-t * (11 if open_ else 75)) * 0.28 * g


def boom(crack=1.0, g=1.0):
    n = int(2.8 * SR); t = T(n)
    f = 30 + 72 * np.exp(-t * 3.2)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.5)
    s += lp(noise(n), 200) * np.exp(-t * 2.0) * 0.9
    s += lp(noise(n), 3500) * np.exp(-t * 22) * 0.6 * crack
    return np.tanh(s * 1.6) * g


def shatter():
    n = int(1.7 * SR); out = np.zeros((2, n))
    for _ in range(280):  # glass grains, dense at first then thinning
        tt = rng.exponential(0.2)
        if tt > 1.4: continue
        ln = int(rng.uniform(0.004, 0.035) * SR)
        lo = rng.uniform(1600, 5200)
        g = bp(noise(ln), lo, min(lo * 2.6, 20000)) * np.exp(-T(ln) * rng.uniform(70, 300))
        amp = np.exp(-tt * 2.6) * rng.uniform(0.2, 1.0); pan = rng.uniform(-1, 1)
        i = int(tt * SR); j = min(n, i + ln)
        out[0, i:j] += g[:j - i] * amp * np.cos((pan + 1) * np.pi / 4)
        out[1, i:j] += g[:j - i] * amp * np.sin((pan + 1) * np.pi / 4)
    for _ in range(46):  # ringing shards
        tt = rng.exponential(0.3)
        if tt > 1.5: continue
        ln = int(0.25 * SR); tp = T(ln); f = rng.uniform(2600, 8200)
        g = np.sin(2 * np.pi * f * tp) * np.exp(-tp * rng.uniform(14, 40)) * 0.22 * np.exp(-tt * 2.2)
        pan = rng.uniform(-1, 1); i = int(tt * SR); j = min(n, i + ln)
        out[0, i:j] += g[:j - i] * np.cos((pan + 1) * np.pi / 4)
        out[1, i:j] += g[:j - i] * np.sin((pan + 1) * np.pi / 4)
    return out * 0.8


def whoosh(dur=0.5, f0=250, f1=6000, peak=0.6, g=1.0):
    n = int(dur * SR); u = T(n) / dur
    x = hp(sweep(noise(n), f0, f1), 120)
    e = np.where(u < peak, (u / peak) ** 2, np.exp(-(u - peak) / (1 - peak) * 4))
    return x * e * 0.32 * g


def riser(dur, f0=200, f1=8000, g=1.0):
    n = int(dur * SR); t = T(n)
    x = sweep(noise(n), f0, f1) * 0.32
    fr = 110 * 2 ** (2.5 * t / dur)
    s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * 0.18
    return (x + s) * (t / dur) ** 2.3 * 0.55 * g


def click(g=1.0, bright=1.0):
    n = int(0.03 * SR); t = T(n)
    x = bp(noise(n), 1400 * bright, 6500) * np.exp(-t * 420)
    x += np.sin(2 * np.pi * rng.uniform(160, 240) * t) * np.exp(-t * 170) * 0.45
    return x * 0.22 * g


def tick(g=1.0):
    n = int(0.014 * SR); t = T(n)
    x = hp(noise(n), 3000) * np.exp(-t * 900) + np.sin(2 * np.pi * 2700 * t) * np.exp(-t * 520) * 0.35
    return x * 0.16 * g


def woodtick(f=1750, g=1.0):
    n = int(0.07 * SR); t = T(n)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 85) + hp(noise(n), 4000) * np.exp(-t * 700) * 0.25
    return x * 0.2 * g


def pop(f0=900, f1=520, g=1.0):
    n = int(0.14 * SR); t = T(n)
    f = f1 + (f0 - f1) * np.exp(-t * 55)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) * np.minimum(1, t / 0.002) * 0.3 * g


def thud(f=65, g=1.0):
    n = int(0.45 * SR); t = T(n)
    fr = f + 55 * np.exp(-t * 40)
    s = np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-t * 8.5)
    s += lp(noise(n), 900) * np.exp(-t * 45) * 0.3
    return s * 0.5 * g


def scratch(dur=0.32, g=1.0):
    n = int(dur * SR); t = T(n); u = t / dur
    x = bp(noise(n), 1700, 5200)
    am = 0.65 + 0.35 * np.sin(2 * np.pi * 42 * t + 4 * np.sin(2 * np.pi * 7 * t))
    return x * am * np.sin(np.pi * np.clip(u, 0, 1)) ** 0.6 * 0.22 * g


def rattle(t0, t1, g=1.0):
    """Pills rattling in bottles; density and level rise toward t1."""
    t = t0
    while t < t1:
        p = (t - t0) / (t1 - t0)
        ln = int(0.012 * SR)
        x = bp(noise(ln), 2500, 9000) * np.exp(-T(ln) * 500)
        place(sfx, x, t, 0.12 * g * (0.3 + 0.7 * p) * rng.uniform(0.4, 1), rng.uniform(-0.8, 0.8))
        t += rng.uniform(0.006, 0.05) * (1.2 - p)


# ---------------------------------------------------------------- score
CH = {
    'Dmaj9': [50, 57, 61, 64, 66], 'Bm9': [47, 54, 57, 61, 62], 'Gmaj9': [43, 50, 54, 57, 59],
    'Em9': [52, 59, 62, 66, 67], 'Asus': [45, 52, 57, 62, 64], 'A': [45, 52, 57, 61, 64],
}
ROOT = {'Dmaj9': 38, 'Bm9': 35, 'Gmaj9': 31, 'Em9': 40, 'Asus': 33, 'A': 33}

# (start, end, chord, cutoff, gain)
PROG = [
    (6.2, 9.0, 'Dmaj9', 2400, 1.0),
    (9.0, 11.0, 'Bm9', 1800, 0.9), (11.0, 13.0, 'Gmaj9', 1800, 0.9), (13.0, 14.0, 'Asus', 1400, 0.9),
    (14.0, 16.0, 'Dmaj9', 3400, 0.85), (16.0, 18.0, 'Bm9', 3400, 0.85), (18.0, 20.0, 'Gmaj9', 3400, 0.85),
    (20.0, 22.0, 'Em9', 3400, 0.85), (22.0, 24.0, 'Gmaj9', 3400, 0.85), (24.0, 25.0, 'Asus', 3000, 0.85),
    (25.0, 27.0, 'Bm9', 750, 1.0), (27.0, 29.15, 'Gmaj9', 750, 1.0),
    (29.15, 31.0, 'Dmaj9', 4200, 0.9), (31.0, 33.0, 'Bm9', 3400, 0.85), (33.0, 34.0, 'Gmaj9', 3400, 0.85),
    (34.0, 35.2, 'A', 3000, 0.85),
]


def chord_at(t):
    for s, e, c, _, _ in PROG:
        if s <= t < e: return c
    return 'Dmaj9'


for s, e, c, cut, g in PROG:
    place(mus, pad(CH[c], e - s, cut, a=0.12 if s not in (6.2,) else 0.35, r=0.45), s, g, rev=0.35)

# -- S1 tension (0-3): dissonant low cluster, heartbeat pulse, rising ticks
place(mus, pad([38, 45, 51, 56], 2.95, 650, a=0.6, r=0.04, det=0.15, wob=3.0), 0.0, 1.5, rev=0.2)
for i, t in enumerate(np.arange(0.5, 3.0, 0.5)):
    place(mus, lp(kick(0.5 + 0.12 * i, tone=0.3), 300), t, 0.9)
for i, t in enumerate(np.arange(1.0, 2.99, 0.125)):
    place(mus, hat(0.25 + 0.5 * (i / 16)), t, 0.8, 0.3 * (-1) ** i)
place(sfx, riser(1.4, 300, 9000), 1.6, 1.0, rev=0.2)
for k in range(12):  # bottles settling in: soft glassy clinks
    place(sfx, bell(96 + int(rng.integers(0, 8)), 0.4, 0.25), 0.05 + k * 0.07 + rng.uniform(0, 0.04), 1, rng.uniform(-0.9, 0.9), rev=0.3)
rattle(2.35, 3.0, 1.0)
place(sfx, lp(noise(int(0.6 * SR)), 120) * np.linspace(0, 1, int(0.6 * SR)) ** 2 * 0.5, 2.4, 1.0)  # tremor rumble
for k in range(1, 25):  # "You take 12 supplements." typed
    place(sfx, click(0.9 if k not in (4, 9, 12) else 0.5), 0.25 + k * 0.04, 1, rng.uniform(-0.15, 0.15))
place(sfx, pop(700, 480, 0.6), 1.4, 1, 0.4)
for t in odo_ticks([3, 4, 0, 0], 1.5, 1.0, 0.04, cycles=3):  # ₹3,400 rolling
    place(sfx, tick(0.9), t, 1, 0.45)

# -- S2 shatter (3.0) and stats
place(sfx, boom(), 3.0, 0.95, rev=0.25)
place(sfx, shatter(), 3.0, 1.0, rev=0.3)
place(sfx, whoosh(0.7, 4000, 300, 0.12, 1.4), 2.98, 1, rev=0.2)
place(mus, pad([26, 38, 45], 2.4, 260, a=0.05, r=1.2, det=0.05), 3.0, 1.4, rev=0.4)
for t, m in ((3.6, 50), (4.0, 53), (4.4, 57)):
    place(sfx, thud(62, 0.9), t, 1)
    place(mus, ep(m, 1.6, 0.6), t, 0.8, rev=0.4)
place(sfx, whoosh(0.5, 900, 7000, 0.7, 0.45), 4.82, 1, 0.3)
place(sfx, whoosh(0.4, 6000, 500, 0.3, 0.6), 5.45, 1, rev=0.3)  # stats blur out
rev_sw = sum(bell(m, 1.2, 0.8) for m in (74, 78, 81, 85))[::-1]  # reversed bell swell into the hero line
place(mus, rev_sw, 6.2 - 1.2, 1.0, rev=0.3)

# -- S3 reframe
for i, m in enumerate((62, 66, 69, 73)):
    place(mus, ep(m, 2.4, 0.8), 6.2 + i * 0.08, 0.9, (-0.3, 0.1, 0.3, -0.1)[i], rev=0.45)
place(sfx, bell(93, 2.5, 1.2), 7.0, 1, 0.2, rev=0.6)   # the Signal-yellow "best"
place(sfx, bell(88, 2.0, 0.6), 7.05, 1, -0.3, rev=0.6)
place(sfx, whoosh(0.8, 600, 8000, 0.75, 0.4), 7.0, 1, rev=0.3)
place(mus, ep(73, 1.6, 0.7), 8.0, 0.7, rev=0.45); place(mus, ep(76, 1.6, 0.7), 8.5, 0.7, rev=0.45)

# -- transitions (incoming world sharpens)
for t, f0, f1, g in ((8.82, 400, 7000, 0.8), (13.8, 300, 9000, 1.1), (18.95, 500, 5000, 0.5),
                     (24.8, 6000, 400, 0.9), (29.8, 400, 9000, 1.0), (34.8, 300, 8000, 0.9)):
    place(sfx, whoosh(0.45, f0, f1, 0.6, g), t, 1, rev=0.25)

# -- drums
GROOVES = [(9.0, 13.0, 1.0), (14.0, 23.1, 0.85), (23.6, 25.0, 0.85), (30.0, 34.75, 1.0)]
for s, e, g in GROOVES:
    t = s; step = 0
    while t < e - 1e-6:
        b = step % 16
        if b in (0, 3, 10): place(mus, kick(g), t, 1.0)
        if b in (4, 12): place(mus, clap(g), t, 0.9, 0.05, rev=0.25)
        if b % 2 == 0: place(mus, hat(g * (1.0 if b % 4 == 2 else 0.55)), t, 0.9, 0.35)
        elif b in (7, 15): place(mus, hat(g * 0.35), t, 0.9, 0.35)
        if b == 14 and s >= 14: place(mus, hat(g * 0.5, True), t, 0.9, -0.3)
        t += 0.125; step += 1
place(sfx, riser(1.0, 250, 9000, 0.9), 13.0, 1, rev=0.2)
place(sfx, riser(1.2, 250, 9000, 0.9), 34.0, 1, rev=0.2)

# -- bass (quarters, octave on beat 4) under the grooves
for s, e, _ in GROOVES:
    t = s; q = 0
    while t < e - 1e-6:
        r = ROOT[chord_at(t)]
        place(mus, bass(r + (12 if q % 4 == 3 else 0), 0.42, 0.9), t, 1.0)
        t += 0.5; q += 1

# -- plucked arpeggio (8ths) in the light sections, slow and dark at night
PAT = [0, 2, 1, 3, 4, 2, 3, 1]
for s, e, stepd, gain, cut in ((14.0, 25.0, 0.25, 0.55, None), (30.0, 35.0, 0.25, 0.55, None), (25.2, 29.1, 0.5, 0.5, 1200)):
    t = s; k = 0
    while t < e - 1e-6:
        notes = CH[chord_at(t)]
        m = notes[PAT[k % 8]] + 12
        x = ep(m, 0.9, 0.9)
        if cut: x = lp(x, cut)
        place(mus, x, t, gain * (1.0 if k % 2 == 0 else 0.7), 0.4 * np.sin(k * 0.9), rev=0.35)
        t += stepd; k += 1

# -- S4 science: card pops, counters, glow chimes
for i, (digits, note) in enumerate((([4, 0], 74), ([3], 78), ([8], 81), ([2, 1], 85))):
    t0 = 9.2 + i * 0.3
    place(sfx, pop(880 + i * 110, 560 + i * 60, 0.8), t0, 1, (-0.4, 0.4, -0.4, 0.4)[i])
    for t in odo_ticks(digits, t0 + 0.25, 0.9, 0.03):
        place(sfx, tick(0.8), t, 1, (-0.4, 0.4, -0.4, 0.4)[i])
    place(sfx, bell(note, 1.6, 0.7), t0 + 1.2, 1, (-0.4, 0.4, -0.4, 0.4)[i], rev=0.5)

# -- S5 product reveal
place(sfx, bell(86, 2.2, 0.8), 14.05, 1, -0.2, rev=0.6)
place(sfx, whoosh(0.8, 300, 2500, 0.6, 0.35), 14.3, 1, -0.4)  # cup materialises
for k in range(1, 24):  # "Coffee, but for sleep ☾"
    place(sfx, click(0.85), 14.4 + k * 0.04, 1, rng.uniform(-0.15, 0.15))
place(sfx, whoosh(0.4, 700, 4000, 0.6, 0.35), 16.05, 1, 0.3)
place(sfx, whoosh(0.35, 400, 7000, 0.85, 1.1), 16.95, 1, 0.6, rev=0.2)  # sachet flies in
place(sfx, thud(75, 0.9), 17.28, 1, 0.1)
place(sfx, pop(620, 420, 0.5), 17.3, 1, 0.1)
for i in range(3):
    place(sfx, pop(1100 + i * 140, 800 + i * 100, 0.5), 17.9 + i * 0.12, 1, -0.3 + i * 0.3)

# -- S6 the label
for k in range(1, 41):  # "Every dose on the label. Nothing hidden."
    place(sfx, click(0.8), 19.45 + k * 0.03, 1, rng.uniform(-0.15, 0.15))
place(sfx, whoosh(0.5, 900, 7000, 0.7, 0.45), 20.72, 1, 0.3)
for i, digits in enumerate(([2, 0, 0], [1, 0, 0, 0], [5, 0], [5, 0, 0])):
    t0 = 20.2 + i * 0.8; pan = 0.5 if i % 2 else -0.1
    place(sfx, whoosh(0.35, 500, 6000, 0.7, 0.6), t0 - 0.05, 1, 0.7)
    place(sfx, thud(110, 0.5), t0 + 0.32, 1, pan)
    for t in odo_ticks(digits, t0 + 0.3, 0.75, 0.03):
        place(sfx, tick(0.75), t, 1, pan)
    place(sfx, bell((78, 81, 83, 86)[i], 1.2, 0.5), t0 + 0.95, 1, pan, rev=0.5)
place(mus, pad([44, 51, 56, 57], 0.9, 900, a=0.05, r=0.3, det=0.2), 23.15, 1.6)  # the "typical label": sour cluster
place(sfx, thud(48, 0.8), 23.15, 1)
place(sfx, scratch(0.34, 1.2), 23.58, 1, -0.5)
place(sfx, pop(1300, 950, 0.45), 23.62, 1, 0.4); place(sfx, pop(1500, 1100, 0.4), 23.87, 1, 0.4)

# -- S7 the ritual: clock, night, sunrise
place(sfx, whoosh(0.7, 300, 2000, 0.6, 0.3), 25.05, 1)
MINS = [(0, 0), (0.22, 15), (0.44, 30), (1, 510)]


def mins_at(p):
    for (p0, m0), (p1, m1) in zip(MINS, MINS[1:]):
        if p <= p1: return m0 + (m1 - m0) * (p - p0) / (p1 - p0)
    return 510


last = 0
for t in np.arange(25.5, 29.2, 0.001):  # a tick every 15 clock-minutes: time slows, then flies
    m = mins_at(min(1, (t - 25.5) / 3.7))
    if int(m // 15) > last:
        last = int(m // 15)
        place(sfx, woodtick(1750 if last % 2 else 1450, 0.8), t, 1, 0.25 * (-1) ** last, rev=0.3)
place(sfx, woodtick(1750, 0.8), 25.5, 1, rev=0.3)
for t in np.arange(25.5, 29.0, 1.0):  # night heartbeat
    place(mus, lp(kick(0.55, 0.2), 180), t, 1)
for t, m in ((25.45, 74), (26.26, 78), (27.08, 81)):
    place(sfx, bell(m, 2.4, 0.9), t, 1, rev=0.6)
place(mus, pad([69, 76, 81], 1.6, 3000, a=0.6, r=0.6), 27.1, 0.5, rev=0.5)  # moon glow
for m, pan in ((86, -0.3), (90, 0.3), (93, 0.0)):  # sunrise, "Wake up in a superstate"
    place(sfx, bell(m, 3.0, 1.0), 29.15, 1, pan, rev=0.6)
for i, t in enumerate(np.arange(29.4, 29.98, 0.0625)):
    place(mus, hat(0.25 + 0.75 * i / 9), t, 0.9, 0.3)

# -- S8 social proof
place(sfx, scratch(0.36, 1.0), 30.73, 1, -0.4)
place(sfx, pop(1200, 800, 0.8), 31.15, 1, -0.4); place(sfx, bell(90, 1.4, 0.6), 31.17, 1, -0.4, rev=0.5)
place(sfx, whoosh(0.6, 300, 3000, 0.6, 0.35), 30.35, 1, 0.5)
for k in range(1, 29):  # phone keyboard taps
    place(sfx, click(0.55, 1.6), 30.9 + k * 0.028, 1, 0.45)
place(sfx, whoosh(0.22, 800, 8000, 0.8, 0.5), 31.62, 1, 0.5); place(sfx, pop(1500, 1100, 0.6), 31.75, 1, 0.5)
place(sfx, bell(76, 1.2, 0.9), 32.35, 1, 0.4, rev=0.4); place(sfx, bell(81, 1.4, 0.9), 32.45, 1, 0.4, rev=0.4)
for i, m in enumerate((74, 76, 78, 81, 83)):  # stars fill
    place(sfx, bell(m + 12, 1.0, 0.55), 32.0 + i * 0.15, 1, -0.5 + i * 0.08, rev=0.45)
for t in odo_ticks([4, 8], 32.3, 0.8, 0.05):
    place(sfx, tick(0.7), t, 1, -0.4)
place(sfx, whoosh(0.5, 900, 7000, 0.7, 0.45), 33.97, 1, -0.3)

# -- S9 end card: resolve on D
place(sfx, boom(crack=0.25, g=0.7), 35.25, 1, rev=0.3)
place(mus, pad(CH['Dmaj9'] + [74], 5.9, 3000, a=0.04, r=0.9), 35.25, 1.25, rev=0.45)
place(mus, bass(26, 3.0, 1.2), 35.25, 1)
for i, m in enumerate((62, 66, 69, 73, 76)):
    place(mus, ep(m, 3.0, 0.8), 35.25 + i * 0.05, 0.8, -0.4 + i * 0.2, rev=0.5)
place(sfx, bell(86, 3.5, 0.9), 35.3, 1, -0.2, rev=0.6); place(sfx, bell(93, 3.5, 0.6), 35.32, 1, 0.2, rev=0.6)
place(sfx, whoosh(0.5, 600, 5000, 0.6, 0.3), 35.5, 1)
place(sfx, pop(1000, 700, 0.6), 35.92, 1)
place(sfx, tick(1.0), 36.3, 1); place(sfx, tick(1.0), 36.6, 1)
for t, m in ((37.2, 69), (38.2, 66), (39.2, 64), (40.0, 62)):
    place(mus, ep(m, 2.4, 0.7), t, 0.65, rev=0.55)
place(sfx, woodtick(2100, 0.5), 40.0, 1, 0.5)

# ---------------------------------------------------------------- mix & master
ir_n = int(2.6 * SR); it = T(ir_n)
ir = np.vstack([lp(noise(ir_n), 6000), lp(noise(ir_n), 6000)]) * np.exp(-it * 2.6)
ir[:, :int(0.018 * SR)] = 0
ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
wet = np.vstack([fftconvolve(send[c], ir[c])[:N] for c in range(2)])

mix = mus * 0.85 + sfx * 1.0 + wet * 0.55
mix = hp(mix, 28)
t = T(N)
mix *= np.minimum(1, t / 0.01) * np.clip((DUR - t) / 1.0, 0, 1)  # fade with the visual; silent at the loop point
mix = np.tanh(mix * 1.1) / np.tanh(1.1)
mix *= 0.89 / np.max(np.abs(mix))

out = sys.argv[1] if len(sys.argv) > 1 else 'sleep-well-trailer.wav'
pcm = (np.clip(mix.T, -1, 1) * 32767).astype('<i2')
import wave
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print(f'wrote {out}  peak {20*np.log10(np.max(np.abs(mix))):.1f} dBFS  rms {20*np.log10(np.sqrt(np.mean(mix**2))):.1f} dBFS')
