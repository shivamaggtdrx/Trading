# Phase 2: Remove Mocked Systems

## 1. Trader App
- [x] **Notifications**: Replace local Zustand store logic with real backend endpoint and Socket.IO real-time consumption for broadcast notifications.
- [x] **Referral**: Remove hardcoded `mockReferrals` array and wire it to the real API.
- [x] **Security**: Connect session management and password change functionality to the backend.
- [x] **Reports**: Wire UI stub to actual backend data source.

## 2. Admin Panel
- [x] **Banners**: Replace `useState` local arrays with `/admin/crm/banners` API calls (GET/POST/PUT/DELETE).
- [x] **ClientRestrictions**: Replace dummy state and console.log with `/admin/crm/client-restrictions` API calls.
- [x] **NotificationCenter**: Wire up to backend endpoints to send real broadcast notifications.
- [x] **FeatureFlags**: Connect UI to `/admin/crm/feature-flags` API.
- [x] **AdminUsers**: Wire up to real `admin_users` table API for managing admin access.
- [x] **SessionManager**: Replace mock session data with real active session tracking API.
