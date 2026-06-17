/**
 * test_fyers_websocket_args.js
 * 
 * Run: node backend/scratch/test_fyers_websocket_args.js --prefix <prefix> --token <session|step4>
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
  const r1 = await axios.post(`${VAGATOR}/send_login_otp`, { fy_id: FY_ID, app_id: '2' }, { timeout:10000 });
  let rk = r1.data.request_key; if (!rk) throw new Error('No request_key');

  const otp = totp(TOTP_SECRET);
  const r2 = await axios.post(`${VAGATOR}/verify_otp`, { request_key:rk, otp }, { timeout:10000 });
  rk = r2.data.request_key; if (!rk) throw new Error('verify_otp failed');

  let sessionToken;
  for (const ep of ['verify_pin_v2','verify_pin']) {
    try {
      const r3 = await axios.post(`${VAGATOR}/${ep}`, { request_key:rk, identity_type:'pin', identifier:PIN }, { timeout:10000 });
      sessionToken = r3.data?.data?.access_token || r3.data?.access_token;
      if (sessionToken) break;
    } catch(e){}
  }
  if (!sessionToken) throw new Error('No session token');

  return { sessionToken };
}

async function getStep4Token(sessionToken) {
  const appIdShort = APP_ID.split('-')[0];
  const appType    = APP_ID.split('-')[1] || '100';
  const r4 = await axios.post(TOKEN, {
    fyers_id: FY_ID, app_id: appIdShort, redirect_uri: REDIRECT,
    appType, code_challenge:'', state:'None', nonce:'', response_type:'code', create_cookie:true
  }, { headers:{ Authorization:`Bearer ${sessionToken}` }, timeout:10000 });
  return r4.data?.data?.auth || r4.data?.data?.authorization_code;
}

async function main() {
  const args = process.argv.slice(2);
  const prefixArg = args[args.indexOf('--prefix') + 1];
  const tokenArg  = args[args.indexOf('--token') + 1];

  if (!prefixArg || !tokenArg) {
    console.log('Usage: node test_fyers_websocket_args.js --prefix <prefix> --token <session|step4>');
    process.exit(1);
  }

  const { sessionToken } = await auth();
  let selectedToken = sessionToken;

  if (tokenArg === 'step4') {
    selectedToken = await getStep4Token(sessionToken);
    if (!selectedToken) {
      console.error('Could not obtain step 4 token!');
      process.exit(1);
    }
  }

  const tokenStr = prefixArg === 'none'
    ? selectedToken
    : `${prefixArg}:${selectedToken}`;
  
  console.log(`Connecting WebSocket with prefix: ${prefixArg}, token type: ${tokenArg}`);
  console.log(`Token string (first 60 chars): ${tokenStr.substring(0, 60)}...`);

  const skt = fyersDataSocket.getInstance(tokenStr, require('os').tmpdir(), false);

  skt.on('connect', () => {
    console.log('✅ WebSocket CONNECTED!');
    console.log('Subscribing to NSE:RELIANCE-EQ, NSE:NIFTY50-INDEX...');
    skt.subscribe(['NSE:RELIANCE-EQ', 'NSE:NIFTY50-INDEX'], false, 1);
  });

  skt.on('message', (data) => {
    console.log('📊 TICK:', JSON.stringify(data));
  });

  skt.on('error', (err) => {
    console.error('❌ Error:', err);
  });

  skt.on('close', () => {
    console.log('🔌 Socket closed');
    process.exit(0);
  });

  skt.connect();

  // Auto-close after 8 seconds
  setTimeout(() => {
    console.log('\n⏱️ 8s test complete. Closing...');
    skt.close();
    process.exit(0);
  }, 8000);
}

main().catch(e => {
  console.error('FATAL:', e.response?.data || e.message);
  process.exit(1);
});
