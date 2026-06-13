# Implementation Plan: App-Wide Performance & Latency Optimizations

To maximize trading app speed, reduce CPU usage, and eliminate network latency, we will optimize bottlenecks across the database, backend HTTP routing, React state management, and render lookups.

---

## User Review Required

> [!IMPORTANT]
> **Database Indexes**:
> We will create two new indexes `idx_trades_user_closed` on `trades(user_id, closed_at DESC)` and `idx_orders_user_status` on `orders(user_id, status)`. These will speed up trade history pagination and client order lookups.

---

## Proposed Changes

### Database Layer

#### [NEW] [027_speed_up_indexes.sql](file:///c:/Users/HP/Desktop/Trading%20Company%20Project/supabase/migrations/027_speed_up_indexes.sql)
- SQL migration file to:
  1. Add composite index `idx_trades_user_closed` on `trades(user_id, closed_at DESC)` to speed up history retrieval.
  2. Add composite index `idx_orders_user_status` on `orders(user_id, status)` to speed up order history checks.

---

### Backend HTTP Layer

#### [MODIFY] [instruments.js](file:///c:/Users/HP/Desktop/Trading%20Company%20Project/backend/src/routes/instruments.js)
- Add browser `Cache-Control` header `public, max-age=300, stale-while-revalidate=60` to `GET /api/instruments` endpoint.
- Reduces network overhead by caching the static list of 3,000+ instruments in the browser for up to 5 minutes.

---

### Trader App (Client State & Rendering)

#### [MODIFY] [usePriceStore.js](file:///c:/Users/HP/Desktop/Trading%20Company%20Project/apps/trader-app/src/store/usePriceStore.js)
- Modify `startPriceFeed` process loop:
  - Do NOT copy and output the entire `instruments` array on every single frame tick update.
  - Keep the `instruments` array reference stable after initial load in `fetchInstruments`.
  - All real-time price updates (LTP, bid/ask spread) will continue updating the `instrumentsMap` reference.

#### [MODIFY] [Markets.jsx](file:///c:/Users/HP/Desktop/Trading%20Company%20Project/apps/trader-app/src/pages/Markets/Markets.jsx)
- Destructure `instrumentsMap` from `usePriceStore()`.
- Replace slow $O(N)$ lookup `instruments.find` with fast $O(1)$ lookup `instrumentsMap.get` for:
  - Nifty50 lookup.
  - BankNifty lookup.
  - Active symbols mapping within `displayInstruments`.
- In `displayInstruments` search memo, map search results to `instrumentsMap` dynamically (e.g., `map(i => instrumentsMap.get(i.symbol) || i)`) to support real-time price updates while keeping filtering extremely fast on the static array.

---

## Verification Plan

### Automated Tests
- Run `npm run build` in backend and client applications to verify no compile-time regressions.

### Manual Verification
- Measure load times on the Watchlist and search pages.
- Verify that real-time price ticks stream correctly to the Watchlist, and that panning or scrolling feels responsive.
