# Stockslab Enterprise Architecture: Complete Upgrade Plan V3

This document is the definitive enterprise architecture roadmap for the Stockslab trading platform, explicitly optimized for a simulated B-Book / Dabba trading ecosystem. It builds upon previous iterations by introducing deep technical clarifications on risk aggregation, order priority, time synchronization, and a safe, phased migration strategy.

All architectural choices adhere to **free, open-source technologies**.

---

## 1. Raw Tick Processing vs. UI Throttling

A critical danger in realtime trading is throttling market ticks at the source. 

**The Golden Rule:** The internal risk and execution engines must receive **100% of all market ticks instantly**. Throttling/debouncing is strictly a visual optimization for the Frontend UI to prevent browser freezing.

### The Architecture Flow:
```text
[Raw Market Feed (Angel One)]
       ↓ (100% of Ticks)
[Feed Normalizer] → Applies server-authoritative timestamps.
       ↓
[Internal Engine Pipeline (Redis Pub/Sub: `internal:ticks`)]
   ├──> [Risk Engine] (Validates global exposure limits instantly)
   ├──> [PNL Engine] (Recalculates MTM & auto-square-off conditions instantly)
   └──> [Execution Engine] (Executes pending market orders at exact tick price)
       ↓
[UI Broadcast Aggregator]
       ↓ (Throttled: max 2 ticks/sec per symbol)
[uWebSockets.js Broadcast Layer (Pub/Sub: `public:ticks`)]
       ↓
[Frontend UI]
```

---

## 2. Dedicated Position Management Engine

The platform acts as the counterparty, making accurate position tracking paramount.

### Core Logic:
*   **Weighted Average Entry Price:** Used for merging multiple entries into a single position.
*   **Netting Logic:** A new "Buy" order on an existing "Sell" position results in a partial close (realizing PNL) rather than opening a hedged position.
*   **FIFO (First In, First Out):** Partial closes realize PNL against the oldest execution quantities first.
*   **Realized vs. Unrealized PNL:** Unrealized PNL fluctuates with ticks. Realized PNL is locked permanently into the user's ledger upon partial/full close.

### State Management:
*   **Redis (Live State):** Holds active positions `pos:{user_id}:{symbol}` and continuously recalculates Unrealized PNL based on the `internal:ticks` stream.
*   **Postgres (Persistence):** Only updated when a position is opened, modified, or closed. Reads are rare; writes happen asynchronously.

---

## 3. Exposure Aggregation Engine (B-Book Risk)

Because the platform takes the opposite side of all trades, massive imbalances on a single symbol (e.g., everyone going long on RELIANCE) present an existential threat to the platform's capital.

