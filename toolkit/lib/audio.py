"""Self-made royalty-free music + SFX for Deploy Studio reels.
usage: python3 audio.py spec.json out.wav
spec: {dur, bpm, sfx:[{t,k,g}], music:{preset, drums_from, drums_to, breaks:[[a,b]], fade_out, offset, off}}
presets (see toolkit/music_log.md): classic, lofi84, house122, garage132, boombap90, ambient70, office110, asmr
"""
import json, sys, wave
import numpy as np

SR = 48000
rng = np.random.default_rng(11)

def env(n, a, d):
    t = np.arange(n) / SR
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)

def lp(x, k):
    if k <= 1: return x
    return np.convolve(x, np.ones(k) / k, mode="same")

def hp(x, k): return x - lp(x, k)

def sine_sweep(f0, f1, n, rate):
    t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * rate)
    return np.sin(2 * np.pi * np.cumsum(f) / SR)

# ---------------- drums ----------------
def kick():
    n = int(.35 * SR)
    return sine_sweep(150, 46, n, 28) * env(n, .001, .13) * 1.0 + hp(rng.standard_normal(n), 3) * env(n, .0005, .003) * .25

def clap():
    n = int(.25 * SR); x = np.zeros(n); nz = hp(rng.standard_normal(n), 6)
    for d in (0, .010, .021):
        i = int(d * SR); x[i:] += nz[:n - i] * env(n - i, .0005, .006)
    x += lp(nz, 2) * env(n, .001, .06) * .6
    return x * .55

def hat(open_=False):
    n = int((.18 if open_ else .05) * SR)
    return hp(rng.standard_normal(n), 2) * env(n, .0005, .06 if open_ else .012) * .22

def bass_note(f, length):
    n = int(length * SR); t = np.arange(n) / SR
    saw = 2 * ((t * f) % 1) - 1
    x = lp(saw, 22) * .7 + np.sin(2 * np.pi * f * t) * .6
    return x * env(n, .004, length * .9) * .5

def pad(freqs, length):
    n = int(length * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f in freqs:
        for det in (-.004, .004):
            x += np.sin(2 * np.pi * f * (1 + det) * t)
    a = np.minimum(1, t / .25) * np.minimum(1, (length - t) / .3)
    return lp(x, 4) * a * .05

# ---------------- sfx ----------------
def s_tap():
    n = int(.06 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 1900 * t) * env(n, .001, .011) * .6 + hp(rng.standard_normal(n), 3) * env(n, .0005, .004) * .4

def s_key():
    n = int(.03 * SR)
    return hp(rng.standard_normal(n), 3) * env(n, .0005, .004) * .7

def s_whoosh(length=.45, up=True):
    n = int(length * SR); u = np.linspace(0, 1, n); nz = rng.standard_normal(n)
    m = u if up else 1 - u
    return (lp(nz, 40) * (1 - m) + lp(nz, 5) * m) * np.sin(np.pi * u) ** 2 * 1.2

def s_tone(f, length=.6, d=.25):
    n = int(length * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * t) + .25 * np.sin(4 * np.pi * f * t)) * env(n, .003, d)

def s_chime():
    out = np.zeros(int(1.1 * SR))
    for i, f in enumerate((1046.5, 1318.5, 1568)):
        s = s_tone(f, .8, .3); j = int(i * .09 * SR); out[j:j + len(s)] += s * .5
    return out

def s_ping():
    a, b = s_tone(1760, .35, .08), s_tone(2349, .5, .13)
    out = np.zeros(int(.6 * SR)); out[:len(a)] += a * .5; j = int(.09 * SR); out[j:j + len(b)] += b * .5
    return out

def s_hit():
    n = int(.6 * SR)
    return sine_sweep(110, 38, n, 9) * env(n, .001, .25) * 1.1 + lp(rng.standard_normal(n), 3) * env(n, .001, .05) * .35

def s_pop():
    n = int(.15 * SR)
    return sine_sweep(1400, 500, n, 40) * env(n, .001, .04) * .8

def s_riser(length=1.0):
    n = int(length * SR); u = np.linspace(0, 1, n); nz = rng.standard_normal(n)
    return (lp(nz, 30) * (1 - u) + lp(nz, 3) * u) * u ** 2 * .9

def s_tick():
    n = int(.04 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * 3200 * t) * env(n, .0005, .006) * .5

