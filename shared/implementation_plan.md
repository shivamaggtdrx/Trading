# Implementation Plan: Complete Animation Removal & AppLayout Re-render Isolation

To resolve all layout jitter, double repaints, and slide/fade animations on tab navigation, we will completely remove `framer-motion` imports and usage from `AppLayout.jsx`. We will also isolate Zustand state subscriptions into lightweight sub-components so that the main layout wrapper and child pages never suffer re-render loops.

---

## Proposed Changes

### Layout Components

#### [MODIFY] [AppLayout.jsx](file:///c:/Users/HP/Desktop/Trading%20Company%20Project/apps/trader-app/src/components/layout/AppLayout.jsx)
- **Remove** `framer-motion` imports (`motion`, `AnimatePresence`).
- **Create Sub-components**:
  - `MarginCallBanner`: Subscribes to `marginCallWarning` from `useTradeStore`. Renders the margin warning banner with a static, non-pinging indicator.
  - `DesktopConnectionIndicator`: Subscribes to `socketConnected` from `useTradeStore`. Renders the Live/Offline status badge with a static indicator.
  - `UserProfileDropdown`: Subscribes to `user` and `logout` from `useTradeStore` to handle profile dropdown menu rendering.
  - `ToastNotificationContainer`: Subscribes to `toasts` and `removeToast` from `useTradeStore`. Renders active toasts instantly (or with lightweight Tailwind CSS transitions) without `framer-motion`.
  - `ScrollToTop`: Listen to `location.pathname` and reset scroll height on route swap.
- **Refactor main `AppLayout`**:
  - Remove all direct Zustand selectors and `location` triggers.
  - Render the new isolated sub-components statically.
  - Ensure the parent container does not re-render when global state updates (e.g. real-time prices or warnings).

#### [MODIFY] [Header.jsx](file:///c:/Users/HP/Desktop/Trading%20Company%20Project/apps/trader-app/src/components/layout/Header.jsx)
- **Remove** `animate-ping` from the connection indicator dot next to the dark mode toggle to prevent GPU compositing and rendering loops on mobile devices.

---

## Verification Plan

### Automated Tests
- Run `npm run build` inside `apps/trader-app` to verify compilation safety.

### Manual Verification
- Test BottomNav tab transitions on mobile view to confirm tab pages open instantly with zero transitions, flashes, or double-render lag.
