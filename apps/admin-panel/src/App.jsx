import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import AdminLogin from './pages/AdminLogin';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import UserDetail from './pages/UserDetail';
import Wallets from './pages/Wallets';
import Trades from './pages/Trades';
import Orders from './pages/Orders';
import Instruments from './pages/Instruments';
import Referrals from './pages/Referrals';
import Settings from './pages/Settings';
import Logs from './pages/Logs';
import Surveillance from './pages/Surveillance';
import Leads from './pages/Leads';
import Network from './pages/Network';
import Reports from './pages/Reports';
import Broadcast from './pages/Broadcast';
import DealingDesk from './pages/DealingDesk';
import CorporateActions from './pages/CorporateActions';
import APIKeys from './pages/APIKeys';
import RiskManagement from './pages/RiskManagement';
import KYCManagement from './pages/KYCManagement';
import WithdrawalApprovals from './pages/WithdrawalApprovals';
import MarketControl from './pages/MarketControl';
import DepositApprovals from './pages/DepositApprovals';
import BrokerageCalculator from './pages/BrokerageCalculator';
import MarginCalls from './pages/MarginCalls';
import ClientRestrictions from './pages/ClientRestrictions';
import Templates from './pages/Templates';
import SupportTickets from './pages/SupportTickets';
import Banners from './pages/Banners';
import FeeConfig from './pages/FeeConfig';
import BulkActions from './pages/BulkActions';
import SystemHealth from './pages/SystemHealth';
import PnLStatement from './pages/PnLStatement';
import Ledger from './pages/Ledger';
import SquareOffPanel from './pages/SquareOffPanel';
import EODSettlement from './pages/EODSettlement';
import IPWhitelist from './pages/IPWhitelist';
import TraderAnalytics from './pages/TraderAnalytics';
import ExposureHeatmap from './pages/ExposureHeatmap';
import ClientFeedback from './pages/ClientFeedback';
import NotificationCenter from './pages/NotificationCenter';
import CronManager from './pages/CronManager';
import DataExportCenter from './pages/DataExportCenter';
import FeatureFlags from './pages/FeatureFlags';
import TournamentManager from './pages/TournamentManager';
import AdminUsers from './pages/AdminUsers';
import AdminAuditTrail from './pages/AdminAuditTrail';
import SessionManager from './pages/SessionManager';
import ChurnPrediction from './pages/ChurnPrediction';
import LiveMarket from './pages/LiveMarket';
import ProfitAttribution from './pages/ProfitAttribution';
import CampaignManager from './pages/CampaignManager';
import DocumentVault from './pages/DocumentVault';
import ProfitCeiling from './pages/ProfitCeiling';
import HouseBook from './pages/HouseBook';
import SmartSpread from './pages/SmartSpread';
import ClientTiers from './pages/ClientTiers';
import RevenueLeakage from './pages/RevenueLeakage';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function LoginRoute() {
  const { user } = useAuth();
  if (user) return <Navigate to="/dashboard" replace />;
  return <AdminLogin />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public login route */}
          <Route path="/login" element={<LoginRoute />} />

          {/* Protected admin routes */}
          <Route path="/" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="dealing-desk" element={<DealingDesk />} />
            <Route path="surveillance" element={<Surveillance />} />
            <Route path="leads" element={<Leads />} />
            <Route path="network" element={<Network />} />
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetail />} />
            <Route path="wallets" element={<Wallets />} />
            <Route path="trades" element={<Trades />} />
            <Route path="orders" element={<Orders />} />
            <Route path="instruments" element={<Instruments />} />
            <Route path="corporate-actions" element={<CorporateActions />} />
            <Route path="referrals" element={<Referrals />} />
            <Route path="reports" element={<Reports />} />
            <Route path="broadcast" element={<Broadcast />} />
            <Route path="api-keys" element={<APIKeys />} />
            <Route path="settings" element={<Settings />} />
            <Route path="logs" element={<Logs />} />
            <Route path="risk" element={<RiskManagement />} />
            <Route path="margin-calls" element={<MarginCalls />} />
            <Route path="client-restrictions" element={<ClientRestrictions />} />
            <Route path="kyc" element={<KYCManagement />} />
            <Route path="withdrawals" element={<WithdrawalApprovals />} />
            <Route path="deposits" element={<DepositApprovals />} />
            <Route path="brokerage-calculator" element={<BrokerageCalculator />} />
            <Route path="market-control" element={<MarketControl />} />
            <Route path="templates" element={<Templates />} />
            <Route path="tickets" element={<SupportTickets />} />
            <Route path="banners" element={<Banners />} />
            <Route path="fee-config" element={<FeeConfig />} />
            <Route path="bulk-actions" element={<BulkActions />} />
            <Route path="health" element={<SystemHealth />} />
            <Route path="pnl-statement" element={<PnLStatement />} />
            <Route path="ledger" element={<Ledger />} />
            <Route path="square-off" element={<SquareOffPanel />} />
            <Route path="eod-settlement" element={<EODSettlement />} />
            <Route path="ip-whitelist" element={<IPWhitelist />} />
            <Route path="trader-analytics" element={<TraderAnalytics />} />
            <Route path="exposure-heatmap" element={<ExposureHeatmap />} />
            <Route path="client-feedback" element={<ClientFeedback />} />
            <Route path="notification-center" element={<NotificationCenter />} />
            <Route path="cron-manager" element={<CronManager />} />
            <Route path="data-export" element={<DataExportCenter />} />
            <Route path="feature-flags" element={<FeatureFlags />} />
            <Route path="tournaments" element={<TournamentManager />} />
            <Route path="admin-users" element={<AdminUsers />} />
            <Route path="admin-audit" element={<AdminAuditTrail />} />
            <Route path="sessions" element={<SessionManager />} />
            <Route path="churn-prediction" element={<ChurnPrediction />} />
            <Route path="live-market" element={<LiveMarket />} />
            <Route path="profit-attribution" element={<ProfitAttribution />} />
            <Route path="campaign-manager" element={<CampaignManager />} />
            <Route path="document-vault" element={<DocumentVault />} />
            <Route path="profit-ceiling" element={<ProfitCeiling />} />
            <Route path="house-book" element={<HouseBook />} />
            <Route path="smart-spread" element={<SmartSpread />} />
            <Route path="client-tiers" element={<ClientTiers />} />
            <Route path="revenue-leakage" element={<RevenueLeakage />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
