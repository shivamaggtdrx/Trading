/**
 * debug_exchange_new.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const crypto = require('crypto');

const FY_ID       = process.env.FYERS_USER_ID;
const APP_ID      = process.env.FYERS_APP_ID;
const SECRET_KEY  = process.env.FYERS_SECRET_KEY;
const PIN         = process.env.FYERS_PIN;
const TOTP_SECRET = process.env.FYERS_TOTP_SECRET;
const REDIRECT    = process.env.FYERS_REDIRECT_URL || 'http://127.0.0.1';

const VAGATOR = 'https://api-t2.fyers.in/vagator/v2';

function b32decode(s) {
  const a='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'; let bits=''; const buf=[];
  for(const c of s.replace(/[\s=]/g,'').toUpperCase()){const v=a.indexOf(c);if(v<0)continue;bits+=v.toString(2).padStart(5,'0');}
  for(let i=0;i+8<=bits.length;i+=8)buf.push(parseInt(bits.substring(i,i+8),2));
  return Buffer.from(buf);
}
function totp(s){
  const k=b32decode(s),t=Math.floor(Date.now()/1000/30),b=Buffer.alloc(8);b.writeBigInt64BE(BigInt(t),0);
  const h=crypto.createHmac('sha1',k).update(b).digest(),o=h[h.length-1]&0xf;
  const c=(((h[o]&0x7f)<<24)|((h[o+1]&0xff)<<16)|((h[o+2]&0xff)<<8)|(h[o+3]&0xff))%1e6;
  return c.toString().padStart(6,'0');
}

async function main() {
  console.log('--- Step 1: send_login_otp ---');
  const r1 = await axios.post(`${VAGATOR}/send_login_otp`, { fy_id: FY_ID, app_id: '2' });
  let rk = r1.data.request_key;
  console.log('rk:', rk);

  console.log('--- Step 2: verify_otp ---');
  const otpVal = totp(TOTP_SECRET);
  console.log('OTP:', otpVal);
  const r2 = await axios.post(`${VAGATOR}/verify_otp`, { request_key: rk, otp: otpVal });
  rk = r2.data.request_key;
  console.log('rk verified:', rk);

  console.log('--- Step 3: verify_pin ---');
  const r3 = await axios.post(`${VAGATOR}/verify_pin`, { request_key: rk, identity_type: 'pin', identifier: PIN });
  const sessionToken = r3.data?.data?.access_token || r3.data?.access_token;
  console.log('sessionToken (first 30):', sessionToken?.substring(0, 30));

  console.log('--- Step 4: generate auth_code ---');
  const appIdShort = APP_ID.split('-')[0];
  const appType    = APP_ID.split('-')[1] || '100';
  const r4 = await axios.post('https://api-t1.fyers.in/api/v3/token', {
    fyers_id:       FY_ID,
    app_id:         appIdShort,
    redirect_uri:   REDIRECT,
    appType,
    code_challenge: '',
    state:          'None',
    nonce:          '',
    response_type:  'code',
    create_cookie:  true
  }, {
    headers: { Authorization: `Bearer ${sessionToken}` },
    validateStatus: () => true,
    maxRedirects: 0,
    timeout: 10000
  });
  
  console.log('Step 4 Raw Response:', JSON.stringify(r4.data));

  let authCode = r4.data?.data?.auth || r4.data?.data?.authorization_code;
  if (!authCode && r4.data?.Url) {
    const u = new URL(r4.data.Url);
    authCode = u.searchParams.get('auth_code');
  }
  console.log('Parsed authCode (first 40):', authCode?.substring(0, 40));

  console.log('--- Step 5: Exchange Auth Code ---');
  const appIdHash = crypto.createHash('sha256').update(`${APP_ID}:${SECRET_KEY}`).digest('hex');
  console.log('appIdHash:', appIdHash);

  const exchangeUrls = [
    'https://api-t1.fyers.in/api/v3/validate-authcode',
    'https://api-t1.fyers.in/api/v3/token'
  ];

  for (const url of exchangeUrls) {
    console.log(`\nTrying Exchange URL: ${url}`);
    try {
      const payload = {
        grant_type: 'authorization_code',
        appIdHash,
        code: authCode,
        redirect_uri: REDIRECT
      };
      console.log('Payload:', JSON.stringify(payload));
      const res = await axios.post(url, payload, { timeout: 10000 });
      console.log('SUCCESS Response:', JSON.stringify(res.data));
    } catch (e) {
      console.log('FAILED Response:', JSON.stringify(e.response?.data || e.message));
    }
  }
}

main().catch(console.error);
