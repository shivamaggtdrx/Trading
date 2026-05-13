import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useTradeStore } from './store/useTradeStore';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login/Login';
import Home from './pages/Home/Home';
import Positions from './pages/Positions/Positions';
import Charts from './pages/Charts/Charts';
import Orders from './pages/Orders/Orders';
import Profile from './pages/Profile/Profile';
import Wallet from './pages/Wallet/Wallet';
import Notifications from './pages/Notifications/Notifications';
import Referral from './pages/Referral/Referral';
import Reports from './pages/Reports/Reports';
import Security from './pages/Security/Security';
import Help from './pages/Help/Help';
import Preferences from './pages/Preferences/Preferences';
import History from './pages/History/History';
import Markets from './pages/Markets/Markets';
import { useEffect } from 'react';

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
      <AppInitializer>
        <Routes>
          {/* Public */}
          <Route path="/login" element={<Login />} />

          {/* All protected routes inside AppLayout — desktop gets sidebar + nav on every page */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Markets />} />
            <Route path="/dashboard" element={<Home />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<History />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/referral" element={<Referral />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/security" element={<Security />} />
            <Route path="/help" element={<Help />} />
            <Route path="/preferences" element={<Preferences />} />
            <Route path="/markets" element={<Markets />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInitializer>
    </BrowserRouter>
  );
}
