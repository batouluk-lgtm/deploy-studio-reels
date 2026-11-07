"""Self-made royalty-free beat + SFX for Deploy Studio reels.
usage: python3 audio.py spec.json out.wav
spec: {dur, bpm, sfx:[{t,k,g}], music:{drums_from, drums_to, breaks:[[a,b]], fade_out}}
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

def main(spec_path, out_path):
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

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
