/**
 * test_cookies.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const crypto = require('crypto');

const FY_ID       = process.env.FYERS_USER_ID;
const APP_ID      = process.env.FYERS_APP_ID;
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
  const instance = axios.create({
    withCredentials: true,
  });

  // Track all cookies manually
  let cookieHeader = '';
  function saveCookies(headers) {
    const setCookies = headers['set-cookie'];
    if (setCookies) {
      setCookies.forEach(cookieStr => {
        const parts = cookieStr.split(';');
        const pair = parts[0].trim();
        const name = pair.split('=')[0];
        const val = pair.split('=')[1];
        // simple replace/append
        const map = {};
        if (cookieHeader) {
          cookieHeader.split(';').forEach(c => {
            const p = c.trim().split('=');
            if (p[0]) map[p[0]] = p[1];
          });
        }
        map[name] = val;
        cookieHeader = Object.entries(map).map(([k,v]) => `${k}=${v}`).join('; ');
      });
    }
  }

  console.log('[1] send_login_otp...');
  const r1 = await instance.post(`${VAGATOR}/send_login_otp`, { fy_id: FY_ID, app_id: '2' });
  saveCookies(r1.headers);
  console.log('Cookies after Step 1:', cookieHeader);
  let rk = r1.data.request_key;

  console.log('\n[2] verify_otp (TOTP)...');
  const otp = totp(TOTP_SECRET);
  const r2 = await instance.post(`${VAGATOR}/verify_otp`, { request_key:rk, otp }, {
    headers: cookieHeader ? { Cookie: cookieHeader } : {}
  });
  saveCookies(r2.headers);
  console.log('Cookies after Step 2:', cookieHeader);
  rk = r2.data.request_key;

  console.log('\n[3] verify_pin...');
  let r3;
  for (const ep of ['verify_pin_v2','verify_pin']) {
    try {
      r3 = await instance.post(`${VAGATOR}/${ep}`, { request_key:rk, identity_type:'pin', identifier:PIN }, {
        headers: cookieHeader ? { Cookie: cookieHeader } : {}
      });
      saveCookies(r3.headers);
      if (r3.data?.data?.access_token || r3.data?.access_token) break;
    } catch(e){}
  }
  console.log('Cookies after Step 3:', cookieHeader);
  const sessionToken = r3.data?.data?.access_token || r3.data?.access_token;
  console.log('Session token:', sessionToken ? 'obtained' : 'missing');

  // Let's test GET request to generate-authcode
  console.log('\n[4] GET generate-authcode...');
  const appIdShort = APP_ID.split('-')[0];
  const url = `https://api.fyers.in/api/v3/generate-authcode?client_id=${APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT)}&response_type=code&state=None`;
  
  try {
    const r4 = await instance.get(url, {
      headers: {
        'Cookie': cookieHeader,
        'Authorization': `Bearer ${sessionToken}`
      },
      maxRedirects: 0, // don't follow redirect so we can capture the Location header
      validateStatus: () => true
    });
    console.log('GET Status:', r4.status);
    console.log('GET Headers:', JSON.stringify(r4.headers, null, 2));
    console.log('GET Data:', JSON.stringify(r4.data).substring(0, 500));
  } catch(e) {
    console.log('GET Failed:', e.message);
  }
}

main().catch(e => console.error(e));
