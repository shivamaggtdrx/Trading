require('dotenv').config();
const crypto = require('crypto');
const axios = require('axios');

function sha256(text) {
  return crypto.createHash('sha256').update(text).digest('hex');
}

function decodeBase32(base32) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  const buffer = [];
  const cleanSecret = base32.replace(/[\s=]/g, '').toUpperCase();
  for (let i = 0; i < cleanSecret.length; i++) {
    const val = alphabet.indexOf(cleanSecret[i]);
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
  const epoch = Math.floor(Date.now() / 1000);
  const timeStep = Math.floor(epoch / 30);

  const buffer = Buffer.alloc(8);
  buffer.writeBigInt64BE(BigInt(timeStep), 0);

  const hmac = crypto.createHmac('sha1', secret).update(buffer).digest();

  const offset = hmac[hmac.length - 1] & 0xf;
  const code = (
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff)
  ) % 1000000;

  return code.toString().padStart(6, '0');
}

async function run() {
  const userId = process.env.SHOONYA_USER_ID;
  const password = process.env.SHOONYA_PASSWORD;
  const apiKey = process.env.SHOONYA_API_KEY;
  const totpSecret = process.env.SHOONYA_TOTP_SECRET;
  const vendorCode = process.env.SHOONYA_VENDOR_CODE;
  const imei = process.env.SHOONYA_IMEI || 'abc1234';

  const totpCode = generateTOTP(totpSecret);
  const pwdHash = sha256(password);
  const appkeyHash = sha256(`${userId}|${apiKey}`);

  const payload = {
    apkversion: '1.0.0',
    uid: userId,
    pwd: pwdHash,
    factor2: totpCode,
    vc: vendorCode,
    appkey: appkeyHash,
    imei: imei,
    source: 'API'
  };

  const jsonPayload = JSON.stringify(payload);
  console.log('--- Payload Details ---');
  console.log('UID:', userId);
  console.log('TOTP:', totpCode);
  console.log('PWD Hash:', pwdHash);
  console.log('AppKey Hash:', appkeyHash);
  console.log('Vendor Code:', vendorCode);
  console.log('IMEI:', imei);
  console.log('jData length:', jsonPayload.length);
  console.log('Raw Payload:', jsonPayload);
  console.log('-----------------------');

  // Test 1: Axios application/x-www-form-urlencoded
  try {
    console.log('\nSending via Axios POST urlencoded...');
    const res = await axios.post(
      'https://api.shoonya.com/NorenWClientTP/QuickAuth',
      `jData=${jsonPayload}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 8000
      }
    );
    console.log('Axios Response Status:', res.status);
    console.log('Axios Response Data:', res.data);
  } catch (err) {
    console.error('Axios Failed:', err.message);
    if (err.response) {
      console.error('Axios Response Status:', err.response.status);
      console.error('Axios Response Data:', err.response.data);
    }
  }

  // Test 2: Axios urlencoded with encodeURIComponent
  try {
    console.log('\nSending via Axios POST encoded...');
    const res = await axios.post(
      'https://api.shoonya.com/NorenWClientTP/QuickAuth',
      `jData=${encodeURIComponent(jsonPayload)}`,
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 8000
      }
    );
    console.log('Axios Encoded Response Status:', res.status);
    console.log('Axios Encoded Response Data:', res.data);
  } catch (err) {
    console.error('Axios Encoded Failed:', err.message);
    if (err.response) {
      console.error('Axios Encoded Response Status:', err.response.status);
      console.error('Axios Encoded Response Data:', err.response.data);
    }
  }
}

run();
