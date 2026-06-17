/**
 * test_token_exchange.js
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
const TOKEN   = 'https://api-t1.fyers.in/api/v3/validate-authcode';

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
  console.log('[1] send_login_otp...');
  const r1 = await axios.post(`${VAGATOR}/send_login_otp`, { fy_id: FY_ID, app_id: '2' });
  let rk = r1.data.request_key;

  console.log('[2] verify_otp (TOTP)...');
  const otp = totp(TOTP_SECRET);
  const r2 = await axios.post(`${VAGATOR}/verify_otp`, { request_key:rk, otp });
  rk = r2.data.request_key;

  console.log('[3] verify_pin...');
  let sessionToken;
  for (const ep of ['verify_pin_v2','verify_pin']) {
    try {
      const r3 = await axios.post(`${VAGATOR}/${ep}`, { request_key:rk, identity_type:'pin', identifier:PIN });
      sessionToken = r3.data?.data?.access_token || r3.data?.access_token;
      if (sessionToken) break;
    } catch(e){}
  }
  console.log('Session token obtained');

  // Helper to generate a fresh auth code
  async function getFreshAuthCode() {
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
    }, { headers: { Authorization: `Bearer ${sessionToken}` } });
    console.log('    [getFreshAuthCode] response:', JSON.stringify(r4.data));
    let code = r4.data?.data?.auth || r4.data?.data?.authorization_code;
    if (!code && r4.data?.Url) {
      try {
        const u = new URL(r4.data.Url);
        code = u.searchParams.get('auth_code');
      } catch (e) {
        const match = r4.data.Url.match(/[?&]auth_code=([^&]+)/);
        if (match) code = match[1];
      }
    }
    return code;
  }

  // Variant 1: short App ID with colon
  const appIdShort = APP_ID.split('-')[0];
  const hash1 = crypto.createHash('sha256').update(`${appIdShort}:${SECRET_KEY}`).digest('hex');
  console.log('\nExchanging with SHORT + COLON hash:', hash1);
  try {
    const code = await getFreshAuthCode();
    const res = await axios.post(TOKEN, { grant_type: 'authorization_code', appIdHash: hash1, code, redirect_uri: REDIRECT });
    console.log('Result:', JSON.stringify(res.data));
  } catch(e) { console.log('Failed:', e.response?.data || e.message); }

  // Variant 2: full App ID with colon (try http://127.0.0.1)
  const hash2 = crypto.createHash('sha256').update(`${APP_ID}:${SECRET_KEY}`).digest('hex');
  console.log('\nExchanging with FULL + COLON hash (redirect: http://127.0.0.1):', hash2);
  try {
    const code = await getFreshAuthCode();
    const res = await axios.post(TOKEN, { grant_type: 'authorization_code', appIdHash: hash2, code, redirect_uri: 'http://127.0.0.1' });
    console.log('Result:', JSON.stringify(res.data));
  } catch(e) { console.log('Failed:', e.response?.data || e.message); }

  // Variant 2.1: full App ID with colon (try http://127.0.0.1/)
  console.log('\nExchanging with FULL + COLON hash (redirect: http://127.0.0.1/):', hash2);
  try {
    const code = await getFreshAuthCode();
    const res = await axios.post(TOKEN, { grant_type: 'authorization_code', appIdHash: hash2, code, redirect_uri: 'http://127.0.0.1/' });
    console.log('Result:', JSON.stringify(res.data));
  } catch(e) { console.log('Failed:', e.response?.data || e.message); }

  // Variant 3: short App ID without colon
  const hash3 = crypto.createHash('sha256').update(`${appIdShort}${SECRET_KEY}`).digest('hex');
  console.log('\nExchanging with SHORT NO COLON hash:', hash3);
  try {
    const code = await getFreshAuthCode();
    const res = await axios.post(TOKEN, { grant_type: 'authorization_code', appIdHash: hash3, code, redirect_uri: REDIRECT });
    console.log('Result:', JSON.stringify(res.data));
  } catch(e) { console.log('Failed:', e.response?.data || e.message); }

  // Variant 4: full App ID without colon
  const hash4 = crypto.createHash('sha256').update(`${APP_ID}${SECRET_KEY}`).digest('hex');
  console.log('\nExchanging with FULL NO COLON hash:', hash4);
  try {
    const code = await getFreshAuthCode();
    const res = await axios.post(TOKEN, { grant_type: 'authorization_code', appIdHash: hash4, code, redirect_uri: REDIRECT });
    console.log('Result:', JSON.stringify(res.data));
  } catch(e) { console.log('Failed:', e.response?.data || e.message); }
}

main().catch(e => console.error(e));
