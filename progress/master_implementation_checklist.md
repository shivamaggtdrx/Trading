# Stockslab Implementation Master Checklist

Use this file to track our exact progress through the 5 phases of the enterprise architecture upgrade.

## Phase 1: Foundation (Redis & Socket.IO Transition)
- [x] Install `socket.io`, `@socket.io/redis-adapter`, `ioredis` in `backend`.
- [x] Install `socket.io-client` in `apps/trader-app`.
- [x] Create `backend/src/redis/client.js` for pub/sub connections.
- [x] Create `backend/src/ws/socketServer.js` to initialize Socket.IO.
- [x] Modify `backend/src/server.js` to mount the new Socket.IO server.
- [x] Refactor `backend/src/ws/priceEngine.js` to broadcast to Socket.IO rooms.
- [x] Refactor Trader App WebSocket service to use `socket.io-client`.
- [ ] Test live price feed on frontend (market closed — verify Monday).

## Phase 2: Engine Decoupling (BullMQ & Execution)
- [x] Install `bullmq` in `backend`.
- [x] Create `backend/src/core/queues/orderQueue.js`.
- [x] Create `backend/src/core/workers/executionWorker.js`.
- [x] Create `backend/src/core/pnl/mtmCalculator.js` for background PNL.
- [x] Refactor `POST /api/orders` to push jobs to BullMQ instead of Supabase.
- [ ] Test async order matching (verify Monday with live feed).

## Phase 3: Risk Engine & Dealer Hierarchy
- [x] Create `backend/src/core/risk/validator.js` (Pre-trade checks).
- [x] Implement `exp:symbol:{symbol}` redis exposure aggregation.
- [x] Add admin emergency control API endpoints (kill switch, freeze, disable symbol).
- [x] Wire risk validator into orders route (pre-trade check before queuing).
- [x] Wire exposure update into execution worker (post-trade tracking).
- [ ] Add `/dealer` namespace in Socket.IO for live dashboard sync.
- [ ] Connect Admin Panel dealer dashboard to Socket.IO.
- [ ] Test risk rejection on over-exposure.

## Phase 4: Feed Aggregation & OHLC Generation
- [x] Create `backend/src/ws/feed/normalizer.js`.
- [x] Create `backend/src/ws/feed/ohlcAggregator.js`.
- [x] Wire normalizer + OHLC into `priceEngine.js` tick pipeline.
- [x] Create `ohlc_1m` Postgres table with unique constraint + index.
- [ ] Test historical charting UI (verify Monday with live candles).

## Phase 5: Observability & Gateway
- [x] Create `backend/src/core/monitoring/logger.js` (Winston JSON logger).
- [ ] Add Prometheus metrics endpoint to Node server.
- [ ] Configure NGINX proxy rules (or document routing for Render).
- [ ] Load test 5,000 concurrent socket connections.

## Frontend Integration (Critical)
- [x] Add `/user` namespace Socket.IO connection in `api.js`.
- [x] Export `connectUserSocket` / `disconnectUserSocket` functions.
- [x] Handle `USER:ORDER_FILLED` event in Zustand store.
- [x] Handle `USER:PNL_UPDATE` event for realtime position PNL.
- [x] Update `placeOrder` to handle `202 Accepted` (queued) response.
- [x] Connect user socket on `loadInitialData` with event handlers.
- [x] Disconnect user socket on logout.

---

## New Files Created This Session

| File | Purpose |
|---|---|
| `backend/src/redis/client.js` | ioredis pub/sub connections to Upstash |
| `backend/src/ws/socketServer.js` | Socket.IO with `/market`, `/user`, `/dealer` namespaces |
| `backend/src/ws/feed/normalizer.js` | Tick validation, corruption rejection, server timestamps |
| `backend/src/ws/feed/ohlcAggregator.js` | 1m candle builder → Redis + Postgres persistence |
| `backend/src/core/queues/orderQueue.js` | BullMQ order queue with idempotency |
| `backend/src/core/workers/executionWorker.js` | Async order processor with Socket.IO notifications |
| `backend/src/core/pnl/mtmCalculator.js` | Background PNL calculator via Redis tick cache |
| `backend/src/core/risk/validator.js` | Pre-trade risk engine (kill switch, exposure, freeze) |
| `backend/src/core/monitoring/logger.js` | Winston structured JSON logger |

## Files Modified This Session

| File | Change |
|---|---|
| `backend/src/server.js` | Mounts Socket.IO, BullMQ worker, MTM, OHLC aggregator |
| `backend/src/ws/priceEngine.js` | Full rewrite: normalizer → OHLC → execution → Redis → Socket.IO |
| `backend/src/routes/orders.js` | Queue to BullMQ instead of direct Supabase insert |
| `backend/src/routes/admin.js` | Added 8 emergency risk control API endpoints |
| `backend/src/ws/angelOneFeed.js` | Fixed totp-generator v3 breaking change |
| `backend/.env` | Added REDIS_URL (Upstash), cleared dummy Angel One creds |
| `apps/trader-app/src/services/api.js` | Migrated to socket.io-client |
