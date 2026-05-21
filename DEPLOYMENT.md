# StocksLab — Deployment Guide

> **Stack**: Koyeb (Backend) + Cloudflare Pages (Frontends) + Supabase (DB) + Aiven (Redis)
> 
> **Total Cost: $0/month**

---

## Table of Contents

1. [Backend — Koyeb Setup](#1-backend--koyeb-setup)
2. [Keep-Alive — UptimeRobot](#2-keep-alive--uptimerobot)
3. [Frontends — Cloudflare Pages](#3-frontends--cloudflare-pages)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Custom Domains](#5-custom-domains)
6. [Post-Deployment Verification](#6-post-deployment-verification)

---

## 1. Backend — Koyeb Setup

### Step 1: Create Koyeb Account

1. Go to [app.koyeb.com](https://app.koyeb.com) and sign up (GitHub login, **no credit card**)
2. You get **1 free web service** with 512 MB RAM, 0.1 vCPU

### Step 2: Connect GitHub Repository

1. In Koyeb dashboard, click **Create Web Service**
2. Select **GitHub** as the deployment method
3. Connect your GitHub account and select your repository

### Step 3: Configure the Service

| Setting | Value |
|---|---|
| **Name** | `stockslab-backend` |
| **Region** | `Frankfurt (FRA)` ← closest free region to India |
| **Instance type** | Free |
| **Build** | Dockerfile |
| **Dockerfile path** | `backend/Dockerfile` |
| **Root directory** | `backend` |
| **Port** | `4000` |
| **Health check path** | `/health` |

### Step 4: Add Environment Variables

In the Koyeb service settings, add these environment variables:

```
NODE_ENV = production
PORT = 4000
SUPABASE_URL = https://nrwyqkannylqwqxigozn.supabase.co
SUPABASE_ANON_KEY = your_anon_key
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key
JWT_SECRET = <generate-a-strong-random-string>
JWT_EXPIRES_IN = 24h
FRONTEND_URL = https://your-trader-app.pages.dev
ADMIN_URL = https://your-admin-panel.pages.dev
LANDING_URL = https://your-landing.pages.dev
REDIS_URL = rediss://default:AVNS_xxxxx@valkey-xxxxx.aivencloud.com:15432
FINNHUB_API_KEY = your_finnhub_key
SENTRY_DSN = your_sentry_dsn
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX = 500
```

> **Note**: Replace the URLs with your actual Cloudflare Pages URLs (or custom domain URLs once configured).

### Step 5: Deploy

Click **Deploy** — Koyeb will build from your Dockerfile and deploy automatically.

Your backend URL will be: `https://stockslab-backend-<your-org>.koyeb.app`

### Step 6: Enable Auto-Deploy

By default, Koyeb auto-deploys when you push to your main branch. To verify:
1. Go to Service Settings → Source
2. Ensure "Autodeploy" is enabled
3. Select the branch to watch (e.g., `main`)

---

## 2. Keep-Alive — UptimeRobot

> **Why**: Koyeb free tier sleeps after 1 hour of no traffic. UptimeRobot pings your server every 5 minutes to keep it awake.

### Setup (2 minutes)

1. Go to [uptimerobot.com](https://uptimerobot.com) and create a free account
2. Click **Add New Monitor**
3. Configure:
   - **Monitor Type**: HTTP(s)
   - **Friendly Name**: `StocksLab Backend`
   - **URL**: `https://stockslab-backend-<your-org>.koyeb.app/health`
   - **Monitoring Interval**: `5 minutes`
4. Click **Create Monitor**

That's it — your backend will stay awake 24/7.

> **Bonus**: UptimeRobot also sends you email alerts if your backend goes down!

---

## 3. Frontends — Cloudflare Pages

### Step 1: Create Cloudflare Account

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up (free, no credit card)
2. Go to **Workers & Pages** in the sidebar

### Step 2: Deploy Each Frontend

Repeat for **trader-app**, **admin-panel**, and **landing**:

1. Click **Create → Pages → Connect to Git**
2. Select your GitHub repository
3. Configure build settings:

| Setting | trader-app | admin-panel | landing |
|---|---|---|---|
| **Project name** | `stockslab-app` | `stockslab-admin` | `stockslab-landing` |
| **Root directory** | `apps/trader-app` | `apps/admin-panel` | `apps/landing` |
| **Build command** | `npm install && npm run build` | `npm install && npm run build` | `npm install && npm run build` |
| **Build output** | `dist` | `dist` | `dist` |

4. **Add Environment Variables**:

| Variable | trader-app | admin-panel | landing |
|---|---|---|---|
| `VITE_API_URL` | `https://stockslab-backend-<org>.koyeb.app/api` | `https://stockslab-backend-<org>.koyeb.app/api` | `https://stockslab-backend-<org>.koyeb.app/api` |
| `VITE_WS_URL` | `wss://stockslab-backend-<org>.koyeb.app/ws/prices` | *(not needed)* | *(not needed)* |
| `NODE_VERSION` | `20` | `20` | `20` |

5. Click **Save and Deploy**

> The `_redirects` file in each `public/` folder handles SPA routing automatically.

---

## 4. Environment Variables Reference

### Backend (Koyeb)

| Variable | Description | Example |
|---|---|---|
| `PORT` | Server port | `4000` |
| `NODE_ENV` | Environment | `production` |
| `FRONTEND_URL` | Trader app URL (CORS) | `https://app.yourdomain.com` |
| `ADMIN_URL` | Admin panel URL (CORS) | `https://admin.yourdomain.com` |
| `LANDING_URL` | Landing page URL (CORS) | `https://yourdomain.com` |
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | `sb_publishable_xxx` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbGci...` |
| `JWT_SECRET` | Admin JWT token secret | `<random-string>` |
| `REDIS_URL` | Aiven Redis URL | `rediss://default:xxx@xxx.aivencloud.com:15432` |
| `FINNHUB_API_KEY` | Market data API key | `d86lnn...` |
| `SENTRY_DSN` | Error tracking | `https://xxx@sentry.io/xxx` |

### Frontends (Cloudflare Pages)

| Variable | Where | Value |
|---|---|---|
| `VITE_API_URL` | All 3 apps | `https://your-backend.koyeb.app/api` |
| `VITE_WS_URL` | trader-app only | `wss://your-backend.koyeb.app/ws/prices` |
| `NODE_VERSION` | All 3 apps | `20` |

---

## 5. Custom Domains

### Backend (Koyeb)

1. In Koyeb dashboard → your service → **Settings → Domains**
2. Click **Add Custom Domain**
3. Enter: `api.yourdomain.com`
4. Add the CNAME record shown by Koyeb to your DNS:
   ```
   api.yourdomain.com → CNAME → <value-from-koyeb>
   ```
5. SSL is automatic

### Frontends (Cloudflare Pages)

1. In each project → **Custom Domains → Set up a custom domain**
2. Add:
   - `app.yourdomain.com` → stockslab-app
   - `admin.yourdomain.com` → stockslab-admin
   - `yourdomain.com` → stockslab-landing
3. Add CNAME records if domain DNS is not on Cloudflare:
   ```
   app.yourdomain.com   → CNAME → stockslab-app.pages.dev
   admin.yourdomain.com → CNAME → stockslab-admin.pages.dev
   yourdomain.com       → CNAME → stockslab-landing.pages.dev
   ```

### After adding custom domains, update:

1. **Koyeb env vars**: Update `FRONTEND_URL`, `ADMIN_URL`, `LANDING_URL` with your custom domain URLs
2. **Cloudflare Pages env vars**: Update `VITE_API_URL` and `VITE_WS_URL` with `api.yourdomain.com`
3. Redeploy both backend and frontends

---

## 6. Post-Deployment Verification

### Backend
```bash
# Health check
curl https://your-backend.koyeb.app/health
# Expected: {"status":"ok","time":"2026-..."}

# Ready check
curl https://your-backend.koyeb.app/ready
```

### Frontends
1. Open each URL in browser
2. Test deep links (e.g., `/login`, `/dashboard`) — should NOT 404
3. Open DevTools → Network → verify API calls reach Koyeb backend
4. Check WebSocket connection in trader app (Network → WS tab)

### CORS Issues?
If you see CORS errors:
1. Verify `FRONTEND_URL`, `ADMIN_URL`, `LANDING_URL` in Koyeb env vars match **exactly** (including `https://`, no trailing `/`)
2. Redeploy the backend service in Koyeb

---

## Cost Summary

| Service | Monthly Cost |
|---|---|
| Koyeb (Backend) | **$0** (Free tier) |
| UptimeRobot (Keep-alive) | **$0** (Free, 50 monitors) |
| Cloudflare Pages (3 frontends) | **$0** (Free, unlimited BW) |
| Supabase (Database) | **$0** (Free tier) |
| Aiven (Redis/Valkey) | **$0** (Free tier) |
| Let's Encrypt (SSL) | **$0** (auto via Koyeb/Cloudflare) |
| **Total** | **$0/month** |

---

## Quick Deploy Checklist

- [ ] Sign up at [app.koyeb.com](https://app.koyeb.com) (GitHub login)
- [ ] Connect GitHub repo → deploy backend with Dockerfile
- [ ] Add all env variables in Koyeb dashboard
- [ ] Verify `https://your-backend.koyeb.app/health` returns OK
- [ ] Set up UptimeRobot to ping `/health` every 5 min
- [ ] Sign up at [dash.cloudflare.com](https://dash.cloudflare.com)
- [ ] Deploy trader-app, admin-panel, landing on Cloudflare Pages
- [ ] Add `VITE_API_URL` env var pointing to Koyeb backend
- [ ] Test all 3 frontends — API calls, WebSocket, deep links
- [ ] (Optional) Add custom domains on both Koyeb and Cloudflare
