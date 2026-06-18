import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTradeStore } from './store/useTradeStore';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login/Login';
import OfflineBanner from './components/pwa/OfflineBanner';
import PWAInstallPrompt from './components/pwa/PWAInstallPrompt';
import PWAUpdatePrompt from './components/pwa/PWAUpdatePrompt';
import { useEffect } from 'react';

import Notifications from './pages/Notifications/Notifications';
import Referral from './pages/Referral/Referral';
import Reports from './pages/Reports/Reports';
import Security from './pages/Security/Security';
import Help from './pages/Help/Help';
import Preferences from './pages/Preferences/Preferences';
import History from './pages/History/History';
import Trade from './pages/Trade/Trade';
import KYCSubmit from './pages/KYC/KYCSubmit';
import BankAccounts from './pages/BankAccounts/BankAccounts';


function ProtectedRoute({ children }) {
  const isAuthenticated = useTradeStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AppInitializer({ children }) {
  const isAuthenticated = useTradeStore((s) => s.isAuthenticated);
  const loadInitialData = useTradeStore((s) => s.loadInitialData);

  useEffect(() => {
    if (isAuthenticated) {
      loadInitialData();
    }
  }, [isAuthenticated]);

  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <OfflineBanner />
      <PWAInstallPrompt />
      <PWAUpdatePrompt />
      <AppInitializer>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* All protected routes inside AppLayout */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            {/* Main Tabs (Rendered by IndexedStack in AppLayout, so Outlet gets empty fragment) */}
            <Route path="/" element={<></>} />
            <Route path="/markets" element={<></>} />
            <Route path="/dashboard" element={<></>} />
            <Route path="/positions" element={<></>} />
            <Route path="/charts" element={<></>} />
            <Route path="/orders" element={<></>} />
            <Route path="/profile" element={<></>} />
            <Route path="/wallet" element={<></>} />

            {/* Sub-pages (Rendered normally via Outlet) */}
            <Route path="/trade" element={<Trade />} />
            <Route path="/kyc/submit" element={<KYCSubmit />} />
            <Route path="/history" element={<History />} />
            <Route path="/bank-accounts" element={<BankAccounts />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/security" element={<Security />} />
            <Route path="/help" element={<Help />} />
            <Route path="/preferences" element={<Preferences />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInitializer>
    </BrowserRouter>
  );
}
