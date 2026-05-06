# Trading Platform - Admin Panel

This module contains the high-performance, professional-grade administrative terminal for managing the trading platform. It is designed to handle Indian-market trading operations (NSE, BSE, MCX, F&O) with B-Book and master-node settlement networking capabilities.

## 🛠️ Technology Stack

The admin panel is built using a modern, fast, and scalable frontend stack:

- **Core Framework**: React 19
- **Build Tool / Dev Server**: Vite
- **Routing**: React Router v7 (`react-router-dom`)
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Icons**: Lucide React (`lucide-react`)
- **Data Visualization**: Recharts v3 (`recharts`)
- **Utility Libraries**: `clsx`, `tailwind-merge`
- **Architecture**: Modular Monorepo Application

---

## 🚀 Implemented Features & Modules

The admin panel is divided into specialized modules designed for B-Book brokerage operations, risk management, and day-to-day administration.

### 1. Dashboard & Analytics (`Dashboard.jsx`)
- High-level platform analytics and metrics.
- Real-time PNL overview, active user counts, and margin utilization.
- System status and fast navigation to critical areas.

### 2. Client Management (`Users.jsx`, `UserDetail.jsx`)
- **User Grid**: Data-dense list view with advanced filtering (status, balance, activity).
- **Profile Overview**: Quick actions for Manual Deposits, Manual Withdrawals, KYC Updates, and an Activity Log.
- **Positions & Margins**: Live view of open positions, unrealized PNL, forced square-off capabilities, and Credit Line (M2M Limit) adjustments.
- **Risk Settings**: Per-user risk rules including Max Position Limits, Auto-Square Off thresholds, and Trading Access toggles.
- **Brokerage Rules**: Custom revenue settings, granular brokerage configuration per segment (NSE, Options, MCX), and B-Book edge settings (custom execution slippage/delay).
- **Security Operations**: Send password reset links, generate temporary passwords, emergency 2FA disable, session revocation, and account blocking.

### 3. Dealing Desk & Execution (`DealingDesk.jsx`)
- Live monitoring of trades and market movements.
- Fast order execution on behalf of clients.
- B-book hedging, manual interventions, and netting interface.

### 4. Surveillance & Risk (`Surveillance.jsx`)
- Global risk monitoring and exposure tracking.
- Automated risk alerts and warnings for high-exposure clients.
- Platform-wide kill switches to halt trading.

### 5. Network & Settlements (`Network.jsx`)
- Master-Node hierarchy management (Sub-brokers, Master-A, Master-B).
- Settlement tracking, node networking, and revenue sharing rules.

### 6. Market & Instruments (`Instruments.jsx`)
- Management of tradable assets across NSE, MCX, and F&O.
- Configuration of tick sizes, lot sizes, margins, and active trading sessions.
- Instrument-level toggles (enable/disable trading for specific scrips).

### 7. Trading Audit (`Orders.jsx`, `Trades.jsx`)
- Complete historical order book and trade execution logs.
- Audit trails for all executions, rejections, and modifications.
- Deep filtering by client, master, segment, and status.

### 8. Financials (`Wallets.jsx`, `Reports.jsx`)
- **Wallets**: Centralized ledger entries, deposit/withdrawal request processing, and balance reconciliation.
- **Reports**: Exportable data grids, settlement reports, brokerage generation statements, and platform PNL statements.

### 9. Growth & CRM (`Leads.jsx`, `Referrals.jsx`)
- **Leads**: Integrated CRM for client onboarding pipeline and sales follow-ups.
- **Referrals**: Affiliate program management, multi-tier referral tracking, and payout calculations.

### 10. System Administration
- **Corporate Actions (`CorporateActions.jsx`)**: System adjustments for dividends, stock splits, and bonus issues.
- **Broadcast (`Broadcast.jsx`)**: Sending system-wide alerts, push notifications, or emails to active users.
- **API Keys (`APIKeys.jsx`)**: Management of webhook integrations, automated feeds, and third-party API access.
- **Logs (`Logs.jsx`)**: Immutable audit logs of all administrative actions and system errors.
- **Settings (`Settings.jsx`)**: Global platform configurations, default margins, and UI themes.
- **IP & Device Whitelisting (`IPWhitelist.jsx`)**: Track client login IPs/devices, set geo-restrictions, flag suspicious logins.

### 11. Newly Added Premium Features
- **P&L Statement (Detailed) (`PnLStatement.jsx`)**: Daily/weekly/monthly P&L breakdown by segment, client, and master node.
- **Ledger / Account Statement (`Ledger.jsx`)**: Full double-entry ledger per client with date-range export.
- **Square-Off Panel (`SquareOffPanel.jsx`)**: Dedicated forced square-off dashboard to batch select positions and execute mass close.
- **EOD / Settlement Processing (`EODSettlement.jsx`)**: End-of-day settlement wizard for M2M, auto-debit, and ledger settlement.
- **Trader Behavior Analytics (`TraderAnalytics.jsx`)**: Identify patterns like frequent losers, scalpers, and over-leveraged accounts.
- **Exposure Heatmap (`ExposureHeatmap.jsx`)**: Visual heatmap showing platform-wide exposure by scrip/segment.
- **Client Feedback / Rating (`ClientFeedback.jsx`)**: Collect and track client satisfaction after support interactions.
- **Notification Center (`NotificationCenter.jsx`)**: Unified inbox of all system alerts, margin calls, and requests.
- **Scheduled Tasks / Cron Manager (`CronManager.jsx`)**: Manage scheduled jobs for reports, risk systems, and EOD processing.
- **Data Export Center (`DataExportCenter.jsx`)**: Centralized export hub for CSV/Excel/JSON data generation.
- **Feature Flags (`FeatureFlags.jsx`)**: Toggle platform features on/off instantly without deploying new code.
- **Tournament Manager (`TournamentManager.jsx`)**: Create trading competitions with leaderboards and prizes.

### 12. Security & Access Control
- **Admin Login (`AdminLogin.jsx`)**: Premium glassmorphism login with email/password auth, department selector dropdown, brute-force lockout (5 attempts → 5min lock), and session expiry.
- **Auth Context (`AuthContext.jsx`)**: Centralized authentication state with login/logout, department validation, failed attempt tracking, lockout timer, and session timeout detection.
- **Admin User Management (`AdminUsers.jsx`)**: Add/remove admin staff, assign roles (Super Admin, Risk Manager, Support, Finance, Compliance), view last login, force password reset.
- **Admin Audit Trail (`AdminAuditTrail.jsx`)**: Immutable compliance-grade log of every admin action — who did what, to which client, from what IP, with severity tagging.
- **Session Manager (`SessionManager.jsx`)**: View all active admin & client sessions, force remote logout, configure idle timeout per role.

### 13. Department-Based Access Control
The login page includes a department selector. Each department sees a filtered sidebar with only relevant pages:

| Department | Color Theme | Pages Visible |
|---|---|---|
| **Admin Panel** | Blue | All 49 pages — full platform access |
| **Finance Department** | Emerald/Green | P&L, Ledger, Wallets, Deposits, Withdrawals, EOD Settlement, Brokerage, Fees, Referrals, Reports, Data Export, Trades, Orders |
| **Customer Service** | Purple | Users, Leads (CRM), Support Tickets, KYC, Client Restrictions, Bulk Actions, Client Feedback, Broadcast, Templates, Banners |

**Demo Credentials:**
- `admin@tradex.com` / `admin123` → Can access all 3 departments
- `finance@tradex.com` / `finance123` → Finance only
- `support@tradex.com` / `support123` → Customer Service only
