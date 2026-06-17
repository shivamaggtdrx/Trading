import os
import time
import json
import hashlib
import pyotp
import requests
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from urllib.parse import urlparse, parse_qs

# Load env variables manually from backend/.env
env = {}
try:
    with open('backend/.env', 'r') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip()
except Exception as e:
    print("Error reading .env:", e)

USER_ID = env.get('SHOONYA_USER_ID')
PASSWORD = env.get('SHOONYA_PASSWORD')
SECRET_CODE = env.get('SHOONYA_API_KEY')
TOTP_SECRET = env.get('SHOONYA_TOTP_SECRET')
CLIENT_ID = env.get('SHOONYA_VENDOR_CODE')

print("Loaded credentials from .env:")
print(f"  USER_ID: {USER_ID}")
print(f"  CLIENT_ID: {CLIENT_ID}")
print(f"  Secret_Code length: {len(SECRET_CODE) if SECRET_CODE else 0}")
print(f"  TOTP_SECRET length: {len(TOTP_SECRET) if TOTP_SECRET else 0}")

if not all([USER_ID, PASSWORD, SECRET_CODE, TOTP_SECRET, CLIENT_ID]):
    print("Error: Missing credentials in .env file.")
    exit(1)

# Format login URL
LOGIN_URL = f"https://api.shoonya.com/OAuthlogin/investor-entry-level/login?api_key={CLIENT_ID}&route_to={USER_ID}"

def scan_network_for_code(driver):
    try:
        logs = driver.get_log("performance")
        for entry in logs:
            try:
                message = json.loads(entry["message"])["message"]
                if message.get("method") == "Network.requestWillBeSent":
                    url = message.get("params", {}).get("request", {}).get("url", "")
                    if "code=" in url and "shoonya" in url.lower():
                        parsed = urlparse(url)
                        code = parse_qs(parsed.query).get("code", [None])[0]
                        if code:
                            return code
            except Exception:
                continue
    except Exception:
        pass
    return None

def fast_fill(driver, element, value):
    element.click()
    time.sleep(0.1)
    element.clear()
    element.send_keys(value)
    time.sleep(0.1)

# Chrome Headless Options
options = webdriver.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--no-sandbox")
options.add_argument("--disable-dev-shm-usage")
options.add_argument("--window-size=1920,1080")
options.set_capability("goog:loggingPrefs", {"performance": "ALL"})

print("Starting browser...")
try:
    driver = webdriver.Chrome(options=options)
    wait = WebDriverWait(driver, 30)
except Exception as e:
    print(f"Failed to start Chrome WebDriver: {e}")
    print("Please make sure Google Chrome is installed on the system.")
    exit(1)

auth_code = None
try:
    print(f"Navigating to login URL: {LOGIN_URL}")
    driver.get(LOGIN_URL)
    
    # Wait until password field is visible
    wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "input[type='password']")))
    time.sleep(1)
    
    all_inputs = driver.find_elements(By.CSS_SELECTOR, "input:not([type='hidden']):not([type='checkbox']):not([type='radio'])")
    visible_inputs = [inp for inp in all_inputs if inp.is_displayed()]
    
    print(f"Found {len(visible_inputs)} visible inputs. Filling form...")
    fast_fill(driver, visible_inputs[0], USER_ID)
    fast_fill(driver, visible_inputs[1], PASSWORD)
    
    otp_value = pyotp.TOTP(TOTP_SECRET).now()
    print(f"Generated TOTP code: {otp_value}")
    fast_fill(driver, visible_inputs[2], otp_value)
    
    # Submit login
    wait.until(EC.element_to_be_clickable((By.XPATH, "//button[normalize-space()='LOGIN']"))).click()
    print("Credentials submitted. Scanning for auth code redirect...")
    
    start_time = time.time()
    while True:
        auth_code = scan_network_for_code(driver)
        if auth_code:
            print(f"Successfully captured Auth Code: {auth_code}")
            break
            
        if time.time() - start_time > 30:
            print("Timeout waiting for redirect. Page URL:", driver.current_url)
            print("Page Source excerpt:", driver.page_source[:500])
            break
        time.sleep(0.5)

except Exception as e:
    print(f"An error occurred during browser automation: {e}")
finally:
    try:
        driver.quit()
    except Exception:
        pass

if auth_code:
    # Exchange Auth Code
    print("Exchanging auth code for access token...")
    import itertools
    
    url = "https://api.shoonya.com/NorenWClientAPI/GenAcsTok"
    success = False
    
    # Candidate lists for each component to cover any casing anomalies
    cids = list(set([CLIENT_ID, CLIENT_ID.lower(), CLIENT_ID.upper(), "06099530"]))
    uids = list(set([USER_ID, USER_ID.lower(), USER_ID.upper(), "06099530"]))
    secs = list(set([
        SECRET_CODE, SECRET_CODE.lower(), SECRET_CODE.upper(),
        "9d6579001a2db432b64f15176a49b094", "9D6579001A2DB432B64F15176A49B094"
    ]))
    codes = list(set([auth_code, auth_code.lower(), auth_code.upper()]))
    
    # We want to test different combinations of 3 inputs for the hash:
    # 1. Using client_id
    for cid_val in cids:
        for sec_val in secs:
            for code_val in codes:
                inputs = [cid_val, sec_val, code_val]
                for perm in itertools.permutations(inputs):
                    hash_input = "".join(perm)
                    checksum = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
                    
                    for payload_uid in list(set(uids + cids)):
                        values = {
                            "code": auth_code,
                            "checksum": checksum,
                            "uid": payload_uid
                        }
                        payload = 'jData=' + json.dumps(values)
                        try:
                            res = requests.post(url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=5)
                            res_data = res.json()
                            if res_data.get("stat") == "Ok":
                                print(f"SUCCESS! Combination: {'+'.join(perm)} | payload_uid: {payload_uid}")
                                print("Response:", res_data)
                                with open("backend/scratch/session.json", "w") as sf:
                                    json.dump(res_data, sf, indent=2)
                                print("Token saved to backend/scratch/session.json")
                                success = True
                                break
                        except Exception as e:
                            pass
                    if success: break
                if success: break
            if success: break
        if success: break
        
    # 2. Using user_id instead of client_id
    if not success:
        for uid_val in uids:
            for sec_val in secs:
                for code_val in codes:
                    inputs = [uid_val, sec_val, code_val]
                    for perm in itertools.permutations(inputs):
                        hash_input = "".join(perm)
                        checksum = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
                        
                        for payload_uid in list(set(uids + cids)):
                            values = {
                                "code": auth_code,
                                "checksum": checksum,
                                "uid": payload_uid
                            }
                            payload = 'jData=' + json.dumps(values)
                            try:
                                res = requests.post(url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=5)
                                res_data = res.json()
                                if res_data.get("stat") == "Ok":
                                    print(f"SUCCESS! Combination: {'+'.join(perm)} | payload_uid: {payload_uid}")
                                    print("Response:", res_data)
                                    with open("backend/scratch/session.json", "w") as sf:
                                        json.dump(res_data, sf, indent=2)
                                    print("Token saved to backend/scratch/session.json")
                                    success = True
                                    break
                            except Exception:
                                pass
                        if success: break
                    if success: break
                if success: break
            if success: break
            
    if not success:
        print("All token exchange combinations (including casing variations) failed.")
else:
    print("Could not retrieve auth code from browser session.")
