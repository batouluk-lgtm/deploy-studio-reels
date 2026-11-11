"""Обложка рилса в стиле «Бюро записи»: python3 lib/cover2.py N out.jpg  (запись N — в объекте C в cover2.html)."""
import os, sys
from playwright.sync_api import sync_playwright

n, out = sys.argv[1], sys.argv[2]
html = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "cover2.html")
with sync_playwright() as p:
    b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--force-color-profile=srgb"])
    pg = b.new_page(viewport={"width": 1080, "height": 1920}, device_scale_factor=1)
    pg.goto("file://" + os.path.abspath(html) + "#" + n)
    pg.evaluate("document.fonts.ready")
    pg.evaluate(f"setCover({int(n)})")
    pg.wait_for_timeout(200)
    pg.locator("#c").screenshot(path=out, type="jpeg", quality=92)
    b.close()
print(out)
