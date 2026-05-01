"""
Final showcase evidence capture.
Launches a separate Playwright browser at 720x900 on the left half.
Injects auth, navigates to /auto-apply, clicks Find Jobs, screenshots every 3s for 70s.
"""
import time
import os
from playwright.sync_api import sync_playwright

TOKEN = os.environ["SHOWCASE_TOKEN"]
FRONTEND_URL = "http://localhost:5173"
SCREENSHOT_DIR = os.path.dirname(os.path.abspath(__file__))
CAPTURE_DURATION = 70
CAPTURE_INTERVAL = 3


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=["--window-position=0,0", "--window-size=720,900"],
        )
        context = browser.new_context(viewport={"width": 720, "height": 900})
        page = context.new_page()

        # Inject auth
        page.goto(FRONTEND_URL)
        page.evaluate(f"""() => {{
            window.localStorage.setItem('career_ai_token', '{TOKEN}');
        }}""")

        # Navigate to showcase page
        page.goto(f"{FRONTEND_URL}/auto-apply")
        page.wait_for_load_state("networkidle")
        time.sleep(2)

        # Idle screenshot
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_idle.png"), full_page=False)
        print("[screenshot] 01_idle.png")

        # Click Find Jobs
        btn = page.locator("text=Find Jobs")
        if btn.count() > 0:
            print("[action] Clicking 'Find Jobs'")
            btn.first.click()
        else:
            time.sleep(3)
            btn = page.locator("text=Find Jobs")
            if btn.count() > 0:
                btn.first.click()
            else:
                print("[error] Find Jobs button not found")
                browser.close()
                return

        # Capture loop
        start = time.time()
        idx = 2
        while time.time() - start < CAPTURE_DURATION:
            time.sleep(CAPTURE_INTERVAL)
            elapsed = int(time.time() - start)
            filename = f"{idx:02d}_at_{elapsed}s.png"
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, filename), full_page=False)
            print(f"[screenshot] {filename}")
            idx += 1

        # Final
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"{idx:02d}_final.png"), full_page=False)
        print(f"[screenshot] {idx:02d}_final.png")

        time.sleep(1)
        browser.close()
        print(f"[done] {idx} screenshots captured")


if __name__ == "__main__":
    main()
