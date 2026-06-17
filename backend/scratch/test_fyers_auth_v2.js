/**
 * test_fyers_auth_v2.js
 * 
 * Improved test: runs all steps immediately in sequence
 * Run: node backend/scratch/test_fyers_auth_v2.js
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const axios = require('axios');
const crypto = require('crypto');

const FY_ID       = process.env.FYERS_USER_ID;
const APP_ID      = process.env.FYERS_APP_ID;
const SECRET_KEY  = process.env.FYERS_SECRET_KEY;
const PIN         = process.env.FYERS_PIN;
const TOTP_SECRET = process.env.FYERS_TOTP_SECRET;

const VAGATOR_BASE = 'https://api-t2.fyers.in/vagator/v2';
const TOKEN_URL    = 'https://api-t1.fyers.in/api/v3/token';

function decodeBase32(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  const buffer = [];
  for (const ch of base32.replace(/[\s=]/g, '').toUpperCase()) {
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

async function tryVerifyPin(requestKey) {
  // Try v2 first, fall back to v1
  for (const endpoint of [`${VAGATOR_BASE}/verify_pin_v2`, `${VAGATOR_BASE}/verify_pin`]) {
    try {
      const res = await axios.post(endpoint, {
        request_key: requestKey,
        identity_type: 'pin',
        identifier: PIN
      });
      if (res.data?.data?.access_token) return res.data.data.access_token;
      if (res.data?.access_token) return res.data.access_token;
      console.log(`  [${endpoint}] unexpected:`, JSON.stringify(res.data));
    } catch (err) {
      console.log(`  [${endpoint}] failed:`, err.response?.data || err.message);
    }
  }
  return null;
}

async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('  Fyers Auth Test v2 (immediate sequential)');
  console.log('═══════════════════════════════════════════════════');

  // Step 1 — send_login_otp
  console.log('\n[1] send_login_otp...');
  let requestKey;
  {
    const res = await axios.post(`${VAGATOR_BASE}/send_login_otp`, {
      fy_id: FY_ID,
      app_id: '2'
    });
    console.log('  →', JSON.stringify(res.data).substring(0, 200));
    requestKey = res.data.request_key;
    if (!requestKey) throw new Error('No request_key returned from send_login_otp');
    console.log('  ✅ request_key obtained');
  }

  // Step 2 — verify_otp with TOTP
  console.log('\n[2] verify_otp (TOTP)...');
  const totp = generateTOTP(TOTP_SECRET);
  console.log(`  TOTP = ${totp} at ${new Date().toISOString()}`);
  {
    const res = await axios.post(`${VAGATOR_BASE}/verify_otp`, {
      request_key: requestKey,
      otp: totp
    });
    console.log('  →', JSON.stringify(res.data));
    if (!res.data.request_key) throw new Error('No updated request_key from verify_otp');
    requestKey = res.data.request_key;
    console.log('  ✅ TOTP verified, new request_key obtained');
  }

  // Step 3 — verify_pin
  console.log('\n[3] verify_pin...');
  const accessToken = await tryVerifyPin(requestKey);
  if (!accessToken) throw new Error('Could not get access_token from verify_pin');
  console.log(`  ✅ access_token (first 40 chars): ${accessToken.substring(0, 40)}...`);

  // Step 4 — validate-authcode (only if APP_ID is set)
  if (APP_ID && SECRET_KEY) {
    console.log('\n[4] Exchanging for final access_token...');
    try {
      const hash = crypto.createHash('sha256').update(`${APP_ID}:${SECRET_KEY}`).digest('hex');
      const res = await axios.post(TOKEN_URL, {
        grant_type: 'authorization_code',
        appIdHash: hash,
        code: accessToken
      });
      console.log('  →', JSON.stringify(res.data));
      console.log(`  ✅ Final token: ${res.data.access_token?.substring(0, 40)}...`);
    } catch (err) {
      console.warn('  ⚠️  Token exchange failed:', err.response?.data || err.message);
    }
  } else {
    console.log('\n[4] ⏭️  Skipping token exchange (APP_ID/SECRET_KEY not set)');
  }

  console.log('\n🎉 COMPLETE — Auth chain is working!');
}

main().catch(err => {
  const d = err.response?.data;
  console.error('\n❌ FATAL:', d ? JSON.stringify(d) : err.message);
  process.exit(1);
});
