import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: false, // We manage our own public/manifest.json
      workbox: {
        // ── Pre-cache: App Shell (JS/CSS bundles + HTML) ──
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        
        // ── Runtime caching ──
        runtimeCaching: [
          // Google Fonts — Cache First (they rarely change)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // API calls — Network First with stale fallback (1 hour TTL)
          // Excludes real-time WebSocket paths; only REST endpoints
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // Skip Waiting — new SW activates immediately
        skipWaiting: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: true, // Enable SW in dev for testing
        type: 'module',
      },
    }),
  ],
  build: {
    // ── Code Splitting: Break up the monolithic bundle ──
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // Core React ecosystem — cached aggressively
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor-react';
            // Charting library — only needed on Charts page
            if (id.includes('lightweight-charts')) return 'vendor-charts';
            // Animation library — only Login page uses it
            if (id.includes('framer-motion')) return 'vendor-animations';
            // Socket.IO — core realtime layer
            if (id.includes('socket.io')) return 'vendor-socket';
            // Icons — used everywhere but can be separated
            if (id.includes('lucide-react')) return 'vendor-icons';
            // Everything else in node_modules
            return 'vendor-misc';
          }
        }
      }
    },
    // Suppress the chunk size warning for vendor chunks
    chunkSizeWarningLimit: 300,
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Use terser for slightly better minification
    target: 'es2020',
    // Inline small assets as base64
    assetsInlineLimit: 4096,
  },
  server: {
    port: 3000,
    host: true,
  },
})
