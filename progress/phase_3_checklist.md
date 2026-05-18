# Phase 3: Trading Engine Completion

## 1. Limit Order Matching Engine
- [x] Implement robust limit order matching queue.
- [x] Connect order matching to the real-time price feed (Upstash Redis + Socket.IO).
- [x] Support order modifications (price, quantity).
- [x] Handle partial fills logic.

## 2. Stop Loss & Take Profit (SL/TP)
- [x] Centralize SL/TP logic into a resilient worker process.
- [x] Ensure SL/TP states are persisted correctly in the database.
- [x] Implement crash recovery to verify missed SL/TP triggers during downtime.

## 3. Redis Exposure & Margin Tracking
- [x] Guarantee atomicity in margin blocking using reliable transactions (Postgres RPC `FOR UPDATE`).
- [x] Fix any discrepancies between async processing and Postgres wallet state (moved blocking to synchronous route).

## 4. Fee & Brokerage Calculation
- [x] Build a robust brokerage calculation engine based on order type, segment, and client tier.
- [x] Deduct fees accurately at trade execution (close).
- [x] Record fees correctly in `wallet_transactions` for ledger/tax reports.

## 5. Order Lifecycle & Execution Reliability
- [x] Ensure consistent state transitions (Pending -> Executed/Cancelled/Rejected).
- [x] Handle failure scenarios securely (automatic rollbacks and margin release).
- [x] Centralize execution logging (via `wallet_transactions` and BullMQ events).
