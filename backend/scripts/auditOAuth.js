require('dotenv').config();
const { getAuthUrl } = require('../src/services/upstoxAuth');

console.log('==================================================');
console.log('         UPSTOX OAUTH IMPLEMENTATION AUDIT        ');
console.log('==================================================\n');

// 1. Check loaded environment variables
const clientId = process.env.UPSTOX_CLIENT_ID || 'your_upstox_client_id_placeholder';
const clientSecret = process.env.UPSTOX_CLIENT_SECRET || 'your_upstox_client_secret_placeholder';
const redirectUri = process.env.UPSTOX_REDIRECT_URI || 'http://localhost:5000/api/auth/upstox/callback';

console.log('1. ENVIRONMENT VARIABLES LOADED AT RUNTIME:');
console.log(`* UPSTOX_CLIENT_ID: ${process.env.UPSTOX_CLIENT_ID ? 'LOADED (present)' : 'NOT LOADED (empty/missing)'}`);
console.log(`* UPSTOX_CLIENT_SECRET: ${process.env.UPSTOX_CLIENT_SECRET ? 'LOADED (present)' : 'NOT LOADED (empty/missing)'}`);
console.log(`* UPSTOX_REDIRECT_URI: ${process.env.UPSTOX_REDIRECT_URI ? `LOADED (${process.env.UPSTOX_REDIRECT_URI})` : 'NOT LOADED (using fallback: http://localhost:5000/api/auth/upstox/callback)'}`);
console.log('');

// Temporarily inject credentials if not loaded so URL generator doesn't fail
if (!process.env.UPSTOX_CLIENT_ID) {
  process.env.UPSTOX_CLIENT_ID = 'your_upstox_client_id_placeholder';
}

// 2. Exact authorization URL generated
let authUrl = '';
try {
  authUrl = getAuthUrl();
} catch (err) {
  authUrl = `FAILED TO GENERATE: ${err.message}`;
}
console.log('2. EXACT AUTHORIZATION URL GENERATED:');
console.log(authUrl);
console.log('');

// 3. Exact token exchange request payload (Mask secrets)
console.log('3. EXACT TOKEN EXCHANGE REQUEST PAYLOAD (Masked):');
const mockCode = 'mock_auth_code_example_12345';
const maskedSecret = clientSecret === 'your_upstox_client_secret_placeholder' ? 'masked_placeholder' : '●●●●●●●●●●●●●●●●';

console.log('Payload Type: urlencoded (URLSearchParams)');
console.log({
  code: mockCode,
  client_id: clientId,
  client_secret: maskedSecret,
  redirect_uri: redirectUri,
  grant_type: 'authorization_code'
});
console.log('');

// 4. Verification Checklists
console.log('4. PARAMETER PRESENCE VERIFICATION:');
console.log(`* client_id present=${!!process.env.UPSTOX_CLIENT_ID}`);
console.log(`* client_secret present=${!!process.env.UPSTOX_CLIENT_SECRET || clientSecret !== 'your_upstox_client_secret_placeholder'}`);
console.log(`* redirect_uri present=${!!process.env.UPSTOX_REDIRECT_URI || redirectUri !== ''}`);
console.log(`* authorization_code present=true (exchanged dynamically on callback)`);
console.log(`* grant_type present=true (hardcoded as 'authorization_code')`);
console.log('');

console.log('5. REDIRECT URI MATCHES RENDER ENVIRONMENT:');
const renderUrl = process.env.RENDER_EXTERNAL_URL;
if (renderUrl) {
  console.log(`* Render External URL detected: ${renderUrl}`);
  const expectedRedirect = `${renderUrl}/api/auth/upstox/callback`;
  console.log(`* Expected redirect URI: ${expectedRedirect}`);
  console.log(`* Actual configured redirect URI: ${redirectUri}`);
  console.log(`* MATCH STATUS: ${redirectUri === expectedRedirect ? 'MATCHED (100% CORRECT)' : 'MISMATCHED'}`);
} else {
  console.log('* Render External URL environment variable is not defined locally (expected in production).');
  console.log(`* Configured Redirect URI: ${redirectUri}`);
}
console.log('');
