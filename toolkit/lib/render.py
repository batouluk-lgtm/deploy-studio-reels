"""usage:
  python3 render.py stills reel.html t1 t2 ...   -> stills/<name>_<t>.jpg + contact sheet
  python3 render.py video  reel.html out.mp4     -> silent video + spec -> audio -> muxed mp4
"""
import sys, os, json, subprocess
from playwright.sync_api import sync_playwright

LIB = os.path.dirname(os.path.abspath(__file__))
FPS = 30

def open_page(p, html):
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--force-color-profile=srgb"])
    pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    pg.goto("file://" + os.path.abspath(html))
    pg.evaluate("document.fonts.ready")
    return b, pg

def stills(html, ts):
    name = os.path.splitext(os.path.basename(html))[0]
    os.makedirs("stills", exist_ok=True)
    with sync_playwright() as p:
        b, pg = open_page(p, html)
        files = []
        for t in ts:
            pg.evaluate(f"render({t})")
            f = f"stills/{name}_{t}.jpg"; pg.screenshot(path=f, type="jpeg", quality=90); files.append(f)
        b.close()
    from PIL import Image
    cols = 4; rows = (len(files) + cols - 1) // cols
    W = Image.new("RGB", (270 * cols, 480 * rows), "white")
    for i, f in enumerate(files):
        W.paste(Image.open(f).resize((270, 480)), ((i % cols) * 270, (i // cols) * 480))
    W.save(f"stills/{name}_sheet.jpg", quality=88)
    print(f"stills/{name}_sheet.jpg")

def video(html, out):
    base = out[:-4]
    silent = base + ".silent.mp4"; tmp = base + ".part.mp4"
    with sync_playwright() as p:
        b, pg = open_page(p, html)
        dur = pg.evaluate("window.DUR")
        spec = {"dur": dur, "bpm": pg.evaluate("window.BPM||120"), "sfx": pg.evaluate("window.SFX"),
                "music": pg.evaluate("window.MUSIC||{}")}
        ff = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-c:v", "mjpeg", "-framerate", str(FPS), "-i", "-",
                               "-c:v", "libx264", "-preset", "veryfast", "-crf", "18", "-pix_fmt", "yuv420p", silent], stdin=subprocess.PIPE)
        for i in range(int(round(dur * FPS))):
            pg.evaluate(f"render({i / FPS})")
            ff.stdin.write(pg.screenshot(type="jpeg", quality=92))
        ff.stdin.close()
        if ff.wait() != 0: sys.exit("ffmpeg video failed")
        b.close()
    json.dump(spec, open(base + ".audio.json", "w"))
    subprocess.check_call(["python3", os.path.join(LIB, "audio.py"), base + ".audio.json", base + ".wav"])
    subprocess.check_call(["ffmpeg", "-y", "-loglevel", "error", "-i", silent, "-i", base + ".wav", "-map", "0:v", "-map", "1:a",
                           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-shortest", "-movflags", "+faststart", tmp])
    os.replace(tmp, out); os.remove(silent)
    print(out)

if __name__ == "__main__":
    if sys.argv[1] == "stills": stills(sys.argv[2], sys.argv[3:])
    else: video(sys.argv[2], sys.argv[3])
