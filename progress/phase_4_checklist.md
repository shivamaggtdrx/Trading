# Phase 4: Operations & Monitoring

## 1. System Monitoring Dashboard
- [x] Build a realtime dashboard in the Admin Panel (`SystemHealth.jsx`).
- [x] Aggregate CPU, Memory, DB latency, and application health metrics.
- [x] Expose real active WebSocket connections via `io.engine.clientsCount`.
- [x] Expose BullMQ queue waiting/active/failed counts on the System Health page.
- [x] Expose Redis cache hit/miss ratio from Redis INFO stats.

## 2. Queue & Job Monitoring
- [x] Expose BullMQ queue metrics (active, waiting, completed, failed, delayed jobs).
- [x] Integrate queue metrics into the Logs monitoring UI (Queue Monitor tab).
- [x] Add ability to retry failed jobs from the admin UI (per-row Retry button).

## 3. WebSocket Monitoring
- [x] Track active Socket.IO connections globally (`/admin/system-health`).
- [x] Monitor room subscriptions and message throughput.
- [x] Expose WebSocket latency metrics.

## 4. Redis Monitoring
- [x] Track Redis memory usage and hit/miss ratios.
- [x] Monitor pub/sub channel health.
- [x] Build an exposure tracking table to view realtime net exposure across all symbols (`/admin/exposure-heatmap` + `ExposureHeatmap.jsx`).

## 5. Audit Logging & Security
- [x] Implement central `audit_logs` table via Supabase (defined in `003_finance_operations.sql`).
- [x] Ensure sensitive actions (kill switch, symbol disable, job retry, broadcast) are logged with admin ID, IP, and description.

## 6. Risk Controls & Alerts
- [x] Wire up the Global Kill Switch (halts all trading instantly via `POST /admin/risk-management/kill-switch`).
- [x] Build UI to disable/enable specific symbols manually (Symbol Risk & Controls table in `RiskManagement.jsx`).
- [x] Kill Switch button on RiskManagement page toggles and shows real status from Redis.
- [ ] Configure automatic Discord/Slack/Telegram alerts for massive liquidations or errors.

## 7. Notification & Broadcast System
- [x] Build global broadcast feature (admin composes and sends via `Broadcast.jsx` → `POST /admin/notifications` → WebSocket `SYSTEM:BROADCAST`).
- [x] Realtime delivery via Socket.IO to all connected trader app users.
- [x] `SystemBanner.jsx` renders the broadcast as a coloured top-stripe (blue=info, amber=warning, red=system).
- [x] Info banners auto-dismiss after 15 seconds; critical notices are persistent.
- [ ] Implement targeted notifications (per-user margin call warnings via the `user:{id}` room — partially built, needs dedicated margin-call trigger).
