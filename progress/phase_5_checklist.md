# Phase 5: PWA & Mobile Experience

## 1. PWA Core (manifest + icons + installability)
- [x] Rewrite `manifest.json` with correct Stocks Lab branding, colors, shortcuts, and screenshots
- [x] Generate icon at 512x512 (real AI-generated PNG), copy to `icon-192.png` and `icon-maskable-512.png`
- [x] Add Apple Touch Icon, `apple-mobile-web-app-title`, `apple-mobile-web-app-status-bar-style`, iOS splash-screen meta tags to `index.html`
- [x] Install `vite-plugin-pwa` + `workbox-window` and configure in `vite.config.js`
- [x] Build verified — `dist/sw.js` + `dist/workbox-*.js` generated with 13 precache entries

## 2. Service Worker & Offline Shell Caching
- [x] Configured `vite-plugin-pwa` with Workbox `generateSW` strategy (auto-update mode)
- [x] Pre-caches all JS/CSS/HTML/SVG/PNG/woff2 assets (app shell)
- [x] Runtime cache: Google Fonts → CacheFirst (1-year TTL), API → NetworkFirst (5s timeout, 1h TTL)
- [x] Created `OfflineBanner.jsx` — shows red stripe when offline, green "Connection restored" when back
- [x] Created `PWAUpdatePrompt.jsx` — uses `useRegisterSW` hook to notify users of new app version
- [x] SW `skipWaiting: true` + `clientsClaim: true` — immediate activation on deploy

## 3. Install Prompt
- [x] Created `PWAInstallPrompt.jsx` bottom-sheet — captures `beforeinstallprompt` on Android for one-click install
- [x] iOS detection shows manual Share → "Add to Home Screen" instructions
- [x] 7-day dismiss cooldown stored in `localStorage`
- [x] Wired OfflineBanner, PWAInstallPrompt, PWAUpdatePrompt into `App.jsx` root

## 4. Mobile Responsiveness & UX
- [x] Fixed `BottomNav.jsx` — apply `.bottom-nav` CSS class for proper `env(safe-area-inset-bottom)` on iPhone
- [x] Updated `bottom-nav` CSS to use `max()` ensuring minimum 6px on non-notched devices
- [x] Added `animate-slide-up` and `animate-fade-in` Tailwind-compatible CSS aliases
- [x] Added dark-mode shimmer variant for skeleton loaders
- [x] Updated BottomNav active indicator to brand orange (#f06428) for visual consistency
- [x] Confirmed existing `Skeleton.jsx` (MarketItemSkeleton, PositionCardSkeleton, WalletCardSkeleton) already in place
- [ ] Add pull-to-refresh on Positions, Orders, Markets pages
- [ ] Add page transition slide-in animations between routes
