# Stockslab Enterprise Architecture: Complete Upgrade Plan V2

This document expands on the initial upgrade roadmap, detailing the deep enterprise-level infrastructure required for a high-concurrency, simulated (B-Book / Dabba) trading ecosystem. 

All architectural choices here adhere to **free, open-source technologies** (avoiding paid services like Datadog, AWS Managed Redis, or Pusher) while maintaining the capability to scale from 1,000 to 10,000+ concurrent users.

---

## 1. High-Performance Market Tick Architecture

**The Problem:** While Socket.IO is excellent for reliable, stateful communication (orders, notifications), its polling-fallback mechanism and packet overhead make it inefficient for pushing raw price ticks to 10,000+ users simultaneously.

**The Solution:** Separation of Transport Layers.
*   **Socket.IO (Stateful):** Used for Account Events, Order Updates, Notifications, and Dealer Sync.
*   **uWebSockets.js (Stateless, High-Speed):** Used purely for the Market Tick Broadcast layer. It is built in C++ and can comfortably handle 10k-100k concurrent connections on a single cheap VPS.

**Scaling Roadmap for Market Ticks:**
*   **1,000+ Users:** Socket.IO is perfectly fine. Keep it simple.
*   **5,000+ Users:** Transition the `/market` namespace to a dedicated Socket.IO node cluster.
*   **10,000+ Users:** Strip market data out of Socket.IO entirely. Implement a lightweight `uWebSockets.js` microservice that ONLY reads from Redis Pub/Sub and broadcasts binary/compact JSON ticks.

---

## 2. Market Feed Aggregation Layer

To handle market data efficiently without overwhelming the system, we need a standardized pipeline:

```text
[Feed Provider (Angel One)] 
       ↓
[Feed Adapter] → Normalizes vendor-specific JSON into standard Stockslab format.
       ↓
[Tick Aggregator] → Debounces/thottles ticks (e.g., max 2 ticks per second per symbol) to prevent UI freezing. Drops out-of-order ticks.
       ↓
[Redis Pub/Sub] → Publishes to channel `market:ticks`.
       ↓
[Broadcast Layer] → Node/uWebSockets consumes Redis and broadcasts to clients.
```

---

## 3. Candle / OHLC Engine Architecture

Generating real-time charts requires an efficient OHLC (Open, High, Low, Close) pipeline.

1.  **Tick Ingestion:** The Market Feed Aggregation layer sends valid ticks to the OHLC Engine.
2.  **In-Memory Aggregation (Redis):** Ticks are aggregated in Redis for the current live minute (1m candle).
3.  **Minute Rollover:** At `SS:00`, the completed 1m candle is:
    *   Saved to **PostgreSQL** (for historical retention).
    *   Published via Redis Pub/Sub `market:candles:1m` (UI updates the chart).
4.  **Higher Timeframes:** 5m, 15m, 1H candles are calculated programmatically by aggregating the closed 1m candles.
5.  **UI Consumption:** When a user opens a chart, the UI fetches historical data via HTTP REST (from Postgres), and then subscribes to the live tick WebSocket to paint the current, unfinished candle dynamically.

---

## 4. Event-Driven Architecture

To decouple services, the system will use **Redis Pub/Sub** for transient events and **Redis Streams (or BullMQ)** for guaranteed events.

**Standardized Event Dictionary:**
*   `ORDER_PLACED`: User submitted order (Queue picks it up).
*   `ORDER_REJECTED`: Risk Engine denied the order.
*   `ORDER_FILLED`: Execution worker completed the trade.
*   `POSITION_OPENED` / `POSITION_CLOSED`: Emitted for UI state sync.
*   `MARGIN_UPDATED`: Broadcast to user and dealer.
*   `PNL_TICK`: Internal event used by Risk Engine to check auto-square-off.
*   `AUTO_SQUARE_OFF`: System forcefully closed positions.

---

## 5. Risk Engine Architecture (Pre-Trade Validation)

In a simulated B-Book model, the platform absorbs client losses and pays out client profits. Therefore, **Risk Validation must happen BEFORE the execution queue.**

**The Validation Flow:**
1.  **Incoming Order** → Hits API.
2.  **Risk Engine Check (Redis):**
    *   *Margin Check:* Does the user have enough available margin?
    *   *Max User Exposure:* Does this breach the user's max lot size?
    *   *Max Symbol Exposure:* Is the platform too heavily exposed to RELIANCE? (If yes, reject).
    *   *Kill Switch Status:* Is trading globally halted by Admin?
3.  **Queue Insertion:** If passed, order enters BullMQ.
4.  **Post-Trade Risk (Continuous):** The background PNL worker evaluates live MTM. If margin drops below 5%, it emits `AUTO_SQUARE_OFF` directly into the Execution Queue with top priority.

---

## 6. Redis Persistence & Recovery Strategy

Since Redis holds critical live state (PNL, Active Positions, Margins), a crash could disrupt trading.

*   **Persistence Strategy:** We will use **AOF (Append Only File)** with `everysec` syncing. This guarantees maximum data loss of 1 second in a catastrophic crash, without the heavy disk I/O of synchronous writes.
*   **PostgreSQL as Source of Truth:** Redis is a fast cache. All wallets, executed trades, and ledger entries are securely in Postgres.
*   **Crash Recovery Flow:** If Redis restarts, a startup script immediately reads all `status='open'` positions and `wallets` from Postgres, reconstructing the Redis Hashes (`pos:user123`) before the WebSocket server accepts new connections.

---

