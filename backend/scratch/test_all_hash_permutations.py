import requests
import hashlib
import json
import itertools

uid = "FN219925"
cid = "FN219925_U"
sec = "X19AOnlcFXm00l7jhR14x6nfQG8lfNoJDy0G5h1o1e9AMM6XINRlXGj2MZF6FhBp"
code = "906238c5-d5b8-4e7a-96c3-df44c8e4c1b2"

# We want to test different combinations of 3 inputs for the hash:
# Possibility A: using cid (FN219925_U), sec, code
# Possibility B: using uid (FN219925), sec, code
# Possibility C: using both cid and uid and sec? (e.g. cid + uid + sec + code)
# Let's write a general permutation tester.

inputs_sets = [
    # set 1: standard components
    [cid, sec, code],
    # set 2: uid instead of cid
    [uid, sec, code],
    # set 3: both cid and uid
    [cid, uid, sec, code]
]

url = "https://api.shoonya.com/NorenWClientAPI/GenAcsTok"

found_success = False

for inputs in inputs_sets:
    for perm in itertools.permutations(inputs):
        hash_input = "".join(perm)
        checksum = hashlib.sha256(hash_input.encode('utf-8')).hexdigest()
        
        # We should also test if uid sent in the payload can be uid or cid
        for payload_uid in [uid, cid]:
            values = {
                "code": code,
                "checksum": checksum,
                "uid": payload_uid
            }
            payload = 'jData=' + json.dumps(values)
            try:
                response = requests.post(url, data=payload, headers={"Content-Type": "application/x-www-form-urlencoded"}, timeout=5)
                res_data = response.json()
                if res_data.get("stat") == "Ok":
                    print(f"SUCCESS! Permutation: {'+'.join(perm)} | payload_uid: {payload_uid}")
                    print("Response:", res_data)
                    found_success = True
                    break
                else:
                    # Log failure if it's not the standard INVALID_VERIFIER or if it's something interesting
                    if "INVALID_VERIFIER" not in res_data.get("emsg", ""):
                        print(f"Perm: {'+'.join(perm)} | payload_uid: {payload_uid} | Resp: {res_data}")
            except Exception as e:
                pass
        if found_success:
            break
    if found_success:
        break

if not found_success:
    print("All permutations failed.")
