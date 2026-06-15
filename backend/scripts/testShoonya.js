/**
 * Shoonya API Integration Test Script
 * 
 * Usage:
 *   node scripts/testShoonya.js
 * 
 * Verifies TOTP generation, API authentication, WebSocket connection,
 * symbol mapping lookup, and live tick streaming.
 */

require('dotenv').config();
const { shoonyaFeed } = require('../src/services/shoonyaFeed');
const { loadFromDatabase: loadSymbolMap } = require('../src/services/symbolMap');

async function test() {
  console.log('═══════════════════════════════════════════════');
  console.log('  Shoonya API Feed Integration Test');
  console.log('═══════════════════════════════════════════════');

  const userId = process.env.SHOONYA_USER_ID;
  const password = process.env.SHOONYA_PASSWORD;
  const apiKey = process.env.SHOONYA_API_KEY;
  const totpSecret = process.env.SHOONYA_TOTP_SECRET;
  const vendorCode = process.env.SHOONYA_VENDOR_CODE;

  if (!userId || !password || !apiKey || !totpSecret || !vendorCode) {
    console.error('❌ ERROR: Missing Shoonya credentials in .env file!');
    console.error('Please configure:');
    console.error('- SHOONYA_USER_ID');
    console.error('- SHOONYA_PASSWORD');
    console.error('- SHOONYA_API_KEY');
    console.error('- SHOONYA_TOTP_SECRET');
    console.error('- SHOONYA_VENDOR_CODE');
    process.exit(1);
  }

  console.log(`User ID:      ${userId}`);
  console.log(`Password:     ${'*'.repeat(password.length)}`);
  console.log(`API Key:      ${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}`);
  console.log(`TOTP Secret:  ${totpSecret.substring(0, 4)}...${totpSecret.substring(totpSecret.length - 4)}`);
  console.log(`Vendor Code:  ${vendorCode}`);
  console.log('-----------------------------------------------');

  // Test dynamic TOTP generation
  try {
    const otp = shoonyaFeed._generateTOTP(totpSecret);
    console.log(`✅ TOTP Generator test: OK (Generated Code: ${otp})`);
  } catch (err) {
    console.error(`❌ TOTP Generator test failed: ${err.message}`);
    process.exit(1);
  }

  // Load symbol map
  console.log('Loading active instruments from database...');
  try {
    await loadSymbolMap();
    console.log('✅ Active instruments loaded successfully.');
  } catch (err) {
    console.warn(`⚠️ DB symbol load warning (will fallback to static mappings): ${err.message}`);
  }

  // Subscribe to live tick events
  shoonyaFeed.on('tick', (tick) => {
    console.log('\n⚡ LIVE TICK RECEIVED:');
    console.log(`   Symbol:      ${tick.symbol}`);
    console.log(`   Exchange:    ${tick.exchange}`);
    console.log(`   LTP (Price): ${tick.price}`);
    console.log(`   Bid / Ask:   ${tick.bid} / ${tick.ask}`);
    console.log(`   High / Low:  ${tick.high} / ${tick.low}`);
    console.log(`   Volume:      ${tick.volume}`);
    console.log(`   Timestamp:   ${new Date(tick.timestamp).toLocaleTimeString()}`);
  });

  // Start Shoonya feed
  console.log('\nInitializing Shoonya Feed...');
  const started = await shoonyaFeed.start();
  
  if (!started) {
    console.error('❌ Shoonya feed failed to initialize (Authentication Error).');
    process.exit(1);
  }

  console.log('Waiting 5s for connection confirmation...');
  await new Promise(r => setTimeout(r, 5000));

  if (shoonyaFeed.status !== 'CONNECTED') {
    console.error(`❌ WebSocket failed to connect. Current status: ${shoonyaFeed.status}`);
    shoonyaFeed.stop();
    process.exit(1);
  }

  console.log('\n✅ Shoonya connected successfully!');
  console.log('Subscribing to SBIN and NIFTY50...');
  
  await shoonyaFeed.subscribe(['SBIN', 'NIFTY50']);

  console.log('\nStreaming ticks (CTRL+C to stop)...');

  // Run for 30s before stopping
  setTimeout(() => {
    console.log('\nStopping Shoonya feed test...');
    shoonyaFeed.stop();
    console.log('✅ Shoonya feed stopped successfully.');
    console.log('═══════════════════════════════════════════════');
    process.exit(0);
  }, 30000);
}

test();