## 7. Monitoring & Observability Stack (Free & Open Source)

Instead of expensive paid tools (Datadog), we will deploy the **PLG Stack** alongside Sentry.

*   **Sentry:** (Free Tier / Self-hosted) For unhandled NodeJS exceptions and API 500 errors.
*   **Prometheus:** Scrapes metrics from our Node.js servers (Active WS connections, Queue Length, Order execution latency).
*   **Grafana:** Visualizes Prometheus data. Creates dashboards for:
    *   System Health (CPU/RAM).
    *   Trading Health (Orders per second, Feed latency).
*   **Alerting:** Grafana alerts sent to a Discord/Telegram webhook if Queue length > 100 or Feed latency > 2 seconds.

---

## 8. Database vs. Redis Responsibility

Clear separation is critical for preventing database lockups.

| Data Type | Stored In | Reason |
| :--- | :--- | :--- |
| **Live Market Ticks** | Redis (Memory Only) | Postgres would crash. Ticks are transient. |
| **Active Sessions** | Redis | Fast token validation on every API/WS request. |
| **Live PNL & Margin** | Redis | Continuously updated every second. |
| **Open Positions** | Both | Master record in Postgres; Live copy in Redis for PNL math. |
| **Executed Trades** | Postgres | Immutable financial records. |
| **Ledger / Wallet Balance** | Postgres | Source of truth for money. |
| **User Profiles / KYC** | Postgres | Relational, infrequently changed data. |

---

## 9. Security Hardening

*   **WebSocket Authentication:** Do not send JWTs in WS URLs (they leak in logs). Use a "Ticket" system. Client requests a short-lived (5s) ticket via HTTP API, then connects to WS using that ticket.
*   **Anti-Replay & Idempotency:** Every order payload includes a UUID. Redis caches this UUID for 5 seconds. If the user double-clicks "Buy", the second request is dropped.
*   **Rate Limiting:** `rate-limit-redis` applied to APIs.
*   **Dealer Abuse Protection:** Dealers have restricted UI views. API strictly validates that a dealer can only query `user_ids` mapped to their `dealer_id`.

---

## 10. Practical Scaling Stages (Startup to Enterprise)

**Stage 1: Current Architecture (1 - 500 Users)**
*   Single monolithic Node.js server.
*   Raw WebSockets / basic Socket.IO.
*   PostgreSQL handling everything.
*   *Cost: Extremely low (Render Free/Starter).*

**Stage 2: The Decoupling (500 - 2,000 Users)**
*   Introduce **Redis** and **BullMQ**.
*   Shift PNL calculation and Margin checks to Redis.
*   Deploy Node.js server to 2 instances behind a Load Balancer.

**Stage 3: Worker Separation (2,000 - 5,000 Users)**
*   Split repository into `api-server` and `execution-worker`.
*   Deploy 2x API servers, 1x dedicated Execution Worker.
*   Introduce Prometheus/Grafana for monitoring.

**Stage 4: Tick Extraction (5,000 - 10,000+ Users)**
*   Extract market feed broadcasting into a dedicated `uWebSockets.js` microservice.
*   API servers now only handle HTTP requests and private account Socket.IO events.

---

## 11. Redis Key Structure Design

Consistent naming prevents memory leaks and makes debugging easy.

*   `session:{user_id}` → String (JWT token hash)
*   `feed:{symbol}:last` → Hash (ltp, bid, ask, volume)
*   `pos:{user_id}:{symbol}` → Hash (qty, entry_price, side)
*   `margin:{user_id}` → Hash (available, blocked, mtm_pnl)
*   `config:tier:{tier_id}` → Hash (spread_markup, max_leverage)
*   `q:orders` → BullMQ List (handled by library)

---

## 12. Socket Event Naming Structure

Standardized, domain-driven event names.

**Client to Server:**
*   `TRADE:PLACE_ORDER`
*   `TRADE:CANCEL_ORDER`
*   `MARKET:SUBSCRIBE_TICKERS`

**Server to Client:**
*   `MARKET:TICK` (Payload: `{sym, ltp, bid, ask}`)
*   `ACCOUNT:ORDER_UPDATE` (Payload: `{id, status, filled_price}`)
*   `ACCOUNT:MARGIN_UPDATE` (Payload: `{available, used}`)
*   `ACCOUNT:POSITION_UPDATE` (Payload: `{sym, live_pnl}`)
*   `SYSTEM:NOTIFICATION`
*   `SYSTEM:ERROR`

---

## 13. Folder Restructuring Plan (Non-Destructive)

We will evolve the backend without rewriting the current routes.

```text
backend/
├── src/
│   ├── api/                 # Moved existing routes here
│   │   ├── controllers/
│   │   └── routes/          # admin.js, auth.js, etc.
│   ├── core/                # New! Heart of the platform
│   │   ├── engine/          # BullMQ Execution workers
│   │   ├── risk/            # Pre-trade validation logic
│   │   └── pnl/             # Background MTM calculator
│   ├── ws/                  
│   │   ├── feed/            # Angel One adapters & Aggregator
│   │   └── socket/          # Socket.io namespace handlers
│   ├── db/                  # Supabase clients
│   ├── redis/               # New! Redis client & key managers
│   └── server.js            # Entry point (connects API + WS)
```

**How to migrate safely:**
Create the `core/` and `redis/` folders. Begin wiring up BullMQ alongside the existing synchronous routes. Once the queue is tested and stable, flip the API routes to push to the queue instead of directly querying Supabase. Old routes remain functional until they are deprecated.
