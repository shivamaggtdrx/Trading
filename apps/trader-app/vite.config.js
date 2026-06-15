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
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'],
      manifest: false, // We manage our own public/manifest.json
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
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
