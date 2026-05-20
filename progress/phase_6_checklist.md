# Phase 6: Performance & Scaling

## 1. Redis Optimization
- [ ] Replace `redisClient.keys()` in `/exposure-heatmap` with SCAN-based iteration (safe for large symbol sets)
- [ ] Add `EXPIRE` TTL to tick cache keys (`tick:{symbol}`) — prevent unbounded memory growth
- [ ] Add `EXPIRE` TTL to PNL cache keys (`pnl:{userId}`) — TTL 30s
- [ ] Add `EXPIRE` TTL to exposure keys (`exp:symbol:{symbol}`) — TTL 24h, reset on trade
- [ ] Batch MTM `hset` writes using Redis pipelines instead of sequential awaits

## 2. Reduce Unnecessary Realtime Writes
- [ ] MTM Calculator: Skip emitting USER:PNL_UPDATE if PNL changed < 0.01 (dead-band filter)
- [ ] MTM Calculator: Skip Redis `hset` write if PNL has not changed since last write
- [ ] Market feed: Throttle tick broadcasts to max 1 emit per symbol per 250ms (prevents flooding)
- [ ] Rate-limit Socket.IO event emission: only emit if value has changed by > threshold

## 3. Fix N+1 DB Queries
- [ ] `GET /admin/dashboard`: Parallelize all 4 count queries with `Promise.all`
- [ ] `GET /admin/users`: Confirm profiles + wallets are joined in 1 query not 2
- [ ] `executionWorker`: Consolidate sequential wallet read+update into single `block_margin` RPC call
- [ ] MTM Calculator: Replace sequential `getCachedPrice` per-position loop with batched `mget`

## 4. BullMQ Dead-Letter Queue & Retry Hardening
- [ ] Add a dedicated `dead-letter-queue` in `orderQueue.js` for permanently failed jobs
- [ ] Add `moveJobToFailed` handler — after 3 attempts, save failed job metadata to `audit_logs`
- [ ] Add stalled job listener with auto-recovery (prevent jobs stuck in "active" forever)
- [ ] Add worker concurrency config (currently default=1, safe to raise to 3 for Render)

## 5. HTTP & Server Optimizations
- [ ] Add `compression` middleware to Express for gzip on all JSON responses
- [ ] Set `morgan` to combined format in production (shorter logs in dev)
- [ ] Lower Sentry `tracesSampleRate` from 1.0 to 0.1 in production (1.0 is dev-only)
- [ ] Add `Cache-Control` headers for static/stable API responses (instruments list, etc.)

## 6. Feed Resilience
- [ ] Upstox feed: Add circuit-breaker to stop retrying after 10 consecutive failures (manual reset only)
- [ ] Upstox feed: Emit Socket.IO `MARKET:FEED_STATUS` on connect/disconnect for UI indicator
- [ ] Watchdog: If no tick received in 60s, trigger reconnect and log stale feed warning
- [ ] Add fallback polling from Yahoo Finance if Upstox is down for > 2 minutes

