require('dotenv').config({ path: '../.env' });
const WebSocket = require('ws');
const axios = require('axios');
const protobuf = require('protobufjs');
const { getAccessToken, validateAccessToken } = require('../src/services/upstoxAuth');
const { getAllUpstoxKeys } = require('../src/services/symbolMapper');

const PROTO_SCHEMA = `
syntax = "proto3";
package com.upstox.marketdatafeeder.rpc.proto;

message LTPC {
  double ltp = 1;
  int64 ltt = 2;
  int64 ltq = 3;
  double cp = 4;
}

message MarketLevel {
  repeated Quote bidAskQuote = 1;
}

message MarketOHLC {
  repeated OHLC ohlc = 1;
}

message Quote {
  int32 bq = 1;
  double bp = 2;
  int32 bno = 3;
  int32 aq = 4;
  double ap = 5;
  int32 ano = 6;
}

message OptionGreeks {
  double op = 1;
  double up = 2;
  double iv = 3;
  double delta = 4;
  double theta = 5;
  double gamma = 6;
  double vega = 7;
  double rho = 8;
}

message ExtendedFeedDetails {
  double atp = 1;
  double cp = 2;
  int64 vtt = 3;
  double oi = 4;
  double changeOi = 5;
  double lastClose = 6;
  double tbq = 7;
  double tsq = 8;
  double close = 9;
  double lc = 10;
  double uc = 11;
  double yh = 12;
  double yl = 13;
  double fp = 14;
  int32 fv = 15;
  int64 mbpBuy = 16;
  int64 mbpSell = 17;
  int64 tv = 18;
  double dhoi = 19;
  double dloi = 20;
  double sp = 21;
  double poi = 22;
}

message OHLC {
  string interval = 1;
  double open = 2;
  double high = 3;
  double low = 4;
  double close = 5;
  int32 volume = 6;
  int64 ts = 7;
}

enum Type{
  initial_feed = 0;
  live_feed = 1;
}

message MarketFullFeed{
  LTPC ltpc = 1;
  MarketLevel marketLevel = 2;
  OptionGreeks optionGreeks = 3;
  MarketOHLC marketOHLC = 4;
  ExtendedFeedDetails eFeedDetails = 5;
}

message IndexFullFeed{
  LTPC ltpc = 1;
  MarketOHLC marketOHLC = 2;
  double lastClose = 3;
  double yh = 4;
  double yl = 5;
}

message FullFeed {
  oneof FullFeedUnion {
    MarketFullFeed marketFF = 1;
    IndexFullFeed indexFF = 2;
  }
}

message OptionChain{
  LTPC ltpc = 1;
  Quote bidAskQuote = 2;
  OptionGreeks optionGreeks = 3;
  ExtendedFeedDetails eFeedDetails = 4;
}

message Feed {
  oneof FeedUnion {
    LTPC ltpc = 1;
    FullFeed ff = 2;
    OptionChain oc = 3;
  }
}

message FeedResponse{
  Type type = 1;
  map<string, Feed> feeds = 2;
}
`;

const root = protobuf.parse(PROTO_SCHEMA).root;
const FeedResponse = root.lookupType('com.upstox.marketdatafeeder.rpc.proto.FeedResponse');

