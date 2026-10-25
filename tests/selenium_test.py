import os
import sys
import time
import json
import jwt
import requests

if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

FRONTEND_URL = "http://localhost:5173"
BACKEND_URL = "http://localhost:8000"
JWT_SECRET = "instructoplus_jwt_secret_development_key_123"

# Real seeded IDs from local MongoDB
REAL_USER_ID = "6ab2eaf16de7eb9ba9d0e7a0"
REAL_COURSE_ID = "6ab2ed4c9ddae38400712550"
REAL_LECTURE_ID = "6ab2ed4c9ddae38400712552"

def init_driver():
    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,800")
    options.add_argument("--disable-blink-features=AutomationControlled")
    driver = webdriver.Chrome(options=options)
    driver.implicitly_wait(10)
    return driver

def test_dark_mode(driver):
    print("\n" + "="*60)
    print("▶ RUNNING TEST 1: Dark Mode Toggle & Persistence via Selenium")
    print("="*60)

    driver.get(FRONTEND_URL)
    # Ensure clean baseline start for test
    driver.execute_script("localStorage.setItem('instructoplus_theme', 'light');")
    driver.refresh()
    time.sleep(1)

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "theme-toggle-btn"))
    )

    toggle_btn = driver.find_element(By.ID, "theme-toggle-btn")
    html_elem = driver.find_element(By.TAG_NAME, "html")

    # Step 1: Check initial light state
    initial_classes = html_elem.get_attribute("class") or ""
    print(f"1. Baseline <html> classes: '{initial_classes}'")
    assert "dark" not in initial_classes, "Baseline should be light mode"

    # Step 2: Click to toggle to Dark Mode
    toggle_btn.click()
    time.sleep(1)

    dark_classes = html_elem.get_attribute("class") or ""
    saved_theme = driver.execute_script("return localStorage.getItem('instructoplus_theme');")
    print(f"2. After 1st click -> <html> classes: '{dark_classes}', localStorage: '{saved_theme}'")
    assert "dark" in dark_classes, "Expected 'dark' class on <html> after clicking theme toggle"
    assert saved_theme == "dark", f"Expected localStorage 'dark', got '{saved_theme}'"

    # Step 3: Click again to toggle back to Light Mode
    toggle_btn.click()
    time.sleep(1)

    light_classes = html_elem.get_attribute("class") or ""
    saved_theme_light = driver.execute_script("return localStorage.getItem('instructoplus_theme');")
    print(f"3. After 2nd click -> <html> classes: '{light_classes}', localStorage: '{saved_theme_light}'")
    assert "dark" not in light_classes, "Expected 'dark' class removed from <html> after second click"
    assert saved_theme_light == "light", f"Expected localStorage 'light', got '{saved_theme_light}'"

    # Step 4: Verify persistence on page refresh
    driver.execute_script("localStorage.setItem('instructoplus_theme', 'dark');")
    driver.refresh()
    time.sleep(1.5)

    refreshed_html = driver.find_element(By.TAG_NAME, "html")
    refreshed_classes = refreshed_html.get_attribute("class") or ""
    print(f"4. After page reload with localStorage='dark' -> <html> classes: '{refreshed_classes}'")
    assert "dark" in refreshed_classes, "Dark mode preference must persist across page reload"

    print("✔ [PASS] Test 1: Dark Mode Toggle & Persistence PASSED!")

