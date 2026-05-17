# Stockslab Final Operational Refinements & Implementation Roadmap

This document serves as the final, brief clarification of operational capabilities, directly transitioning into the concrete, file-by-file Implementation Plan for executing the upgrade securely.

---

## Part 1: Final Operational Refinements

### 1. Transaction Consistency Strategy
*   **Redis (Live) vs Postgres (Source of Truth):** Redis holds active state. If Redis succeeds in logging a trade execution but Postgres fails to persist it, a background Reconciliation Job (cron) runs every 5 minutes. It sweeps Redis for executions missing from Postgres and forces an upsert, achieving **Eventual Consistency**.

### 2. Idempotent Execution Design
*   **Exactly-Once Strategy:** Every API order request generates a UUID. The BullMQ worker acquires a Redis Lock (`lock:order:{uuid}`) before processing. If the job is retried or the user double-clicks, the lock enforces duplicate rejection, ensuring execution happens exactly once.

### 3. Market Feed Failover Strategy
*   **Heartbeat Monitoring:** The Feed Adapter expects a tick at least every 5 seconds. If missed, it drops the connection and attempts immediate reconnect. Corrupted ticks (e.g., LTP missing or negative) are rejected at normalization. Future expansion allows secondary feed providers seamlessly.

### 4. Worker Scaling Strategy
*   **Separation of Concerns:** Instead of one massive worker, we run separate dedicated Node.js processes: `Worker-Execution`, `Worker-PNL`, and `Worker-Notification`. They isolate concurrency, ensuring PNL calculation never blocks order matching.

### 5. Symbol Subscription Optimization
*   **Dynamic Cleanup:** Socket.IO rooms (`feed:RELIANCE`) are joined dynamically when the symbol enters the frontend viewport/watchlist. If the user scrolls away, the client emits a `leave_room`. The system stops broadcasting that tick entirely if the room has zero subscribers, massively saving bandwidth.

### 6. Backpressure Handling
*   **Slow Clients:** If a client's websocket buffer fills up, Socket.IO inherently drops stale packets. The UI Broadcast Layer compresses payload data, and only emits the *latest* aggregated tick per symbol per 500ms, naturally protecting the server from memory overload.

### 7. Admin Emergency Controls
*   **Realtime Pub/Sub:** Admins emit emergency commands via the dashboard. Redis Pub/Sub pushes these globally to all workers. A `KILL_SWITCH` flips a Redis flag instantly blocking the Risk Engine from validating any new orders.

### 8. Secrets Management
*   **Environment Isolation:** Complete separation of `.env` files. Secrets (JWT, Angel One keys) are securely rotated and stored via standard deployment tools (e.g., Render Environment Variables). None are hardcoded.

### 9. Database Partitioning & Retention Roadmap
*   **Future Archival:** Once `audit_logs` and `trades` tables reach millions of rows, Postgres table partitioning (by month) will be applied. Data older than 6 months is archived to cheap cold storage (AWS S3 via CSV) to maintain query speed on live active trades.

---

## Part 2: Concrete Implementation Plan

We will execute this upgrade safely in 5 practical phases. **DO NOT over-engineer.** We will implement Phase 1 completely, test it, and push it to production before touching Phase 2.

### Phase 1: Foundation (Redis & Socket.IO Transition)
**Goal:** Replace raw `ws` with `Socket.IO`, establish Redis clustering capability, and standardize the frontend connection.
*   **New Packages:** `npm i socket.io @socket.io/redis-adapter ioredis socket.io-client`
*   **Files to Create:**
    *   `backend/src/redis/client.js` (Export configured `ioredis` pub/sub clients).
    *   `backend/src/ws/socketServer.js` (Initialize Socket.IO, attach Redis adapter).
*   **Files to Modify:**
    *   `backend/src/server.js`: Remove raw WebSocket server, mount `socketServer.js`.
    *   `backend/src/ws/priceEngine.js` / `angelOneFeed.js`: Instead of `ws.send()`, emit data to Socket.IO rooms (`io.to('feed:'+symbol).emit('tick', data)`).
    *   `apps/trader-app/src/services/ws.js` (or `api.js`): Switch from native `new WebSocket()` to `socket.io-client`.
*   **Testing:** Verify frontend charts and prices still update live. Verify multiple browser tabs sync perfectly using Socket.IO rooms.
*   **Rollback:** Maintain the old `ws` code commented out until deployment is confirmed stable.

### Phase 2: Engine Decoupling (BullMQ Execution & Redis State)
**Goal:** Decouple order execution from Express API routes into an asynchronous BullMQ worker.
*   **New Packages:** `npm i bullmq`
*   **Files to Create:**
    *   `backend/src/core/queues/orderQueue.js` (BullMQ setup).
    *   `backend/src/core/workers/executionWorker.js` (The process that actually matches orders and writes to DB).
    *   `backend/src/core/pnl/mtmCalculator.js` (Background Redis PNL tracker).
*   **Files to Modify:**
    *   `backend/src/routes/orders.js`: Change `POST /` from direct Supabase insert to `orderQueue.add('execute_trade', payload)`. Return `{status: 'pending'}` to UI.
*   **Testing:** Place test orders. Ensure API returns immediately, and the Worker processes it asynchronously and updates the DB.

### Phase 3: Risk Engine & Dealer Realtime Hierarchy
**Goal:** Implement pre-trade validation and give dealers instant live-book oversight.
*   **Files to Create:**
    *   `backend/src/core/risk/validator.js` (Checks Redis for global exposure limits and margin limits before pushing to BullMQ).
*   **Files to Modify:**
    *   `backend/src/ws/socketServer.js`: Add namespaces/rooms for `/dealer`.
    *   `apps/admin-panel/...`: Connect dealer dashboards to listen to Socket.IO dealer rooms for instant trade blips.
*   **Testing:** Trigger auto-rejections by manually lowering a symbol's max exposure limit.

### Phase 4: Feed Aggregation & OHLC Generation
**Goal:** Standardize the market feed and build the in-memory 1-minute candle generator.
*   **Files to Create:**
    *   `backend/src/ws/feed/normalizer.js` (Applies server timestamps).
    *   `backend/src/ws/feed/ohlcAggregator.js` (Builds candles in Redis, flushes to Postgres at SS:00).
*   **Files to Modify:**
    *   `backend/src/ws/angelOneFeed.js`: Pipe raw ticks through the new normalizer and aggregator.
*   **Testing:** Verify historical chart data correctly appends the newly generated 1m candles.

### Phase 5: Observability & Final Scaling Edge
**Goal:** Implement the PLG Stack and prepare for multi-instance load balancing.
*   **Files to Create:**
    *   `docker-compose.yml` (For spinning up local Redis, Prometheus, Grafana, Loki).
    *   `backend/src/core/monitoring/logger.js` (Winston JSON logger).
*   **Files to Modify:**
    *   `backend/src/server.js`: Attach Prometheus metrics endpoint.
*   **Testing:** Simulate 5,000 users. Monitor Queue latency in Grafana.