### Aggregation Hierarchy (Maintained in Redis Hashes):
1.  **User Exposure:** `exp:user:{user_id}`
2.  **Dealer Exposure:** `exp:dealer:{dealer_id}` (Aggregate of all dealer's users).
3.  **Symbol Imbalance:** `exp:symbol:{symbol}` (Net Long vs. Net Short volume across the entire platform).
4.  **Global Platform Exposure:** `exp:global:net`

### Realtime Risk Flow:
Whenever a user requests an order, the Risk Engine checks the `exp:symbol:{symbol}`. If the Net Long exposure exceeds the admin-defined maximum threshold, the Risk Engine instantly rejects the order, protecting the platform from catastrophic payouts.

---

## 4. Time Synchronization Architecture

Time must be absolute and deterministic to prevent race conditions and ensure accurate charting.

*   **Server Authoritative Timestamps:** Client-side timestamps are fully ignored.
*   **Normalization:** The Feed Normalizer attaches a precise UNIX timestamp to every incoming tick. This timestamp is carried through the entire system (PNL, Risk, Execution, Charts).
*   **Event Ordering:** Redis Pub/Sub does not guarantee strict ordering under extreme load. The Execution Engine relies on the attached timestamp, dropping any tick older than the previously processed tick.
*   **Clock Drift:** All backend servers will use NTP (Network Time Protocol) to sync system clocks to `pool.ntp.org`.

---

## 5. API Gateway / Edge Routing Architecture

As we transition to multiple microservices (API vs WebSockets), a reverse proxy is required.

### Routing Topology (NGINX / Traefik)
```text
Internet 
   ↓ (SSL Termination)
[ NGINX Gateway ]
   ├── path: /api/*    → [ Node API Cluster ] (HTTP REST, Round Robin)
   ├── path: /admin/*  → [ Node API Cluster ] (HTTP REST, Role-restricted)
   ├── path: /socket.io/* → [ Socket.IO Cluster ] (Requires IP_HASH / Sticky Sessions)
   └── path: /ws/feed  → [ uWebSockets.js Microservice ] (High concurrency, stateless)
```

---

## 6. BullMQ Priority System

Not all orders are equal. A risk-triggered liquidation must jump ahead of a standard market order.

### Queue Priority Configuration:
1.  **Priority 1 (Highest): `AUTO_SQUARE_OFF`** & Risk Events.
2.  **Priority 2: `MARKET_ORDER`** & Limit Order triggers.
3.  **Priority 3: `NORMAL_ORDER`** (Standard placements).
4.  **Priority 4: `BACKGROUND_JOBS`** (Ledger generation, email reports).

*   **Dead Letter Queue (DLQ):** Failed executions are moved to a DLQ and alert the admin dashboard. They are never retried automatically to prevent duplicate fills.

---

## 7. Socket Lifecycle & Memory Management

Memory leaks in WebSocket servers will crash Node.js.

*   **Ping/Pong:** Server pings client every 25 seconds. If no pong within 5 seconds, the socket is forcibly destroyed.
*   **Zombie Sweep:** A cron job runs every 5 minutes comparing active Redis sessions against connected socket IDs, purging orphans.
*   **Reconnect Flow:** Upon reconnection, the client must transmit its last received `order_update_id`. The server replays any missed events from a temporary Redis List cache.

---

## 8. Redis High Availability (HA) Roadmap

*   **Stage 1: Standalone (Current/Phase 1).** Single Redis instance. AOF persistence enabled.
*   **Stage 2: Master/Replica + Sentinel.** Once user count exceeds 2,000. Sentinel monitors the Master; if it crashes, it automatically promotes the Replica to Master, ensuring zero downtime.
*   **Stage 3: Redis Cluster.** Only required at 15,000+ users when a single node's RAM or CPU cannot handle the volume of the PNL and Exposure engines.

---

## 9. Compliance & Immutable Logging

*   **JSON Structured Logging:** All system actions output structured JSON (Timestamp, IP, SessionID, UserID, EventType).
*   **Loki Integration:** Logs are shipped from Node.js to Grafana Loki for highly searchable, immutable log storage.
*   **Database Audit Trail:** Critical financial changes (Wallet Topups, Dealer Commission adjustments) are strictly logged in the Postgres `audit_logs` table, secured by Row Level Security so they cannot be tampered with.

---

## 10. PWA Offline Safety Strategy

*   **Safe to Cache (Service Worker):** CSS, JS, UI Images, Fonts.
*   **NEVER Cache:** API requests for Balances, Margins, Open Positions, Market Data.
*   **Safety Flow:** If the browser fires the `offline` event, the UI instantly displays a "Connection Lost" modal. The entire trade panel is disabled (`disabled=true`) to prevent queued offline clicks from firing a barrage of orders upon reconnection.

---

## 11. Realistic Implementation Order (Migration Phases)

The goal is **Safe Incremental Evolution** of the currently working system.

### Phase 1: Foundation (Socket.IO + Redis Basics)
*   **Action:** Install `redis`, `ioredis`, and `@socket.io/redis-adapter`.
*   **Code:** Convert raw `ws` in `priceEngine.js` to Socket.IO. Store user session tokens in Redis.
*   **No DB changes.** The UI connects via Socket.IO instead of raw WebSocket.
*   **Rollback:** Easily revert UI connection strings.

### Phase 2: Engine Decoupling (BullMQ + PNL Worker)
*   **Action:** Create `backend/src/core/engine` and `backend/src/core/pnl`.
*   **Code:** Reroute the `POST /api/orders` endpoint. Instead of calling Supabase `insert`, it pushes a job to BullMQ. A worker processes it and writes to Supabase. 
*   **Code:** Implement the background PNL worker in Redis.

### Phase 3: Risk Engine & Dealer Hierarchy
*   **Action:** Create `backend/src/core/risk`.
*   **Code:** Implement pre-trade validation (checking global symbol exposure in Redis). Build Dealer Socket.IO namespaces so dealers get live updates of their clients.

### Phase 4: Tick Extraction & OHLC Engine
*   **Action:** Create a separate Node.js service `uWebSockets-feed.js`.
*   **Code:** Build the Tick Normalizer, internal/public tick separation, and the 1-minute OHLC Postgres flush logic.

### Phase 5: Edge Gateway & Observability
*   **Action:** Set up NGINX proxy rules, deploy Prometheus/Grafana/Loki. 
*   **Code:** Convert `console.log` statements to Winston/Pino JSON logger for Loki consumption.
