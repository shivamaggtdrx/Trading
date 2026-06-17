/**
 * test_fyers_auth_v3.js
 * 
 * Complete 5-step Fyers automated auth:
 * 1. send_login_otp    → request_key
 * 2. verify_otp (TOTP) → request_key (updated)
 * 3. verify_pin        → access_token (session JWT)
 * 4. POST /api/v3/token → auth_code
 * 5. POST /api/v3/validate-authcode → FINAL access_token
 *
 * Run: node backend/scratch/test_fyers_auth_v3.js
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

const VAGATOR_BASE = 'https://api-t2.fyers.in/vagator/v2';
const API_BASE     = 'https://api.fyers.in/api/v3';

function decodeBase32(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = ''; const buffer = [];
  for (const ch of base32.replace(/[\s=]/g, '').toUpperCase()) {
    const val = alphabet.indexOf(ch); if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  for (let i = 0; i + 8 <= bits.length; i += 8) buffer.push(parseInt(bits.substring(i, i + 8), 2));
  return Buffer.from(buffer);
}
function generateTOTP(secret) {
  const key = decodeBase32(secret);
  const ts  = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8); buf.writeBigInt64BE(BigInt(ts), 0);
  const h   = crypto.createHmac('sha1', key).update(buf).digest();
  const o   = h[h.length - 1] & 0xf;
  const c   = (((h[o]&0x7f)<<24)|((h[o+1]&0xff)<<16)|((h[o+2]&0xff)<<8)|(h[o+3]&0xff)) % 1e6;
  return c.toString().padStart(6, '0');
}

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log('  Fyers Auth Test v3 — Full 5-step flow');
  console.log('══════════════════════════════════════════════════');
  console.log(`  APP_ID: ${APP_ID}  REDIRECT: ${REDIRECT}\n`);

  // ── Step 1 ──
  console.log('[1] send_login_otp...');
  const r1 = await axios.post(`${VAGATOR_BASE}/send_login_otp`, { fy_id: FY_ID, app_id: '2' }, { timeout: 10000 });
  console.log('    →', r1.data.code, r1.data.message);
  let requestKey = r1.data.request_key;
  if (!requestKey) throw new Error('No request_key');
  console.log('    ✅ request_key obtained\n');

  // ── Step 2 ──
  console.log('[2] verify_otp (TOTP)...');
  const totp = generateTOTP(TOTP_SECRET);
  console.log(`    TOTP = ${totp}`);
  const r2 = await axios.post(`${VAGATOR_BASE}/verify_otp`, { request_key: requestKey, otp: totp }, { timeout: 10000 });
  console.log('    →', r2.data.code, r2.data.message);
  if (!r2.data.request_key) throw new Error('verify_otp failed: ' + JSON.stringify(r2.data));
  requestKey = r2.data.request_key;
  console.log('    ✅ TOTP verified\n');

  // ── Step 3 ──
  console.log('[3] verify_pin...');
  let sessionToken;
  for (const ep of ['verify_pin_v2', 'verify_pin']) {
    try {
      const r3 = await axios.post(`${VAGATOR_BASE}/${ep}`, { request_key: requestKey, identity_type: 'pin', identifier: PIN }, { timeout: 10000 });
      console.log(`    [${ep}] →`, JSON.stringify(r3.data).substring(0, 120));
      sessionToken = r3.data?.data?.access_token || r3.data?.access_token;
      if (sessionToken) { console.log('    ✅ session token obtained\n'); break; }
    } catch (e) { console.log(`    [${ep}] failed:`, e.response?.data || e.message); }
  }
  if (!sessionToken) throw new Error('No session token from verify_pin');

  // ── Step 4: Generate auth_code via /api/v3/token ──
  console.log('[4] Generate auth_code via /api/v3/token...');
  let authCode;
  try {
    const r4 = await axios.post(`${API_BASE}/token`, {
      fyers_id:      FY_ID,
      app_id:        APP_ID.split('-')[0],  // app_id without the -100 suffix
      redirect_uri:  REDIRECT,
      appType:       '100',
      code_challenge:'',
      state:         'None',
      nonce:         '',
      response_type: 'code',
      create_cookie: true
    }, {
      headers: { Authorization: `Bearer ${sessionToken}` },
      timeout: 10000
    });
    console.log('    → Status:', r4.data?.s, 'Code:', r4.data?.code);
    console.log('    → Full:', JSON.stringify(r4.data));
    authCode = r4.data?.data?.authorization_code || r4.data?.data?.auth || r4.data?.authorization_code || r4.data?.auth_code || r4.data?.data?.code;
    if (authCode) console.log('    ✅ auth_code:', authCode.substring(0, 40), '...\n');
  } catch (e) {
    const d = e.response?.data;
    console.error('    ❌ /api/v3/token failed:', d || e.message);
    // Some implementations put the code directly — check for redirect URL in Location header
    if (e.response?.headers?.location) {
      const loc = e.response.headers.location;
      console.log('    Location header:', loc);
      const match = loc.match(/[?&]auth_code=([^&]+)/);
      if (match) { authCode = match[1]; console.log('    ✅ auth_code from Location:', authCode.substring(0, 40)); }
    }
  }
  if (!authCode) { console.log('    Trying alternate payload...'); }

  // ── Step 5: validate-authcode → final access_token ──
  if (authCode) {
    console.log('[5] validate-authcode...');
    try {
      const appIdHash = crypto.createHash('sha256').update(`${APP_ID}:${SECRET_KEY}`).digest('hex');
      const r5 = await axios.post(`${API_BASE}/token`, {
        grant_type: 'authorization_code',
        appIdHash,
        code: authCode,
        redirect_uri: REDIRECT
      }, { timeout: 10000 });
      console.log('    →', JSON.stringify(r5.data));
      if (r5.data?.access_token) {
        console.log(`\n🎉 FINAL access_token obtained!`);
        console.log(`   Token (first 60): ${r5.data.access_token.substring(0, 60)}...`);
        console.log(`\n   Add to .env / use in WebSocket as: ${APP_ID}:${r5.data.access_token.substring(0, 20)}...`);
      }
    } catch (e) {
      console.error('    ❌ validate-authcode failed:', e.response?.data || e.message);
    }
  } else {
    console.log('\n⚠️  Could not get auth_code from step 4. Check payload format.');
    console.log('   Session token from step 3 can still be used directly for WebSocket.');
    console.log(`   Session token format for WS: ${APP_ID}:${sessionToken.substring(0, 30)}...`);
  }
}

main().catch(e => {
  const d = e.response?.data;
  console.error('\n❌ FATAL:', d ? JSON.stringify(d) : e.message);
  process.exit(1);
});
