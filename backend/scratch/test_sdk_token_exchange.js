/**
 * test_sdk_token_exchange.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const crypto = require('crypto');
const { fyersModel } = require('fyers-api-v3');

const FY_ID       = process.env.FYERS_USER_ID;
const APP_ID      = process.env.FYERS_APP_ID;
const SECRET_KEY  = process.env.FYERS_SECRET_KEY;
const PIN         = process.env.FYERS_PIN;
const TOTP_SECRET = process.env.FYERS_TOTP_SECRET;
const REDIRECT    = process.env.FYERS_REDIRECT_URL || 'http://127.0.0.1';

const VAGATOR = 'https://api-t2.fyers.in/vagator/v2';
const TOKEN   = 'https://api-t1.fyers.in/api/v3/token';

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
  // Step 1
  const r1 = await axios.post(`${VAGATOR}/send_login_otp`, { fy_id: FY_ID, app_id: '2' });
  let rk = r1.data.request_key;

  // Step 2
  const otp = totp(TOTP_SECRET);
  const r2 = await axios.post(`${VAGATOR}/verify_otp`, { request_key:rk, otp });
  rk = r2.data.request_key;

  // Step 3
  let sessionToken;
  for (const ep of ['verify_pin_v2','verify_pin']) {
    try {
      const r3 = await axios.post(`${VAGATOR}/${ep}`, { request_key:rk, identity_type:'pin', identifier:PIN });
      sessionToken = r3.data?.data?.access_token || r3.data?.access_token;
      if (sessionToken) break;
    } catch(e){}
  }
  console.log('Session token obtained');

  // Step 4
  const appIdShort = APP_ID.split('-')[0];
  const appType    = APP_ID.split('-')[1] || '100';
  const r4 = await axios.post(TOKEN, {
    fyers_id: FY_ID, app_id: appIdShort, redirect_uri: REDIRECT,
    appType, code_challenge:'', state:'None', nonce:'', response_type:'code', create_cookie:true
  }, { headers:{ Authorization:`Bearer ${sessionToken}` } });
  
  const authCode = r4.data?.data?.auth || r4.data?.data?.authorization_code;
  console.log('Auth code obtained:', authCode ? 'yes' : 'no');

  // Initialize SDK
  const fyers = new fyersModel({ path: './fyers_logs', enableLogging: true });
  fyers.setAppId(APP_ID);
  fyers.setRedirectUrl(REDIRECT);

  console.log('\n--- Calling SDK generate_access_token() ---');
  const res = await fyers.generate_access_token({
    auth_code: authCode,
    secret_key: SECRET_KEY
  });
  console.log('SDK Response:', JSON.stringify(res));
}

main().catch(e => console.error(e));
