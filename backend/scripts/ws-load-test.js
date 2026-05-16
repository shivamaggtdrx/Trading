const WebSocket = require('ws');
const { performance } = require('perf_hooks');

const WS_URL = process.env.WS_URL || 'ws://localhost:4000/realtime';
const MAX_CLIENTS = parseInt(process.env.MAX_CLIENTS) || 500;
const RAMP_UP_MS = parseInt(process.env.RAMP_UP_MS) || 5000;
const TEST_DURATION_MS = parseInt(process.env.TEST_DURATION_MS) || 30000;

console.log(`\n🚀 Starting WebSocket Load Test`);
console.log(`🔗 Target URL: ${WS_URL}`);
console.log(`👥 Target Clients: ${MAX_CLIENTS}`);
console.log(`⏱️ Ramp Up: ${RAMP_UP_MS}ms`);
console.log(`⏳ Duration: ${TEST_DURATION_MS}ms\n`);

let activeConnections = 0;
let failedConnections = 0;
let messagesReceived = 0;
let firstMessageLatencies = [];
const clients = [];

// Helper to spawn a client
function spawnClient(id) {
  const ws = new WebSocket(WS_URL);
  const connectStart = performance.now();

  ws.on('open', () => {
    activeConnections++;
    const connectTime = performance.now() - connectStart;
    
    // Send subscription
    ws.send(JSON.stringify({
      type: 'subscribe',
      symbols: ['RELIANCE', 'TCS', 'HDFCBANK', 'NIFTY50']
    }));

    // Start latency timer
    ws.firstMessageTimer = performance.now();
  });

  ws.on('message', (data) => {
    messagesReceived++;
    
    // Measure latency of first meaningful message
    if (ws.firstMessageTimer) {
      const latency = performance.now() - ws.firstMessageTimer;
      firstMessageLatencies.push(latency);
      ws.firstMessageTimer = null; // Clear timer
    }
  });

  ws.on('error', (err) => {
    // console.error(`Client ${id} error:`, err.message);
  });

  ws.on('close', () => {
    activeConnections--;
  });

  clients.push(ws);
}

// Ramp up clients
console.log('📈 Ramping up clients...');
for (let i = 0; i < MAX_CLIENTS; i++) {
  setTimeout(() => {
    spawnClient(i);
  }, (RAMP_UP_MS / MAX_CLIENTS) * i);
}

// Print stats interval
const interval = setInterval(() => {
  console.log(`[Stats] Active: ${activeConnections} | Failed/Closed: ${MAX_CLIENTS - activeConnections} | Msgs: ${messagesReceived}`);
}, 2000);

// Finish test
setTimeout(() => {
  clearInterval(interval);
  
  console.log(`\n✅ Load Test Completed!`);
  console.log(`-----------------------------------`);
  console.log(`👥 Total Spawned: ${MAX_CLIENTS}`);
  console.log(`🟢 Peak Active: ${activeConnections}`);
  console.log(`🔴 Failed/Closed: ${MAX_CLIENTS - activeConnections}`);
  console.log(`📩 Total Messages Processed: ${messagesReceived}`);
  
  if (firstMessageLatencies.length > 0) {
    const avgLatency = firstMessageLatencies.reduce((a, b) => a + b, 0) / firstMessageLatencies.length;
    const maxLatency = Math.max(...firstMessageLatencies);
    console.log(`⏱️ Avg Time to First Msg: ${avgLatency.toFixed(2)}ms`);
    console.log(`📈 Max Time to First Msg: ${maxLatency.toFixed(2)}ms`);
  } else {
    console.log(`⏱️ Time to First Msg: N/A (no messages received)`);
  }
  console.log(`-----------------------------------\n`);

  // Close all
  clients.forEach(c => c.close());
  process.exit(0);

}, RAMP_UP_MS + TEST_DURATION_MS);
