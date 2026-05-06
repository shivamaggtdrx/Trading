# TradeX Backend API

> Express.js + Supabase backend for the TradeX Dabba Trading Platform.  
> Deploys to **Render** (or any Node.js hosting).

## Quick Start

```bash
npm install
copy .env.example .env   # Fill in your Supabase keys
npm run dev               # Start development server
```

## API Endpoints

### Auth (Trader App)
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get profile + wallet |

### Admin Auth
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/admin/auth/login` | Admin login (JWT) |

### Trading
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/instruments` | List all instruments |
| GET | `/api/instruments/:symbol` | Get instrument details |
| POST | `/api/orders` | Place order (market/limit/SL) |
| GET | `/api/orders` | Get user orders |
| DELETE | `/api/orders/:id` | Cancel pending order |
| GET | `/api/positions` | Get open positions |
| POST | `/api/positions/:id/close` | Close position |
| GET | `/api/positions/history` | Trade history |

### Finance
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/wallet` | Get wallet + recent txns |
| GET | `/api/wallet/transactions` | Paginated txn history |
| POST | `/api/deposits` | Submit deposit request |
| GET | `/api/deposits` | Deposit history |
| POST | `/api/withdrawals` | Submit withdrawal request |
| GET | `/api/withdrawals` | Withdrawal history |

### Admin Panel
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/dashboard` | Dashboard stats |
| GET | `/api/admin/users` | List users (paginated) |
| GET | `/api/admin/users/:id` | User detail + positions |
| GET | `/api/admin/deposits` | Pending deposits |
| POST | `/api/admin/deposits/:id/approve` | Approve deposit |
| POST | `/api/admin/deposits/:id/reject` | Reject deposit |
| GET | `/api/admin/withdrawals` | Pending withdrawals |
| POST | `/api/admin/withdrawals/:id/approve` | Approve withdrawal |
| POST | `/api/admin/force-square-off/:userId` | Force close all positions |
| GET | `/api/admin/settings` | System settings |
| PUT | `/api/admin/settings/:key` | Update setting |

### WebSocket
| Path | Description |
|------|-------------|
| `ws://localhost:4000/ws/prices` | Live price feed (2s tick) |

## Environment Variables

See `.env.example` for all required variables.

## Database

Run migrations in `supabase/migrations/` (001 → 004) via Supabase SQL Editor.
