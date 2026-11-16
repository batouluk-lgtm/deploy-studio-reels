import os
from playwright.sync_api import sync_playwright
os.makedirs('../../public/posts',exist_ok=True)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path="/usr/bin/google-chrome"); pg=b.new_page(viewport={"width":1200,"height":1500})
    pg.goto("file://"+os.path.abspath("c.html")); pg.wait_for_timeout(700)
    for i in range(1,8):
        pg.locator(f"#s{i}").screenshot(path=f"../../public/posts/2026-11-17-stress-{i}.jpg",type="jpeg",quality=90)
    b.close()
