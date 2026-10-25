import os
import sys
import time
import jwt
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

FRONTEND_URL = "http://localhost:5173"
JWT_SECRET = "instructoplus_jwt_secret_development_key_123"
STUDENT_ID = "6ab2eaf16de7eb9ba9d0e7a0"
EDUCATOR_ID = "6ab2eafa6de7eb9ba9d0e7a3"
COURSE_ID = "6ab2ed4c9ddae38400712550"
ARTIFACT_DIR = r"C:\Users\tanma\.gemini\antigravity\brain\87c9ebd3-2626-4047-81ca-bb6caf1009a0"

os.makedirs(ARTIFACT_DIR, exist_ok=True)

def generate_token(user_id):
    return jwt.encode(
        {"userId": user_id, "iat": int(time.time()), "exp": int(time.time()) + 86400},
        JWT_SECRET,
        algorithm="HS256"
    )

def init_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1440,920")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(10)
    return driver

def capture_screenshots():
    driver = init_driver()
    try:
        print("1. Capturing Light Mode Home...")
        driver.get(FRONTEND_URL)
        driver.execute_script("localStorage.setItem('instructoplus_theme', 'light');")
        driver.refresh()
        time.sleep(2)
        light_home_path = os.path.join(ARTIFACT_DIR, "instructoplus_light_mode.png")
        driver.save_screenshot(light_home_path)
        print(f"   Saved: {light_home_path}")

        print("2. Capturing Dark Mode Home...")
        toggle_btn = driver.find_element(By.ID, "theme-toggle-btn")
        toggle_btn.click()
        time.sleep(1.5)
        dark_home_path = os.path.join(ARTIFACT_DIR, "instructoplus_dark_mode.png")
        driver.save_screenshot(dark_home_path)
        print(f"   Saved: {dark_home_path}")

        print("3. Capturing Dark Mode Educator Dashboard...")
        # Authenticate as educator
        educator_token = generate_token(EDUCATOR_ID)
        driver.get(FRONTEND_URL + "/dashboard")
        driver.add_cookie({"name": "token", "value": educator_token, "path": "/"})
        driver.execute_script("localStorage.setItem('instructoplus_theme', 'dark');")
        driver.refresh()
        time.sleep(2.5)
        dashboard_path = os.path.join(ARTIFACT_DIR, "instructoplus_dark_dashboard.png")
        driver.save_screenshot(dashboard_path)
        print(f"   Saved: {dashboard_path}")

        print("4. Capturing Notes & Bookmarks in Lecture View...")
        # Authenticate as student
        student_token = generate_token(STUDENT_ID)
        driver.get(f"{FRONTEND_URL}/viewlecture/{COURSE_ID}")
        driver.add_cookie({"name": "token", "value": student_token, "path": "/"})
        driver.execute_script("localStorage.setItem('instructoplus_theme', 'dark');")
        driver.refresh()
        time.sleep(3)

        # Switch to Notes tab
        notes_tab = WebDriverWait(driver, 10).until(
            EC.element_to_be_clickable((By.ID, "tab-notes-btn"))
        )
        notes_tab.click()
        time.sleep(1.5)

        # Open export dropdown to show export options
        export_btn = driver.find_element(By.ID, "export-notes-btn")
        export_btn.click()
        time.sleep(1)

        notes_view_path = os.path.join(ARTIFACT_DIR, "instructoplus_notes_and_bookmarks.png")
        driver.save_screenshot(notes_view_path)
        print(f"   Saved: {notes_view_path}")

        print("\nAll screenshots captured successfully!")
    finally:
        driver.quit()

if __name__ == "__main__":
    capture_screenshots()