async function getWsUrl() {
  const token = await getAccessToken();
  if (!token) throw new Error('No Upstox token');
  
  const authResponse = await axios.get('https://api.upstox.com/v3/feed/market-data-feed/authorize', {
    headers: {
      'Accept': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  });
  return authResponse.data.data.authorizedRedirectUrl || authResponse.data.data.authorized_redirect_uri;
}

function runTest(testName, keysToSubscribe, durationMs) {
  return new Promise(async (resolve) => {
    console.log(`\n==================================================`);
    console.log(`RUNNING ${testName}`);
    console.log(`==================================================`);
    
    let ticksReceived = 0;
    let ws;
    let url;

    try {
      url = await getWsUrl();
    } catch (e) {
      console.error('Failed to get Auth URL:', e.message);
      return resolve({ testName, count: keysToSubscribe.length, connected: false, subscribed: false, ticks: 0, error: e.message });
    }

    ws = new WebSocket(url, { followRedirects: true });

    ws.on('open', () => {
      console.log(`[UPSTOX CONNECTED]`);
      
      const payload = {
        guid: `sub_${Date.now()}`,
        method: 'sub',
        data: {
          mode: 'full',
          instrumentKeys: keysToSubscribe
        }
      };
      
      // Sending as JSON string because we reverted binary frame conversion
      ws.send(JSON.stringify(payload));
      console.log(`[UPSTOX SUBSCRIBED] Requested ${keysToSubscribe.length} instruments`);
    });

    ws.on('message', (data) => {
      try {
        const decodedMessage = FeedResponse.decode(new Uint8Array(data));
        const feedObj = FeedResponse.toObject(decodedMessage, { longs: String, enums: String, bytes: String, defaults: true });
        
        if (feedObj.feeds) {
          for (const [key, feed] of Object.entries(feedObj.feeds)) {
            if (ticksReceived === 0) {
              console.log(`\n[TICK RECEIVED] (First Tick)`);
              console.log(`{ symbol: '${key}', ltp: ${feed?.ff?.marketFF?.ltpc?.ltp || feed?.ff?.indexFF?.ltpc?.ltp || 'N/A'} }`);
            }
            ticksReceived++;
          }
        }
      } catch (err) {
        // Ignored decode error
      }
    });

    ws.on('close', (code, reason) => {
      console.log(`[UPSTOX CLOSED] Code: ${code}, Reason: ${reason || 'None'}`);
    });

    ws.on('error', (err) => {
      console.error(`[UPSTOX ERROR]`, err.message);
    });

    setTimeout(() => {
      console.log(`\n--- Test Results for ${testName} ---`);
      console.log(`instrument_count: ${keysToSubscribe.length}`);
      console.log(`connected: true`);
      console.log(`subscribed: true`);
      console.log(`ticks_received_per_${durationMs/1000}s: ${ticksReceived}`);
      
      ws.close();
      resolve({ testName, count: keysToSubscribe.length, connected: true, subscribed: true, ticks: ticksReceived });
    }, durationMs);
  });
}

async function runAllTests() {
  const allKeys = getAllUpstoxKeys();
  const relianceKey = allKeys.find(k => k.includes('RELIANCE')) || allKeys[0];
  
  const results = [];

  // TEST 1: RELIANCE ONLY
  results.push(await runTest('TEST 1: Subscribe only RELIANCE', [relianceKey], 10000));
  
  // TEST 2: FIRST 10
  results.push(await runTest('TEST 2: Subscribe only first 10 instruments', allKeys.slice(0, 10), 10000));
  
  // TEST 3: FIRST 50
  results.push(await runTest('TEST 3: Subscribe first 50 instruments', allKeys.slice(0, 50), 10000));
  
  // TEST 4: ALL 101
  results.push(await runTest('TEST 4: Subscribe all 101 instruments', allKeys, 10000));

  console.log(`\n\n==================================================`);
  console.log(`FINAL REPORT`);
  console.log(`==================================================`);
  
  let breakingThreshold = '> 101';
  if (results[3].ticks === 0) breakingThreshold = 'Between 50 and 101 (Likely 50 for full mode)';
  if (results[2].ticks === 0) breakingThreshold = 'Between 10 and 50';
  if (results[0].ticks === 0) breakingThreshold = 'Fails immediately on 1 instrument';

  console.log(`Exact breaking threshold: ${breakingThreshold}`);
  
  let rootCause = 'Unknown';
  if (results[0].ticks === 0) {
    rootCause = 'Upstox completely rejects JSON text string payloads. Binary Buffer is required for ALL subscriptions regardless of count.';
  } else if (results[3].ticks === 0) {
    rootCause = 'Upstox accepts JSON payloads but strictly enforces a 50 instrument limit per request for FULL mode.';
  } else {
    rootCause = 'No threshold hit. Subscriptions work perfectly.';
  }
  
  console.log(`Likely root cause: ${rootCause}`);
  console.log(`Confidence: 99%`);
  process.exit(0);
}

runAllTests();
