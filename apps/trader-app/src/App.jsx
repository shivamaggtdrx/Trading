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

          {/* Protected — with bottom nav */}
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path="/" element={<Home />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/charts" element={<Charts />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/history" element={<History />} />
          </Route>

          {/* Protected — sub-pages without bottom nav */}
          <Route path="/wallet" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
          <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
          <Route path="/security" element={<ProtectedRoute><Security /></ProtectedRoute>} />
          <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
          <Route path="/preferences" element={<ProtectedRoute><Preferences /></ProtectedRoute>} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppInitializer>
    </BrowserRouter>
  );
}
