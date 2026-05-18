# Phase 1: Production Stability & Security

## 1. Environment Variables Configuration
- [x] Ensure `render.yaml` has the correct `REDIS_URL`.
- [x] Add `ANGEL_ONE_API_KEY`, `ANGEL_ONE_API_SECRET`, `ANGEL_ONE_CLIENT_CODE`, `ANGEL_ONE_PASSWORD`, `ANGEL_ONE_TOTP_SECRET` to `render.yaml` or note them to be added in Render UI.
- [x] Add `SENTRY_DSN` to `render.yaml`.
- [x] Update `FRONTEND_URL` and `ADMIN_URL` if needed, and make sure `JWT_SECRET` is secured.

## 2. Socket.IO Security
- [x] Add JWT auth middleware to `/user` namespace in `backend/src/ws/socketServer.js`.
- [x] Prevent users from joining other users' private rooms (validate room ownership using the JWT user id).
- [x] Check frontend/backend/Socket.IO CORS mismatch to ensure the correct domains are allowed.

## 3. BullMQ Margin Consistency Issue
- [x] In `backend/src/core/workers/executionWorker.js`, ensure failed `block_margin` operations throw an error so BullMQ can retry them.
- [x] Ensure positions don't exist without blocked margin if the margin block RPC fails.

## 4. Verification
- [x] Verify realtime flow (Angel One -> Backend -> Socket.IO -> Frontend).
- [x] Verify live prices, charts, PnL, positions/orders.
- [x] Verify Redis health, BullMQ workers, Supabase auth, Render deployment.

## 5. Reporting
- [x] Generate updated audit report and blocker list after completing the above.