def s_error():
    n = int(.45 * SR); t = np.arange(n) / SR
    sq = np.sign(np.sin(2 * np.pi * 140 * t)) * .5 + np.sign(np.sin(2 * np.pi * 147 * t)) * .5
    return lp(sq, 6) * env(n, .003, .2) * .35

def s_swipe(): return s_whoosh(.3, True) * .9

SFXF = {"tap": s_tap, "key": s_key, "whoosh": s_whoosh, "whoosh_down": lambda: s_whoosh(.5, False), "swipe": s_swipe,
        "chime": s_chime, "ping": s_ping, "hit": s_hit, "pop": s_pop, "riser": s_riser, "riser2": lambda: s_riser(2.0),
        "tick": s_tick, "error": s_error}

# ---------------- cinematic sfx (no-music reels) ----------------
def s_boom():
    n = int(1.8 * SR)
    return sine_sweep(75, 28, n, 3.5) * env(n, .002, .7) * 1.2 + lp(rng.standard_normal(n), 60) * env(n, .002, .45) * 1.6

def s_impact():
    n = int(1.0 * SR)
    return sine_sweep(140, 40, n, 10) * env(n, .001, .3) * 1.0 + lp(hp(rng.standard_normal(n), 2), 3) * env(n, .0005, .03) * .6 + lp(rng.standard_normal(n), 25) * env(n, .002, .25) * .8

def s_cash():
    n = int(.7 * SR); x = np.zeros(n)
    for _ in range(26):
        i = int(rng.uniform(0, .6) * SR); L = int(.012 * SR)
        x[i:i + L] += lp(hp(rng.standard_normal(L), 2), 2) * env(L, .0005, .004) * rng.uniform(.3, 1)
    return x * 1.3

def s_coin():
    out = np.zeros(int(1.0 * SR))
    for j, t0 in enumerate((0, .07)):
        n = int(.8 * SR); t = np.arange(n) / SR; s = np.zeros(n)
        for f, a in ((2093, 1), (2637, .7), (3520, .5), (4699, .35), (5588, .2)):
            s += np.sin(2 * np.pi * f * (1 + .002 * j) * t) * a
        s = s * env(n, .0008, .22) * .22
        i = int(t0 * SR); out[i:i + n] += s[:len(out) - i]
    return out

def s_whip():
    n = int(.22 * SR); u = np.linspace(0, 1, n); nz = rng.standard_normal(n)
    return (lp(nz, 14) * (1 - u) + lp(nz, 3) * u) * np.sin(np.pi * u) ** 3 * 1.6

def s_wind(length=3.0):
    n = int(length * SR); u = np.linspace(0, 1, n); nz = lp(rng.standard_normal(n), 30)
    mod = .6 + .4 * np.sin(2 * np.pi * u * 2.3 + 1) * np.sin(2 * np.pi * u * .7)
    return nz * mod * np.minimum(1, u / .2) * np.minimum(1, (1 - u) / .3) * 2.2

def s_drone(length=4.0):
    n = int(length * SR); t = np.arange(n) / SR; u = t / length
    x = np.sin(2 * np.pi * 55 * t) * .5 + np.sin(2 * np.pi * 82.4 * t + np.sin(2 * np.pi * .3 * t)) * .3 + np.sin(2 * np.pi * 110.5 * t) * .12
    x += lp(rng.standard_normal(n), 80) * .4
    return x * np.minimum(1, u / .25) * np.minimum(1, (1 - u) / .3) * .5

def s_buzz():
    n = int(.6 * SR); t = np.arange(n) / SR
    g = ((t < .22) | ((t > .32) & (t < .54))).astype(float)
    x = lp(np.sign(np.sin(2 * np.pi * 175 * t)) * .6 + np.sin(2 * np.pi * 350 * t) * .3, 6)
    return x * g * .35

def s_heart():
    out = np.zeros(int(.9 * SR))
    for t0, a in ((0, 1), (.22, .7)):
        n = int(.3 * SR); s = sine_sweep(70, 40, n, 18) * env(n, .003, .08) * a
        i = int(t0 * SR); out[i:i + n] += s
    return out * 1.3

def s_whomp():
    n = int(1.2 * SR); u = np.linspace(0, 1, n)
    return sine_sweep(220, 35, n, 6) * env(n, .01, .4) * 1.2 + lp(rng.standard_normal(n), 20) * np.sin(np.pi * np.minimum(1, u * 3)) * env(n, .01, .3) * .6

