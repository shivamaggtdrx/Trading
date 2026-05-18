# Stocks Lab - Master Execution Plan

## PHASE 1 — PRODUCTION STABILITY & SECURITY
*   [ ] Configure all production Render environment variables correctly (`REDIS_URL`, `ANGEL_ONE_*`, `SENTRY_DSN`, `FRONTEND_URL`, `ADMIN_URL`, `JWT_SECRET`)
*   [ ] Fix Socket.IO `/user` namespace security (Add JWT auth middleware, Prevent users from joining other users’ private rooms, Validate room ownership)
*   [ ] Fix frontend/backend/Socket.IO CORS mismatch (Ensure all production domains match correctly)
*   [ ] Verify complete realtime flow (Angel One → Backend → Socket.IO → Frontend)
*   [ ] Fix BullMQ margin inconsistency issue (Ensure failed `block_margin` operations retry properly, Prevent positions existing without blocked margin)
*   [ ] Generate updated audit report and remaining blocker list

## PHASE 2 — REMOVE MOCKED SYSTEMS
*   [x] Trader app: Notifications
*   [x] Trader app: Referral
*   [x] Trader app: Security
*   [x] Trader app: Reports
*   [x] Admin panel: Banners
*   [x] Admin panel: ClientRestrictions
*   [x] Admin panel: NotificationCenter
*   [x] Admin panel: FeatureFlags
*   [x] Admin panel: AdminUsers
*   [x] Admin panel: SessionManager

## PHASE 3 — TRADING ENGINE COMPLETION
*   [x] Build proper limit order matching engine
*   [x] Improve SL/TP persistence and crash recovery
*   [x] Improve Redis exposure tracking reliability
*   [x] Add proper fee/brokerage calculation engine
*   [x] Verify order lifecycle consistency
*   [x] Improve execution reliability under load

## PHASE 4 — OPERATIONS & MONITORING ✅
*   [x] Build realtime system monitoring dashboard (CPU, Memory, DB latency, Redis hit rate, WSS connections, queue counts)
*   [x] Add queue/job monitoring with retry-failed-job UI (Queue Monitor tab in Logs)
*   [x] Add WebSocket monitoring (live connection count via io.engine.clientsCount)
*   [x] Add Redis monitoring (hit/miss ratio + exposure heatmap from `exp:symbol:*` keys)
*   [x] Improve admin audit logging (all sensitive admin actions logged with IP)
*   [x] Improve risk controls (Global Kill Switch + per-symbol disable/enable UI)
*   [x] Improve notification/broadcast system (admin composes → WebSocket → SystemBanner in trader app)

## PHASE 5 — PWA & MOBILE EXPERIENCE ✅
*   [x] Rewrote `manifest.json` — Stocks Lab branding, app shortcuts, maskable icon
*   [x] Installed `vite-plugin-pwa` + Workbox — build generates `sw.js` with 13 precache entries
*   [x] Added full iOS PWA meta tags (apple-touch-icon, black-translucent status bar, splash screens, OG tags)
*   [x] Created `OfflineBanner.jsx` — real-time offline/online detection with coloured stripe
*   [x] Created `PWAInstallPrompt.jsx` — Android one-click install + iOS manual instructions bottom sheet
*   [x] Created `PWAUpdatePrompt.jsx` — notifies users when a new app version is ready
*   [x] Fixed `BottomNav.jsx` safe-area-inset-bottom with `max()` for iPhone notch/home bar
*   [x] Added `animate-slide-up` / `animate-fade-in` CSS aliases + dark-mode shimmer
*   [x] Created `usePullToRefresh` hook + `PullIndicator` component
*   [x] Wired pull-to-refresh into Positions page

## PHASE 6 — PERFORMANCE & SCALING
*   [ ] Optimize Redis usage
*   [ ] Reduce unnecessary realtime writes
*   [ ] Fix N+1 DB queries
*   [ ] Optimize BullMQ retry/dead-letter handling
*   [ ] Improve horizontal scalability readiness
*   [ ] Improve memory efficiency
*   [ ] Improve feed resilience

## PHASE 7 — BUSINESS FEATURES
*   [ ] Referral engine
*   [ ] Tournaments
*   [ ] CRM automation
*   [ ] Campaign systems
*   [ ] Client tiers
*   [ ] Leaderboards
*   [ ] Affiliate systems
