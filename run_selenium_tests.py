import os
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

BASE_URL = "http://localhost:5173"
SCREENSHOT_DIR = os.path.join(os.getcwd(), "screenshots")
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

chrome_options = Options()
chrome_options.add_argument("--headless=new")
chrome_options.add_argument("--window-size=1920,1080")
chrome_options.add_argument("--disable-gpu")
chrome_options.add_argument("--no-sandbox")
chrome_options.add_argument("--disable-dev-shm-usage")

driver = webdriver.Chrome(options=chrome_options)
driver.set_window_size(1920, 1080)

def take_shot(name, delay=2):
    time.sleep(delay)
    filepath = os.path.join(SCREENSHOT_DIR, f"{name}.png")
    driver.save_screenshot(filepath)
    print(f"Captured: {name}.png -> {driver.current_url}")

def spa_navigate(path):
    driver.execute_script(f"""
        const evt = new CustomEvent('nav_spa', {{ detail: '{path}' }});
        window.history.pushState(null, '', '{path}');
        window.dispatchEvent(new PopStateEvent('popstate'));
    """)
    time.sleep(2)

def login_user(email, password):
    driver.get(f"{BASE_URL}/login")
    time.sleep(1)
    
    email_input = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.XPATH, "//input[@type='email']"))
    )
    email_input.clear()
    email_input.send_keys(email)
    
    pwd_input = driver.find_element(By.XPATH, "//input[@type='password' or @placeholder='••••••••']")
    pwd_input.clear()
    pwd_input.send_keys(password)
    
    form_login_btn = driver.find_element(By.XPATH, "//form//button[contains(., 'Login')]")
    driver.execute_script("arguments[0].click();", form_login_btn)
    
    WebDriverWait(driver, 10).until(lambda d: "/login" not in d.current_url)
    time.sleep(3)

try:
    course_id = "6ab2ed4c9ddae38400712550"
    instructor_id = "6ab2f62a6cf675fc11dedddf"
    lecture_id = "6ab2ed4c9ddae38400712552"

    print("--- 1. PUBLIC PAGES ---")
    driver.get(f"{BASE_URL}/")
    take_shot("01_Home_Page")

    spa_navigate("/allcourses")
    take_shot("02_All_Courses_Page")

    spa_navigate(f"/viewcourse/{course_id}")
    take_shot("03_View_Course_Detail_Page")

    spa_navigate(f"/instructor/{instructor_id}")
    take_shot("04_Instructor_Profile_Page")

    spa_navigate("/login")
    take_shot("05_Login_Page")

    spa_navigate("/signup")
    take_shot("06_Signup_Page")

    spa_navigate("/forgotpassword")
    take_shot("07_Forgot_Password_Page")

    print("--- 2. STUDENT PAGES ---")
    login_user("student@local.com", "Password@123")
    take_shot("08_Student_Home_Logged_In")

    spa_navigate("/profile")
    take_shot("09_Student_Profile_Page")

    spa_navigate("/editprofile")
    take_shot("10_Student_Edit_Profile_Page")

    spa_navigate("/enrolledcourses")
    take_shot("11_Student_Enrolled_Courses_Page", delay=3)

    spa_navigate(f"/viewlecture/{course_id}")
    take_shot("12_Student_Course_Lecture_Player_Page", delay=3)

    spa_navigate("/search")
    take_shot("13_Search_With_AI_Page")

    spa_navigate("/notifications")
    take_shot("14_Notifications_Page")

    print("--- 3. EDUCATOR PAGES ---")
    driver.delete_all_cookies()
    driver.execute_script("window.localStorage.clear(); window.sessionStorage.clear();")
    time.sleep(1)

    login_user("educator@local.com", "Password@123")
    take_shot("15_Educator_Home_Logged_In")

    spa_navigate("/dashboard")
    take_shot("16_Educator_Dashboard_Overview", delay=3)

    spa_navigate("/courses")
    take_shot("17_Educator_Courses_Management", delay=3)

    spa_navigate("/createcourses")
    take_shot("18_Educator_Create_Course_Page", delay=2)

    spa_navigate(f"/editcourses/{course_id}")
    take_shot("19_Educator_Edit_Course_Page", delay=3)

    spa_navigate(f"/createlecture/{course_id}")
    take_shot("20_Educator_Create_Lecture_Page", delay=2)

    spa_navigate(f"/editlecture/{course_id}/{lecture_id}")
    take_shot("21_Educator_Edit_Lecture_Page", delay=2)

    spa_navigate("/educator/create-announcement")
    take_shot("22_Educator_Create_Announcement_Page", delay=2)

    spa_navigate(f"/enrolledstudents/{course_id}")
    take_shot("23_Educator_Enrolled_Students_Page", delay=3)

    print("SUCCESS: ALL 23 PAGES CAPTURED WITH AUTH & REAL VIEWS!")

except Exception as e:
    print(f"Error during testing: {e}")
    take_shot("error_state")
finally:
    driver.quit()
