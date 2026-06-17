import requests
import hashlib
import json

uid = "FN219925"
secret_code = "X19AOnlcFXm00l7jhR14x6nfQG8lfNoJDy0G5h1o1e9AMM6XINRlXGj2MZF6FhBp"
auth_code = "906238c5-d5b8-4e7a-96c3-df44c8e4c1b2"

# Let's test combinations of client_id
client_ids = ["FN219925_U", "FN219925"]

combinations = []

for cid in client_ids:
    # Combinations of hashing
    # 1. client_id + secret_code + auth_code (SDK standard)
    h1_input = f"{cid}{secret_code}{auth_code}"
    h1 = hashlib.sha256(h1_input.encode('utf-8')).hexdigest()
    combinations.append(("cid+sec+code", cid, h1))

    # 2. uid + secret_code + auth_code
    h2_input = f"{uid}{secret_code}{auth_code}"
    h2 = hashlib.sha256(h2_input.encode('utf-8')).hexdigest()
    combinations.append(("uid+sec+code", cid, h2))

    # 3. secret_code + client_id + auth_code
    h3_input = f"{secret_code}{cid}{auth_code}"
    h3 = hashlib.sha256(h3_input.encode('utf-8')).hexdigest()
    combinations.append(("sec+cid+code", cid, h3))

url = "https://api.shoonya.com/NorenWClientAPI/GenAcsTok"

for name, cid, checksum in combinations:
    values = {
        "code": auth_code,
        "checksum": checksum,
        "uid": uid
    }
    payload = 'jData=' + json.dumps(values)
    try:
        response = requests.post(url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=5)
        res_data = response.json()
        print(f"Combo: {name} | client_id: {cid}")
        print("  Payload sent:", payload)
        print("  Response:", res_data)
        if res_data.get("stat") == "Ok":
            print("  ===> SUCCESS!!! <===")
            break
    except Exception as e:
        print(f"Combo: {name} | client_id: {cid} failed with: {e}")
