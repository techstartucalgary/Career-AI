"""
Playwright script to drive the showcase frontend and capture screenshots.
Launches a SEPARATE browser (left half of screen) to observe the showcase UI.
The showcase's own Playwright browser will appear on the right half (x=720).
"""
import time
import os
from playwright.sync_api import sync_playwright

TOKEN = os.environ["SHOWCASE_TOKEN"]
FRONTEND_URL = "http://localhost:5173"
SCREENSHOT_DIR = os.path.dirname(os.path.abspath(__file__))

def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=[
                "--window-position=0,0",
                "--window-size=720,900",
            ],
        )
        context = browser.new_context(viewport={"width": 720, "height": 900})
        page = context.new_page()

        # Inject auth token into localStorage before navigating
        page.goto(FRONTEND_URL)
        page.evaluate(f"""() => {{
            window.localStorage.setItem('career_ai_token', '{TOKEN}');
        }}""")

        # Navigate to auto-apply page (which renders ShowcaseAgentView)
        page.goto(f"{FRONTEND_URL}/auto-apply")
        page.wait_for_load_state("networkidle")
        # Give the showcase status check time to complete
        time.sleep(3)

        # Screenshot 01: idle state
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01_idle_state.png"), full_page=False)
        print("[screenshot] 01_idle_state.png")

        # Look for the "Find Jobs" button and click it
        find_jobs_btn = page.locator("text=Find Jobs")
        if find_jobs_btn.count() > 0:
            print("[action] Clicking 'Find Jobs'")
            find_jobs_btn.first.click()
        else:
            # Maybe button says "Checking profile..."
            print("[warning] 'Find Jobs' button not found, looking for alternatives")
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, "01b_no_button.png"), full_page=False)
            # Try waiting
            time.sleep(5)
            find_jobs_btn = page.locator("text=Find Jobs")
            if find_jobs_btn.count() > 0:
                find_jobs_btn.first.click()
            else:
                print("[error] Could not find 'Find Jobs' button, aborting")
                browser.close()
                return

        # Capture screenshots every 4 seconds for 90 seconds
        start = time.time()
        idx = 2
        while time.time() - start < 90:
            time.sleep(4)
            elapsed = int(time.time() - start)
            filename = f"{idx:02d}_at_{elapsed}s.png"
            page.screenshot(path=os.path.join(SCREENSHOT_DIR, filename), full_page=False)
            print(f"[screenshot] {filename}")
            idx += 1

        # Final screenshot
        page.screenshot(path=os.path.join(SCREENSHOT_DIR, f"{idx:02d}_final.png"), full_page=False)
        print(f"[screenshot] {idx:02d}_final.png")

        # Wait a moment then close
        time.sleep(2)
        browser.close()
        print("[done] All screenshots captured")


if __name__ == "__main__":
    main()
