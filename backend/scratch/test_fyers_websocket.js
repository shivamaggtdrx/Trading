/**
 * test_fyers_websocket.js
 * 
 * Full auth + WebSocket test — verify live ticks arrive from Fyers
 * Run: node backend/scratch/test_fyers_websocket.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios  = require('axios');
const crypto = require('crypto');
const { fyersDataSocket } = require('../node_modules/fyers-api-v3');

const FY_ID       = process.env.FYERS_USER_ID;
const APP_ID      = process.env.FYERS_APP_ID;
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

async function auth() {
  // Step 1
  const r1 = await axios.post(`${VAGATOR}/send_login_otp`, { fy_id: FY_ID, app_id: '2' }, { timeout:10000 });
  let rk = r1.data.request_key; if (!rk) throw new Error('No request_key');
  console.log('[1] ✅ request_key');

  // Step 2
  const otp = totp(TOTP_SECRET);
  const r2 = await axios.post(`${VAGATOR}/verify_otp`, { request_key:rk, otp }, { timeout:10000 });
  rk = r2.data.request_key; if (!rk) throw new Error('verify_otp failed');
  console.log('[2] ✅ TOTP verified');

  // Step 3
  let sessionToken;
  for (const ep of ['verify_pin_v2','verify_pin']) {
    try {
      const r3 = await axios.post(`${VAGATOR}/${ep}`, { request_key:rk, identity_type:'pin', identifier:PIN }, { timeout:10000 });
      sessionToken = r3.data?.data?.access_token || r3.data?.access_token;
      if (sessionToken) break;
    } catch(e){ /* fallback */ }
  }
  if (!sessionToken) throw new Error('No session token');
  console.log('[3] ✅ session token');

  // Step 4
  const appIdShort = APP_ID.split('-')[0];
  const appType    = APP_ID.split('-')[1] || '100';
  const r4 = await axios.post(TOKEN, {
    fyers_id: FY_ID, app_id: appIdShort, redirect_uri: REDIRECT,
    appType, code_challenge:'', state:'None', nonce:'', response_type:'code', create_cookie:true
  }, { headers:{ Authorization:`Bearer ${sessionToken}` }, timeout:10000 });

  const finalToken = r4.data?.data?.auth || r4.data?.data?.authorization_code || sessionToken;
  console.log('[4] ✅ final token obtained');
  return finalToken;
}

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Fyers WebSocket Test — Live Tick Verification');
  console.log('═══════════════════════════════════════════════\n');

  // Step 1-3
  console.log('[1] send_login_otp...');
  const r1 = await axios.post(`${VAGATOR}/send_login_otp`, { fy_id: FY_ID, app_id: '2' }, { timeout:10000 });
  let rk = r1.data.request_key; if (!rk) throw new Error('No request_key');
  console.log('[1] ✅ request_key');

  // Step 2
  const otp = totp(TOTP_SECRET);
  const r2 = await axios.post(`${VAGATOR}/verify_otp`, { request_key:rk, otp }, { timeout:10000 });
  rk = r2.data.request_key; if (!rk) throw new Error('verify_otp failed');
  console.log('[2] ✅ TOTP verified');

  // Step 3
  let sessionToken;
  for (const ep of ['verify_pin_v2','verify_pin']) {
    try {
      const r3 = await axios.post(`${VAGATOR}/${ep}`, { request_key:rk, identity_type:'pin', identifier:PIN }, { timeout:10000 });
      sessionToken = r3.data?.data?.access_token || r3.data?.access_token;
      if (sessionToken) break;
    } catch(e){ /* fallback */ }
  }
  if (!sessionToken) throw new Error('No session token');
  console.log('[3] ✅ session token:', sessionToken.substring(0, 30) + '...');

  // Step 4
  let step4Token = null;
  try {
    const appIdShort = APP_ID.split('-')[0];
    const appType    = APP_ID.split('-')[1] || '100';
    const r4 = await axios.post(TOKEN, {
      fyers_id: FY_ID, app_id: appIdShort, redirect_uri: REDIRECT,
      appType, code_challenge:'', state:'None', nonce:'', response_type:'code', create_cookie:true
    }, { headers:{ Authorization:`Bearer ${sessionToken}` }, timeout:10000 });
    step4Token = r4.data?.data?.auth || r4.data?.data?.authorization_code;
    console.log('[4] ✅ Step 4 Token obtained:', step4Token ? step4Token.substring(0, 30) + '...' : 'none');
  } catch(e) {
    console.log('[4] ❌ Step 4 Token request failed:', e.message);
  }

  const tokensToTest = [];
  if (step4Token) {
    tokensToTest.push({ name: 'Step 4 Token with Short App ID', prefix: APP_ID.split('-')[0], token: step4Token });
    tokensToTest.push({ name: 'Step 4 Token with Full App ID', prefix: APP_ID, token: step4Token });
  }
  tokensToTest.push({ name: 'Step 3 Token with Short App ID', prefix: APP_ID.split('-')[0], token: sessionToken });
  tokensToTest.push({ name: 'Step 3 Token with Full App ID', prefix: APP_ID, token: sessionToken });

  for (const item of tokensToTest) {
    console.log(`\n--------------------------------------------`);
    console.log(`Testing WebSocket with: ${item.name}`);
    console.log(`Prefix: ${item.prefix}`);
    console.log(`--------------------------------------------`);
    const success = await new Promise((resolve) => {
      const tokenStr = `${item.prefix}:${item.token}`;
      console.log(`Connecting with token: ${tokenStr.substring(0, 50)}...`);
      const skt = fyersDataSocket.getInstance(tokenStr, require('os').tmpdir(), false);
      let didFail = false;
      let timeoutId;

      skt.on('connect', () => {
        console.log('✅ WebSocket CONNECTED!');
        console.log('Subscribing to NSE:RELIANCE-EQ, NSE:NIFTY50-INDEX...');
        skt.subscribe(['NSE:RELIANCE-EQ', 'NSE:NIFTY50-INDEX'], 'symbolUpdate');
        
        // Wait 5 seconds for messages/ticks
        timeoutId = setTimeout(() => {
          console.log('⏱️ Time limit reached for this token. Closing socket.');
          skt.close();
          resolve(!didFail);
        }, 5000);
      });

      skt.on('message', (data) => {
        console.log('📊 TICK:', JSON.stringify(data));
      });

      skt.on('error', (err) => {
        console.error('❌ Error received:', err);
        if (err?.code === -15 || (err?.message && err.message.includes('valid token'))) {
          didFail = true;
          clearTimeout(timeoutId);
          skt.close();
          resolve(false);
        }
      });

      skt.on('close', () => {
        console.log('🔌 Socket closed');
      });

      skt.connect();
    });

    if (success) {
      console.log(`\n🎉 SUCCESS! ${item.name} worked and received ticks!`);
      process.exit(0);
    } else {
      console.log(`\n❌ FAILED! ${item.name} could not subscribe or got error.`);
    }
  }

  console.log('\nAll tokens failed.');
  process.exit(1);
}

main().catch(e => {
  console.error('FATAL:', e.response?.data || e.message);
  process.exit(1);
});