def s_shimmer():
    out = np.zeros(int(1.6 * SR))
    for i in range(10):
        f = rng.choice([1568, 1760, 2093, 2349, 2637, 3136]); s = s_tone(f, 1.0, .35) * .12
        j = int(i * .08 * SR); out[j:j + len(s)] += s[:len(out) - j]
    return out

def s_swell():
    n = int(.6 * SR); u = np.linspace(0, 1, n); nz = rng.standard_normal(n)
    return (lp(nz, 20) * (1 - u) + lp(nz, 2) * u) * u ** 3 * 1.5

SFXF.update({"boom": s_boom, "impact": s_impact, "cash": s_cash, "coin": s_coin, "whip": s_whip, "wind3": s_wind,
             "drone4": s_drone, "buzz": s_buzz, "heart": s_heart, "whomp": s_whomp, "shimmer": s_shimmer, "swell": s_swell})

def classic_main(spec_path, out_path):
    spec = json.load(open(spec_path))
    dur, bpm = spec["dur"], spec.get("bpm", 120)
    m = spec.get("music", {})
    beat = 60 / bpm
    N = int(dur * SR) + SR
    drums = np.zeros(N); music = np.zeros(N); fx = np.zeros(N); duck = np.ones(N)

    def put(buf, sig, t, g=1.0):
        i = int(t * SR)
        if i >= len(buf) or i < 0: return
        e = min(len(buf), i + len(sig)); buf[i:e] += sig[:e - i] * g

    breaks = m.get("breaks", [])
    in_break = lambda t: any(a <= t < b for a, b in breaks)
    d0, d1 = m.get("drums_from", 0), m.get("drums_to", dur)
    k = kick()
    # A minor-ish loop: Am F C G (one chord per bar)
    roots = [110.0, 87.31, 130.81, 98.0]
    chords = [(220, 261.6, 329.6), (174.6, 220, 261.6), (261.6, 329.6, 392), (196, 246.9, 293.7)]
    # "offset": shift the beat grid so a downbeat lands on a given time (e.g. the first hard cut of a supplied video)
    off = m.get("offset", 0.0)
    b0 = int(np.ceil(off / (4 * beat))) * 4  # whole bars before the offset
    nbeats = int((dur + b0 * beat) / beat) + 1
    for bi in range(nbeats):
        b = bi
        t = off + (bi - b0) * beat
        if t < 0:
            continue
        bar = (b // 4) % 4
        if m.get("off"):
            continue
        if b % 4 == 0:
            put(music, pad(chords[bar], 4 * beat), t)
        if not (d0 <= t < d1) or in_break(t):
            continue
        put(drums, k, t, .9)
        i = int(t * SR); L = int(.18 * SR)
        duck[i:i + L] = np.minimum(duck[i:i + L], .35 + .65 * np.linspace(0, 1, min(L, N - i)))
        if b % 2 == 1: put(drums, clap(), t, .7)
        put(drums, hat(), t + beat / 2, 1)
        put(drums, hat(), t, .6)
        if b % 4 == 3: put(drums, hat(True), t + beat / 2, .8)
        # bass on eighths following root
        f = roots[bar]
        put(music, bass_note(f, beat / 2 * .95), t + beat / 2, 1)
        if b % 2 == 0: put(music, bass_note(f, beat / 2 * .9), t, .8)

    for e in spec["sfx"]:
        f = SFXF.get(e["k"])
        if f: put(fx, f(), e["t"], e.get("g", 1))

    mixd = drums * .8 + music * duck * .9 + fx * 1.0
    mixd = mixd[:int(dur * SR)]
    fo = m.get("fade_out", .6)
    n = int(fo * SR); mixd[-n:] *= np.linspace(1, 0, n)
    fi = int(.03 * SR); mixd[:fi] *= np.linspace(0, 1, fi)
    pk = np.max(np.abs(mixd)) or 1
    mixd = np.tanh(mixd / pk * 1.6) / np.tanh(1.6) * .89
    pcm = (mixd * 32767).astype(np.int16)
    st = np.repeat(pcm[:, None], 2, axis=1)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st.tobytes())

