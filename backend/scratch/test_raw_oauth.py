import requests
import hashlib
import json

# Configuration
uid = "FN219925"
client_id = "FN219925_U"
secret_code = "X19AOnlcFXm00l7jhR14x6nfQG8lfNoJDy0G5h1o1e9AMM6XINRlXGj2MZF6FhBp"
auth_code = "906238c5-d5b8-4e7a-96c3-df44c8e4c1b2"

# Compute Hash: SHA256 of (client_id + secret_code + auth_code)
hash_input = f"{client_id}{secret_code}{auth_code}"
app_verifier = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()

print("Hash Input:", hash_input)
print("Computed Hash/Checksum:", app_verifier)

# JSON Payload keys as expected by Shoonya's GenAcsTok:
# { "code": authcode, "checksum": app_verifier, "uid": UID }
values = {
    "code": auth_code,
    "checksum": app_verifier,
    "uid": uid
}

payload = 'jData=' + json.dumps(values)
url = "https://api.shoonya.com/NorenWClientAPI/GenAcsTok"

print(f"Sending request to {url}...")
print("Raw payload string:", payload)

try:
    response = requests.post(url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=10)
    print("Response Status Code:", response.status_code)
    print("Response Headers:", response.headers)
    print("Response Text:", response.text)
except Exception as e:
    print("Error during request:", e)