def test_notes_backend_api():
    print("\n" + "="*60)
    print("▶ RUNNING TEST 2: Personalized Notes & Bookmarks API")
    print("="*60)

    # 1. Unauthenticated request must return 401
    unauth_res = requests.post(f"{BACKEND_URL}/api/notes", json={"content": "test"})
    print(f"1. Unauthenticated request returned HTTP {unauth_res.status_code}")
    assert unauth_res.status_code == 401, f"Expected 401, got {unauth_res.status_code}"

    # 2. Authenticated test user token
    token = jwt.encode(
        {"userId": REAL_USER_ID, "iat": int(time.time()), "exp": int(time.time()) + 3600},
        JWT_SECRET,
        algorithm="HS256"
    )
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    cookies = {"token": token}

    # 3. Create Note with Timestamp & Tags
    note_payload = {
        "courseId": REAL_COURSE_ID,
        "lectureId": REAL_LECTURE_ID,
        "timestamp": 142, # 2 min 22 sec
        "content": "Key Takeaway: Understanding React reconciliation and Virtual DOM diffing.",
        "tags": ["Important", "Bookmark"]
    }
    create_res = requests.post(f"{BACKEND_URL}/api/notes", json=note_payload, headers=headers, cookies=cookies)
    print(f"2. Create Note returned HTTP {create_res.status_code}")
    assert create_res.status_code == 201, f"Expected 201 Created, got {create_res.status_code}: {create_res.text}"
    
    created_note = create_res.json().get("note", {})
    note_id = created_note.get("_id")
    assert note_id, "Note _id must be returned"
    assert created_note.get("timestamp") == 142, "Timestamp must be 142s"
    assert "Important" in created_note.get("tags", []), "Expected 'Important' tag in note"
    print(f"   Created Note ID: {note_id} at timestamp {created_note.get('timestamp')}s")

    # 4. Fetch Course Notes
    fetch_res = requests.get(f"{BACKEND_URL}/api/notes/course/{REAL_COURSE_ID}", headers=headers, cookies=cookies)
    print(f"3. Get Course Notes returned HTTP {fetch_res.status_code}, count: {fetch_res.json().get('count')}")
    assert fetch_res.status_code == 200, "Expected 200 OK"
    assert any(n["_id"] == note_id for n in fetch_res.json().get("notes", [])), "Created note should be in list"

    # 5. Update Note
    update_res = requests.put(
        f"{BACKEND_URL}/api/notes/{note_id}",
        json={"content": "Updated: Fiber Architecture and WorkLoop scheduler in React 18/19."},
        headers=headers,
        cookies=cookies
    )
    print(f"4. Update Note returned HTTP {update_res.status_code}")
    assert update_res.status_code == 200, "Expected 200 OK on update"
    assert "Fiber Architecture" in update_res.json()["note"]["content"]

    # 6. Export Notes as Markdown
    export_res = requests.get(f"{BACKEND_URL}/api/notes/export/{REAL_COURSE_ID}", headers=headers, cookies=cookies)
    print(f"5. Export Notes returned HTTP {export_res.status_code}")
    assert export_res.status_code == 200, "Expected 200 OK on export"
    markdown = export_res.json().get("markdown", "")
    assert "# Notes:" in markdown, "Markdown must include Course Title header"
    assert "⏱ 2:22" in markdown, "Markdown must format timestamp 142s as '⏱ 2:22'"
    assert "Fiber Architecture" in markdown, "Markdown must contain the updated note content"
    print(f"   Exported Markdown sample:\n   {markdown[:180]}...")

    # 7. Delete Note (Clean up)
    del_res = requests.delete(f"{BACKEND_URL}/api/notes/{note_id}", headers=headers, cookies=cookies)
    print(f"6. Delete Note returned HTTP {del_res.status_code}")
    assert del_res.status_code == 200, "Expected 200 OK on delete"

    print("✔ [PASS] Test 2: Personalized Notes & Bookmarks API PASSED!")

def test_notes_and_dark_mode_ui(driver):
    print("\n" + "="*60)
    print("▶ RUNNING TEST 3: Responsive UI & Dark Mode Elements in Chrome")
    print("="*60)

    driver.get(FRONTEND_URL)
    time.sleep(1)

    # 1. Desktop Dark Mode button check
    desktop_btn = driver.find_element(By.ID, "theme-toggle-btn")
    assert desktop_btn.is_displayed(), "Desktop theme toggle button must be visible on large screen"
    print("1. Desktop theme toggle button verified in DOM and visible")

    # 2. Mobile Viewport Check
    driver.set_window_size(375, 667)
    time.sleep(1)
    
    # Click hamburger button
    hamburger_btn = driver.find_element(By.XPATH, "//div[contains(@class, 'md:hidden')]//button")
    hamburger_btn.click()
    time.sleep(1)

    # Check mobile theme toggle
    mobile_toggle = driver.find_element(By.ID, "mobile-theme-toggle-btn")
    assert mobile_toggle.is_displayed(), "Mobile theme toggle must be visible inside mobile menu drawer"
    print("2. Mobile theme toggle button verified inside mobile drawer")

    # Click mobile toggle and assert it switches state
    html_elem = driver.find_element(By.TAG_NAME, "html")
    before_dark = "dark" in (html_elem.get_attribute("class") or "")
    mobile_toggle.click()
    time.sleep(1)
    after_dark = "dark" in (html_elem.get_attribute("class") or "")
    assert after_dark != before_dark, "Mobile theme toggle must toggle theme state"
    print(f"3. Mobile theme toggle successfully toggled theme from {'dark' if before_dark else 'light'} to {'dark' if after_dark else 'light'}")

    # Reset desktop window size
    driver.set_window_size(1280, 800)
    time.sleep(0.5)

    print("✔ [PASS] Test 3: Responsive UI & Dark Mode Elements PASSED!")

if __name__ == "__main__":
    driver = None
    try:
        print("\n🚀 Starting InstructoPlus Selenium Automated Test Suite...")
        driver = init_driver()
        test_dark_mode(driver)
        test_notes_backend_api()
        test_notes_and_dark_mode_ui(driver)
        print("\n" + "="*60)
        print("🎉 ALL SELENIUM & INTEGRATION TESTS COMPLETED SUCCESSFULLY (0 ERRORS)!")
        print("="*60 + "\n")
    except Exception as e:
        print(f"\n❌ TEST RUN FAILED: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if driver:
            driver.quit()
