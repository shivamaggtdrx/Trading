# Session 5 — Trader App Backend Integration (Field Mapping + Mock Removal)
**Date:** 2026-05-11

## What Was Done

### 1. Full Page Audit
- Audited all 17 trader-app pages against backend API response formats
- Identified field name mismatches (snake_case DB → camelCase frontend) across 6 data types
- Identified 3 pages with hardcoded mock data and 1 page with non-functional submit handler

### 2. Zustand Store — Data Normalization Layer (useTradeStore.js)
Added normalization functions that map backend snake_case responses to frontend camelCase:
- `normalizeUser()` — Maps `full_name` → `name`, `client_id` → `clientId`, `referral_code` → `referralCode`
- `normalizeWallet()` — Maps `used_margin` → `usedMargin`, `today_pnl` → `todayPnl`, computes `todayPnlPercent`
- `normalizeInstrument()` — Maps `last_price` → `price`, `change_amount` → `change`, `day_high` → `high`, generates sparkline data
- `normalizePosition()` — Maps `entry_price` → `entryPrice`, `side: 'long'` → `type: 'BUY'`, computes `pnlPercent`
- `normalizeOrder()` — Maps `order_type` → `type`, `filled_at` → `filledAt`, uppercases `side`
- `normalizeTrade()` — Maps `net_pnl` → `pnl`, `entry_price` → `entryPrice`, formats date strings

Also:
- Added `walletTransactions` array to store (populated from GET /wallet)
- Added `submitDeposit()` and `submitWithdrawal()` actions to store
- Added `fetchHistory()` to `loadInitialData()` so trade history loads on login
- Updated `startPriceFeed()` to update both snake_case and camelCase fields + recalculate position P&L using normalized field names

### 3. Dashboard.jsx — Fixed
- Replaced non-existent `stocks` property with `getStocks()` method call
- Added wallet null safety (wallet defaults to zeroes while API loads)

### 4. Wallet.jsx — Complete Rewrite
- Removed hardcoded `mockTransactions` array
- Now renders real `walletTransactions` from the Zustand store
- Wired deposit modal to `submitDeposit()` → calls `POST /api/deposits`
- Wired withdrawal modal to `submitWithdrawal()` → calls `POST /api/withdrawals`
- Added UTR number input for deposits
- Added success/error feedback banners
- Added loading states on submit buttons

### 5. Trade.jsx — Wired Order Submission
- Replaced fake `handleConfirmOrder()` (just showed animation) with real implementation
- Now calls `placeOrder()` from store → `POST /api/orders`
- Sends `symbol`, `side`, `quantity`, `order_type`, and `price`/`stop_price` as appropriate
- Added error display banner for failed orders
- Added `AlertTriangle` icon import

### 6. Reports.jsx — Fixed
- Removed hardcoded `mockLedger` array
- Now builds ledger from real `walletTransactions` in the store
- Added empty state for when no transactions exist
- Fixed `winRate` divide-by-zero when no trades

### 7. Profile.jsx — Fixed
- Mapped `user.name` → `user?.name || user?.full_name`
- Mapped `user.clientId` → `user?.clientId || user?.client_id`
- Mapped `user.referralCode` → `user?.referralCode || user?.referral_code`
- Wired logout button to actually call `logout()` and redirect to `/login`

### 8. Header.jsx — Fixed
- Safe access for `user.name` with fallback: `user?.name || user?.full_name || 'Trader'`

### 9. Home.jsx — Fixed
- Added wallet null safety (same pattern as Dashboard)

## Files Modified
```
apps/trader-app/src/store/useTradeStore.js — Major: added normalization layer + new actions
apps/trader-app/src/pages/Dashboard/Dashboard.jsx — Fixed stocks + wallet null safety
apps/trader-app/src/pages/Wallet/Wallet.jsx — Complete rewrite (mock → real API)
apps/trader-app/src/pages/Trade/Trade.jsx — Wired order submission to real API
apps/trader-app/src/pages/Reports/Reports.jsx — Removed mock ledger
apps/trader-app/src/pages/Profile/Profile.jsx — Field mapping + logout wiring
apps/trader-app/src/pages/Home/Home.jsx — Wallet null safety
apps/trader-app/src/components/layout/Header.jsx — Safe user name access
```

## Build Status
✅ `vite build` passes with 0 errors (376 KB JS, 82 KB CSS)

## What's Next
1. Deploy all 3 apps (trader-app, admin-panel, backend) to Render
2. Document deployment env variables
3. End-to-end testing: signup → deposit → trade → close → withdraw
