/**
 * test_fyers_auth.js
 * 
 * Test Fyers automated login via vagator API:
 * 1. send_login_otp → request_key
 * 2. verify_otp (TOTP) → new request_key
 * 3. verify_pin (4-digit PIN) → access_token
 * 4. validate-authcode → final access_token
 *
 * Run: node backend/scratch/test_fyers_auth.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const crypto = require('crypto');

// ── Credentials from .env ──
const FY_ID      = process.env.FYERS_USER_ID;
const APP_ID     = process.env.FYERS_APP_ID;
const SECRET_KEY = process.env.FYERS_SECRET_KEY;
const PIN        = process.env.FYERS_PIN;
const TOTP_SECRET= process.env.FYERS_TOTP_SECRET;

// ── Endpoints ──
const VAGATOR_BASE = 'https://api-t2.fyers.in/vagator/v2';
const TOKEN_URL    = 'https://api-t1.fyers.in/api/v3/token';

// ── Native TOTP (RFC 6238) — no external deps ──
function decodeBase32(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  const buffer = [];
  const clean = base32.replace(/[\s=]/g, '').toUpperCase();
  for (const ch of clean) {
    const val = alphabet.indexOf(ch);
    if (val === -1) continue;
    bits += val.toString(2).padStart(5, '0');
  }
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    buffer.push(parseInt(bits.substring(i, i + 8), 2));
  }
  return Buffer.from(buffer);
}

function generateTOTP(secretBase32) {
  const secret = decodeBase32(secretBase32);
  const timeStep = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  buf.writeBigInt64BE(BigInt(timeStep), 0);
  const hmac = crypto.createHmac('sha1', secret).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
    ((hmac[offset]     & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8)  |
     (hmac[offset + 3] & 0xff)
  ) % 1_000_000;
  return code.toString().padStart(6, '0');
}

async function testFyersAuth() {
  console.log('═══════════════════════════════════════════');
  console.log('  Fyers Automated Auth Test');
  console.log('═══════════════════════════════════════════');
  console.log(`  FY_ID      : ${FY_ID}`);
  console.log(`  APP_ID     : ${APP_ID || '(not set – needed for token)'}`);
  console.log(`  TOTP Secret: ${TOTP_SECRET ? '***set***' : 'MISSING'}`);
  console.log(`  PIN        : ${PIN ? '***set***' : 'MISSING'}`);
  console.log('');

  // ── Step 1: send_login_otp ──
  console.log('[STEP 1] Sending login OTP to get request_key...');
  let requestKey;
  try {
    const res = await axios.post(`${VAGATOR_BASE}/send_login_otp`, {
      fy_id: FY_ID,
      app_id: '2'   // '2' = web login type
    });
    console.log('  Response:', JSON.stringify(res.data));
    if (res.data && res.data.request_key) {
      requestKey = res.data.request_key;
      console.log(`  ✅ Got request_key: ${requestKey}`);
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    const errData = err.response?.data || err.message;
    console.error('  ❌ send_login_otp failed:', errData);
    process.exit(1);
  }

  // ── Step 2: verify_otp (TOTP) ──
  console.log('\n[STEP 2] Verifying TOTP...');
  const totp = generateTOTP(TOTP_SECRET);
  console.log(`  Generated TOTP: ${totp}`);
  try {
    const res = await axios.post(`${VAGATOR_BASE}/verify_otp`, {
      request_key: requestKey,
      otp: totp
    });
    console.log('  Response:', JSON.stringify(res.data));
    if (res.data && res.data.request_key) {
      requestKey = res.data.request_key; // updated key for next step
      console.log(`  ✅ TOTP verified! New request_key: ${requestKey}`);
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    const errData = err.response?.data || err.message;
    console.error('  ❌ verify_otp failed:', errData);
    process.exit(1);
  }

  // ── Step 3: verify_pin ──
  console.log('\n[STEP 3] Verifying 4-digit PIN...');
  let accessToken;
  try {
    const res = await axios.post(`${VAGATOR_BASE}/verify_pin_v2`, {
      request_key: requestKey,
      identity_type: 'pin',
      identifier: PIN
    });
    console.log('  Response:', JSON.stringify(res.data));
    if (res.data && res.data.data && res.data.data.access_token) {
      accessToken = res.data.data.access_token;
      console.log(`  ✅ PIN verified! access_token: ${accessToken.substring(0, 20)}...`);
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    // Try the non-v2 endpoint as fallback
    console.warn('  ⚠️  verify_pin_v2 failed, trying verify_pin...');
    try {
      const res2 = await axios.post(`${VAGATOR_BASE}/verify_pin`, {
        request_key: requestKey,
        identity_type: 'pin',
        identifier: PIN
      });
      console.log('  Response:', JSON.stringify(res2.data));
      if (res2.data && res2.data.data && res2.data.data.access_token) {
        accessToken = res2.data.data.access_token;
        console.log(`  ✅ PIN verified! access_token: ${accessToken.substring(0, 20)}...`);
      } else {
        throw new Error(`Unexpected response: ${JSON.stringify(res2.data)}`);
      }
    } catch (err2) {
      const errData2 = err2.response?.data || err2.message;
      console.error('  ❌ verify_pin also failed:', errData2);
      process.exit(1);
    }
  }

  // ── Step 4: Exchange for final access_token via validate-authcode ──
  if (!APP_ID || !SECRET_KEY) {
    console.log('\n[STEP 4] ⚠️  APP_ID / SECRET_KEY not set in .env — skipping token exchange.');
    console.log('  The access_token from step 3 may be usable directly for WebSocket.');
    console.log('\n🎉 Test complete! Auth chain works up to step 3.');
    console.log(`   access_token (first 30 chars): ${accessToken.substring(0, 30)}...`);
    return;
  }

  console.log('\n[STEP 4] Exchanging for final access_token...');
  try {
    const res = await axios.post(TOKEN_URL, {
      grant_type: 'authorization_code',
      appIdHash: crypto.createHash('sha256').update(`${APP_ID}:${SECRET_KEY}`).digest('hex'),
      code: accessToken
    });
    console.log('  Response:', JSON.stringify(res.data));
    if (res.data && res.data.access_token) {
      console.log(`  ✅ Final access_token: ${res.data.access_token.substring(0, 30)}...`);
    } else {
      throw new Error(`Unexpected response: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    const errData = err.response?.data || err.message;
    console.error('  ❌ token exchange failed:', errData);
  }

  console.log('\n🎉 Fyers auth test COMPLETE!');
}

testFyersAuth().catch(err => {
  console.error('Fatal error:', err.message);
  process.exit(1);
});