# =====================================================================
#  «Бюро записи» (с 2026-11-12): музыкальные пресеты и звуки бюро
# =====================================================================
R2 = np.random.default_rng(2026)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)

def fftconv(x, h):
    n = len(x) + len(h) - 1; N = 1 << (n - 1).bit_length()
    return np.fft.irfft(np.fft.rfft(x, N) * np.fft.rfft(h, N), N)[:len(x)]

def reverb(x, secs=1.6, wet=.3, damp=6):
    n = int(secs * SR); t = np.arange(n) / SR
    ir = lp(R2.standard_normal(n), damp) * np.exp(-t * 6.9 / secs); ir[0] = 0
    y = fftconv(x, ir); y /= (np.max(np.abs(y)) or 1) / (np.max(np.abs(x)) or 1)
    return x * (1 - wet) + y * wet

def adsr(n, a, d, s=0.0, rel=None):
    t = np.arange(n) / SR
    e = np.minimum(1, t / max(a, 1e-4)) * (s + (1 - s) * np.exp(-t / d))
    if rel: e *= np.minimum(1, (n / SR - t) / rel)
    return e

# ---------- instruments ----------
def ep(f, L, g=1.0):          # electric piano (Rhodes-like), soft tremolo
    n = int(L * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t + .8 * np.sin(2 * np.pi * f * t) * np.exp(-t / .15)) + .25 * np.sin(4 * np.pi * f * t) * np.exp(-t / .3)
    x += .2 * np.sin(2 * np.pi * f * 7.02 * t) * np.exp(-t / .03)
    return x * adsr(n, .004, .9, .25, .08) * (1 + .12 * np.sin(2 * np.pi * 4.5 * t)) * .22 * g

