import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shoonya_oauth'))

import yaml
from api_helper import NorenApiPy

# Set working directory to the cloned repo so it loads cred.yml
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'shoonya_oauth'))

with open('cred.yml', 'r') as f:
    cred = yaml.load(f, Loader=yaml.FullLoader) or {}

print("Loaded credentials:")
print(f"UID: {cred.get('UID')}")
print(f"Client ID: {cred.get('client_id')}")

api = NorenApiPy()
auth_code = "906238c5-d5b8-4e7a-96c3-df44c8e4c1b2"

print(f"Exchanging auth_code: {auth_code} for access token...")
result = api.getAccessToken(auth_code, cred['Secret_Code'], cred['client_id'], cred['UID'])

if result is not None:
    acc_tok, usrid, ref_tok, actid = result
    print("SUCCESS!")
    print(f"Access Token: {acc_tok}")
    print(f"User ID: {usrid}")
    print(f"Refresh Token: {ref_tok}")
    print(f"Account ID: {actid}")
    
    # Save back to cred.yml
    cred['Access_token'] = acc_tok
    cred['Account_ID'] = actid
    with open('cred.yml', 'w') as f:
        yaml.dump(cred, f)
else:
    print("FAILED: getAccessToken returned None.")