def piano(f, L, g=1.0):       # felt piano
    n = int(L * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, a in ((1, 1), (2, .45), (3, .22), (4, .12), (5, .06)):
        x += a * np.sin(2 * np.pi * f * k * (1 + .0007 * k * k) * t) * np.exp(-t * (1.2 + k * .9))
    return lp(x, 3) * adsr(n, .012, 9, 1, .1) * .26 * g

def marimba(f, L=.5, g=1.0):
    n = int(L * SR); t = np.arange(n) / SR
    x = np.sin(2 * np.pi * f * t) * np.exp(-t / .18) + .35 * np.sin(2 * np.pi * f * 3.93 * t) * np.exp(-t / .025)
    return x * np.minimum(1, t / .0015) * .35 * g

def organ(f, L, g=1.0):       # house organ stab
    n = int(L * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for k, a in ((1, 1), (2, .7), (3, .45), (4, .3), (6, .15)):
        x += a * np.sin(2 * np.pi * f * k * t)
    return lp(x, 3) * adsr(n, .003, .09, .0, .02) * .16 * g

def pluck(f, L, g=1.0):       # garage chopped pluck (bright saw, fast decay)
    n = int(L * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for det in (-.006, 0, .006):
        x += 2 * ((t * f * (1 + det)) % 1) - 1
    x = lp(x, 5) * .6 + lp(x, 18) * .4
    return x * adsr(n, .002, .12, .0, .02) * .09 * g

def subbass(f, L, g=1.0, glide=0):
    n = int(L * SR); t = np.arange(n) / SR
    ff = f * (1 + glide * np.exp(-t * 30))
    return np.sin(2 * np.pi * np.cumsum(ff) / SR) * adsr(n, .006, L * 1.5, .6, .03) * .55 * g

def pad2(freqs, L, g=1.0, bright=4):
    n = int(L * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f in freqs:
        for det in (-.005, 0, .005):
            x += np.sin(2 * np.pi * f * (1 + det) * t + det * 300)
    a = np.minimum(1, t / (L * .35)) * np.minimum(1, (L - t) / (L * .3))
    return lp(x, bright) * a * .035 * g

# ---------- drum kits ----------
def k_dusty():
    n = int(.4 * SR); return lp(sine_sweep(110, 44, n, 22) * env(n, .003, .16), 6) * 1.1
def k_house():
    n = int(.42 * SR); return sine_sweep(170, 50, n, 32) * env(n, .001, .17) * 1.05 + hp(R2.standard_normal(n), 2) * env(n, .0004, .002) * .3
def k_garage():
    n = int(.5 * SR); return sine_sweep(140, 42, n, 20) * env(n, .001, .24) * 1.1
def k_bap():
    n = int(.45 * SR); return np.tanh(sine_sweep(130, 48, n, 25) * env(n, .001, .2) * 2.2) * .8 + lp(R2.standard_normal(n), 3) * env(n, .001, .012) * .5
def sn_bap():
    n = int(.3 * SR); nz = R2.standard_normal(n)
    return (lp(nz, 3) * env(n, .001, .07) * .55 + np.sin(2 * np.pi * 190 * np.arange(n) / SR) * env(n, .001, .04) * .5) * .9
def sn_lofi(): return lp(sn_bap(), 5) * 1.2
def rim():
    n = int(.08 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 1650 * t) * .5 + hp(R2.standard_normal(n), 2) * .5) * env(n, .0005, .012) * .6
def shaker():
    n = int(.07 * SR); return hp(R2.standard_normal(n), 2) * adsr(n, .012, .02) * .14
def hat2(open_=False, tone=2):
    n = int((.22 if open_ else .045) * SR)
    return hp(R2.standard_normal(n), tone) * env(n, .0005, .07 if open_ else .01) * .2

# ---------- bureau sounds (SFX + office kit) ----------
def s_flap():        # split-flap: two light plastic clicks
    out = np.zeros(int(.05 * SR))
    for d, a in ((0, 1), (.011, .55)):
        n = int(.018 * SR); t = np.arange(n) / SR
        c = (hp(R2.standard_normal(n), 2) * .6 + np.sin(2 * np.pi * 2300 * t) * .5) * env(n, .0003, .0025) * a
        i = int(d * SR); out[i:i + n] += c
    return out * .7
def s_flap_set():    # the final flap lands: deeper clack
    n = int(.06 * SR); t = np.arange(n) / SR
    return (hp(R2.standard_normal(n), 3) * .5 + np.sin(2 * np.pi * 900 * t) * .6) * env(n, .0004, .006) * .8
def s_printer(L=.55):  # thermal printer: buzzy stepper + paper hiss
    n = int(L * SR); t = np.arange(n) / SR
    step = np.sign(np.sin(2 * np.pi * 330 * t)) * (.5 + .5 * np.sign(np.sin(2 * np.pi * 37 * t)))
    x = lp(step, 7) * .25 + hp(R2.standard_normal(n), 2) * .06 + np.sin(2 * np.pi * 1320 * t) * .05
    return x * np.minimum(1, t / .02) * np.minimum(1, (L - t) / .03) * .9
def s_stamp():       # rubber stamp hits the desk
    n = int(.45 * SR)
    return sine_sweep(160, 55, n, 30) * env(n, .001, .07) * 1.1 + lp(R2.standard_normal(n), 4) * env(n, .0008, .025) * .8 + lp(R2.standard_normal(n), 30) * env(n, .002, .09) * .5
def s_tear():        # paper tear along perforation
    L = .5; n = int(L * SR); x = np.zeros(n); u = np.linspace(0, 1, n)
    for _ in range(140):
        i = int(R2.uniform(0, .46) * SR); m = int(.004 * SR)
        x[i:i + m] += hp(R2.standard_normal(m), 2) * R2.uniform(.2, 1)
    x = x + lp(R2.standard_normal(n), 3) * .15
    return x * np.sin(np.pi * u) ** .6 * .55
def s_rustle():
    L = .6; n = int(L * SR); u = np.linspace(0, 1, n)
    am = lp(np.abs(R2.standard_normal(n)), 900)
    return hp(lp(R2.standard_normal(n), 2), 6) * am * np.sin(np.pi * u) * 1.4
def s_bell():        # desk service bell
    n = int(2.2 * SR); t = np.arange(n) / SR; x = np.zeros(n)
    for f, a, d in ((2093, 1, 1.4), (2093 * 2.76, .45, .5), (2093 * 5.4, .25, .2), (2093 * 1.003, .7, 1.2)):
        x += a * np.sin(2 * np.pi * f * t) * np.exp(-t / d)
    return x * np.minimum(1, t / .001) * .28
def s_type():        # typewriter key
    n = int(.07 * SR); t = np.arange(n) / SR
    return (sine_sweep(320, 140, n, 60) * env(n, .0005, .015) * .7 + hp(R2.standard_normal(n), 2) * env(n, .0003, .004) * .7) * .8
def s_ding():        # carriage-return bell
    n = int(1.2 * SR); t = np.arange(n) / SR
    return (np.sin(2 * np.pi * 3520 * t) + .4 * np.sin(2 * np.pi * 3520 * 2.4 * t)) * np.exp(-t / .35) * .22
def s_slide():       # paper slides on desk (soft, replaces digital whoosh)
    L = .35; n = int(L * SR); u = np.linspace(0, 1, n)
    return lp(hp(R2.standard_normal(n), 8), 3) * np.sin(np.pi * u) ** 2 * .8
def s_drop():        # card/paper lands on a stack
    n = int(.12 * SR)
    return (lp(R2.standard_normal(n), 5) * env(n, .001, .02) * .9 + sine_sweep(220, 90, n, 40) * env(n, .001, .03) * .5)
def s_enter():       # terminal enter key (soft)
    n = int(.08 * SR); return (lp(R2.standard_normal(n), 3) * env(n, .0005, .01) + sine_sweep(500, 200, n, 50) * env(n, .001, .02) * .4) * .7

SFXF.update({"flap": s_flap, "flap_set": s_flap_set, "printer": s_printer, "printer_l": lambda: s_printer(1.2),
             "stamp": s_stamp, "tear": s_tear, "rustle": s_rustle, "bell": s_bell, "type": s_type, "ding": s_ding,
             "slide": s_slide, "drop": s_drop, "enter": s_enter})

# ---------- presets ----------
def addz(a, b):
    n = max(len(a), len(b)); o = np.zeros(n); o[:len(a)] += a; o[:len(b)] += b; return o

def steps(p): return [i for i, c in enumerate(p) if c != "."]

PRESETS = {
    # lo-fi: dusty swung beat, Rhodes jazz chords, vinyl crackle — тёплый, ленивый
    "lofi84": dict(bpm=84, swing=.6, kit="lofi", lp=5,
                   K=["x.....x...x.....", "x.....x..x...x.."], S=["....x.......x..."], H=["x.x.x.x.x.x.x.x."],
                   chords=[[62, 65, 69, 72, 76], [55, 65, 69, 71, 76], [60, 64, 67, 71, 74], [57, 61, 64, 67, 72]],
                   roots=[38, 43, 36, 45], inst="ep", comp="x.........x.....", vinyl=True, verb=(1.2, .2)),
    # минимал-хаус: прямая бочка, офбит-хэты, органные стабы
    "house122": dict(bpm=122, swing=.5, kit="house",
                     K=["x...x...x...x..."], S=["....x.......x..."], H=["..x...x...x...x."], SH="xxxxxxxxxxxxxxxx",
                     chords=[[57, 60, 64, 67], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 67]],
                     roots=[33, 33, 29, 31], inst="organ", comp="...x..x....x..x.", bassp="..x...x...x..xx.", verb=(.8, .15)),
    # UK garage 2-step: ломаная бочка, шаффл, рубленые плаки, саб с глайдом
    "garage132": dict(bpm=132, swing=.64, kit="garage",
                      K=["x.........x.....", "x.......x.x....."], S=["....x.......x..."], H=["x.xxx.x.x.xxx.x."],
                      chords=[[65, 68, 72, 75], [58, 65, 68, 73], [63, 67, 70, 74], [56, 63, 67, 72]],
                      roots=[29, 34, 27, 32], inst="pluck", comp="x..x..x...x..x..", bassp="x.....x...x..x..", verb=(1.0, .2)),
    # бум-бэп: тяжёлые бочка/снейр, пиано-чоп в миноре
    "boombap90": dict(bpm=90, swing=.57, kit="bap",
                      K=["x......x..x.....", "x.x....x..x....."], S=["....x.......x..."], H=["x.x.x.x.x.x.x.x."],
                      chords=[[60, 63, 67], [56, 60, 63], [53, 56, 60, 63], [55, 59, 62]],
                      roots=[36, 32, 29, 31], inst="piano", comp="x.....x...x.....", bassp="x......x..x.....", verb=(.9, .15)),
    # эмбиент: без ударных, фетровое пиано арпеджио + пэд, длинный хвост
    "ambient70": dict(bpm=70, swing=.5, kit=None,
                      chords=[[60, 64, 67, 71], [57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 69]],
                      roots=[36, 33, 29, 31], inst="arp", verb=(2.6, .45)),
    # «офисный» груув: ударные из звуков бюро (штамп, машинка, бумага, колокольчик) + маримба
    "office110": dict(bpm=110, swing=.55, kit="office",
                      K=["x.....x...x.....", "x.....x...x...x."], S=["....x.......x..."], H=["x.xxx.xxx.xxx.xx"],
                      chords=[[64, 67, 71], [60, 64, 67], [62, 66, 69], [59, 62, 66]],
                      roots=[40, 36, 38, 35], inst="marimba", mel=[76, 79, 83, 81, 79, 76, 74, 76, 72, 76, 79, 76, 74, 78, 81, 78],
                      bassp="x.....x...x.....", verb=(.7, .15)),
    # ASMR: без музыки, только тон комнаты; звук делают эффекты бюро
    "asmr": dict(bpm=120, kit=None, inst=None, roomtone=True),
}

def build_music(spec):
    m = spec.get("music", {}); dur = spec["dur"]
    P = PRESETS[m["preset"]]
    bpm = spec.get("bpm") or P["bpm"]; beat = 60 / bpm; st = beat / 4
    N = int(dur * SR) + 2 * SR
    drums = np.zeros(N); harm = np.zeros(N); bass = np.zeros(N); duck = np.ones(N); extra = np.zeros(N)

    def put(buf, sig, t, g=1.0):
        i = int(t * SR)
        if i < 0 or i >= len(buf): return
        e = min(len(buf), i + len(sig)); buf[i:e] += sig[:e - i] * g

    off = m.get("offset", 0.0); d0, d1 = m.get("drums_from", 0), m.get("drums_to", dur)
    breaks = m.get("breaks", []); in_break = lambda t: any(a <= t < b for a, b in breaks)
    sw = P.get("swing", .5)
    def stime(bar_t, s):  # swung 16th
        return bar_t + (s // 2) * 2 * st + (s % 2) * 2 * st * sw
    kit = P.get("kit")
    kits = {"lofi": (k_dusty, sn_lofi, lambda: hat2(False, 3) * .7),
            "house": (k_house, clap, lambda: hat2(True, 2) * .9),
            "garage": (k_garage, lambda: addz(clap() * .8, rim() * .6), lambda: hat2(False, 2)),
            "bap": (k_bap, sn_bap, lambda: hat2(False, 2) * .8),
            "office": (lambda: s_stamp() * .9, lambda: addz(s_rustle()[:int(.25 * SR)] * 1.2, rim() * .3), lambda: s_type() * .5)}
    nb = int((dur - off) / (4 * beat)) + 2
    b0 = int(np.ceil(off / (4 * beat)))
    rng3 = np.random.default_rng(7)
    for bi in range(-b0, nb):
        T = off + bi * 4 * beat
        if T + 4 * beat < 0: continue
        ci = bi % 4
        ch = P.get("chords"); inst = P.get("inst")
        # ---- harmony ----
        if ch and not m.get("off"):
            notes = [mtof(x) for x in ch[ci]]
            if inst == "ep":
                for s in steps(P["comp"]):
                    for j, f in enumerate(notes): put(harm, ep(f, 4 * beat - s * st + .2, .8), stime(T, s) + j * .012)
            elif inst in ("organ", "pluck"):
                fn = organ if inst == "organ" else pluck
                for s in steps(P["comp"]):
                    for f in notes: put(harm, fn(f, st * 1.6), stime(T, s))
                put(harm, pad2([f / 2 for f in notes[:3]], 4 * beat, .5), T)
            elif inst == "piano":
                for s in steps(P["comp"]):
                    for j, f in enumerate(notes): put(harm, piano(f, beat * 2.2, .9), stime(T, s) + j * .008)
            elif inst == "arp":
                put(harm, pad2([f / 2 for f in notes], 4 * beat + .6, 1.3, 6), T)
                seq = notes + [notes[1] * 2, notes[2] * 2]
                for s in range(0, 16, 2):
                    put(harm, piano(seq[(s // 2 * 3 + bi) % len(seq)], beat * 3, .55), T + s * st)
            elif inst == "marimba":
                for s in range(16):
                    if s % 2 == 0 or rng3.random() < .25:
                        put(harm, marimba(mtof(P["mel"][(s + bi * 3) % 16]), .5, .8 if s % 4 == 0 else .55), stime(T, s))
                put(harm, pad2([f for f in notes], 4 * beat, .6, 8), T)
        # ---- bass ----
        if P.get("roots") and not m.get("off"):
            f = mtof(P["roots"][ci] + 12)
            bp = P.get("bassp")
            if bp:
                for s in steps(bp):
                    t = stime(T, s)
                    if d0 <= t < d1 and not in_break(t):
                        put(bass, subbass(f * (2 if inst == "organ" and s % 4 == 3 else 1), st * 1.8, 1, .5 if kit == "garage" else 0), t)
            elif inst in ("ep",):
                put(bass, subbass(f, beat * 3.5, .9), T); put(bass, subbass(f * 1.5, beat * .9, .6), T + beat * 3.5 - .05)
            elif inst == "arp":
                put(bass, subbass(f / 2, 4 * beat, .5), T)
        # ---- drums ----
        if not kit: continue
        K, S, H = kits[kit]
        def inrange(t): return d0 <= t < d1 and not in_break(t)
        for s in steps(P["K"][bi % len(P["K"])]):
            t = stime(T, s)
            if inrange(t):
                put(drums, K(), t, .95)
                i = int(t * SR); L = int(.16 * SR)
                if 0 <= i < N: duck[i:i + L] = np.minimum(duck[i:i + L], .45 + .55 * np.linspace(0, 1, min(L, N - i)))
        for s in steps(P["S"][0]):
            t = stime(T, s)
            if inrange(t): put(drums, S(), t, .75)
        for s in steps(P["H"][0]):
            t = stime(T, s)
            if inrange(t): put(drums, H(), t, (.8 if s % 4 == 2 else .45) * rng3.uniform(.8, 1.1))
        if P.get("SH"):
            for s in steps(P["SH"]):
                t = stime(T, s)
                if inrange(t): put(drums, shaker(), t, .6)
        if kit == "office" and bi % 2 == 0 and inrange(T): put(extra, s_bell(), T, .25)
    if P.get("lp"): harm = lp(harm, P["lp"]); drums = lp(drums, 2)
    if P.get("verb"): harm = reverb(harm, *P["verb"])
    if P.get("vinyl"):
        crack = np.zeros(N)
        for _ in range(int(dur * 9)):
            i = int(R2.uniform(0, dur) * SR); L = int(.003 * SR)
            crack[i:i + L] += hp(R2.standard_normal(L), 2) * R2.uniform(.05, .35)
        extra += crack * .5 + lp(R2.standard_normal(N), 12) * .012
    if P.get("roomtone"):
        extra += lp(R2.standard_normal(N), 60) * .05 + lp(R2.standard_normal(N), 8) * .004
    return drums * .8 + harm * duck * .9 + bass * duck * .8 + extra

def main(spec_path, out_path):
    spec = json.load(open(spec_path)); m = spec.get("music", {})
    if not m.get("preset") or m["preset"] == "classic":
        return classic_main(spec_path, out_path)
    dur = spec["dur"]; N = int(dur * SR) + 2 * SR
    mus = build_music(spec) * m.get("gain", 1.0)
    fx = np.zeros(N)
    for e in spec["sfx"]:
        f = SFXF.get(e["k"])
        if f:
            sig = f(); i = int(e["t"] * SR)
            if 0 <= i < N:
                k = min(N, i + len(sig)); fx[i:k] += sig[:k - i] * e.get("g", 1)
    # sfx sit on top: light sidechain of music under strong sfx
    envfx = lp(np.abs(fx), 2400)
    mus = mus * (1 - np.clip(envfx * .9, 0, .5))
    mixd = (mus + fx * 1.0)[:int(dur * SR)]
    fo = m.get("fade_out", .6); n = int(fo * SR); mixd[-n:] *= np.linspace(1, 0, n) ** 1.5
    fi = int(.02 * SR); mixd[:fi] *= np.linspace(0, 1, fi)
    pk = np.max(np.abs(mixd)) or 1
    mixd = np.tanh(mixd / pk * 1.5) / np.tanh(1.5) * .89
    pcm = (mixd * 32767).astype(np.int16)
    # slight stereo width: harmony is mono, but delay the right channel by 0 (keep mono-safe)
    st_ = np.repeat(pcm[:, None], 2, axis=1)
    with wave.open(out_path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(st_.tobytes())

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])

