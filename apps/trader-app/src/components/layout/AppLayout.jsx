import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Layers, CandlestickChart, ClipboardList, User, LogOut,
  Moon, Sun, Wallet, FileText, Headphones, Settings, WifiOff,
} from 'lucide-react';
import { useState, useEffect, useLayoutEffect, useRef } from 'react';
import BottomNav from './BottomNav';
import WatchlistSidebar from './WatchlistSidebar';
import MarketTickerBar from './MarketTickerBar';
import AcknowledgmentModal from '../ui/AcknowledgmentModal';
import SystemBanner from './SystemBanner';
import MarginCallBanner from './MarginCallBanner';
import ConnectionStatus from './ConnectionStatus';
import LiveToasts from './LiveToasts';
import { useTradeStore } from '../../store/useTradeStore';
import { api } from '../../services/api';
import { cn } from '../../utils/helpers';

const desktopNavItems = [
  { path: '/dashboard', icon: Home, label: 'Dashboard' },
  { path: '/orders', icon: ClipboardList, label: 'Orders' },
  { path: '/positions', icon: Layers, label: 'Portfolio' },
  { path: '/charts', icon: CandlestickChart, label: 'Charts' },
  { path: '/wallet', icon: Wallet, label: 'Funds' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/help', icon: Headphones, label: 'Support' },
];

export default function AppLayout() {
  const user = useTradeStore((s) => s.user);
  const logout = useTradeStore((s) => s.logout);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [isDark, setIsDark] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isWatchlistExpanded, setIsWatchlistExpanded] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const mainScrollRef = useRef(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Reset scroll position to top on every route change (prevents jitter from scroll carry-over)
  useLayoutEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [location.pathname]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    } else if (savedTheme === 'light') {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      setIsDark(document.documentElement.classList.contains('dark'));
    }
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <MarginCallBanner />
      {/* ═══ DESKTOP: Market Ticker Bar + Top Navbar ═══ */}
      <div className="hidden lg:block sticky top-0 z-50 bg-surface shadow-sm border-b border-border/60">
        <div className="flex items-center h-14 w-full">
          {/* Left Side: Logo or Ticker space */}
          <div className="w-[320px] shrink-0 border-r border-border/40 flex items-center px-4">
             {/* We can place the ticker here or just a logo */}
             <div className="text-xl font-bold tracking-tighter text-primary">STOCKS LAB</div>
          </div>

          {/* Right Side: Navigation */}
          <header className="flex-1 flex items-center justify-between px-6 h-full">
            {/* Nav Items */}
            <nav className="flex items-center gap-6">
              {desktopNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) => cn(
                    'text-[14px] font-medium transition-colors hover:text-[#f06428]',
                    isActive ? 'text-[#f06428]' : 'text-text-secondary'
                  )}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            {/* Right Side — User Controls */}
            <div className="flex items-center gap-4">
              {/* Connection Indicator */}
              <ConnectionStatus />

              {/* Theme Toggle */}
              <button
                onClick={toggleDarkMode}
                className="text-text-secondary hover:text-[#f06428] transition-colors"
                title="Toggle Theme"
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              {/* User Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 text-[13px] font-medium text-text-secondary hover:text-[#f06428] transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span>{user?.clientId || 'GZ5936'}</span>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border/60 rounded shadow-xl z-50 py-1 overflow-hidden">
                      <div className="px-4 py-3 border-b border-border/40">
                        <p className="text-sm font-semibold text-text-primary">{user?.name || 'Trader'}</p>
                        <p className="text-xs text-text-muted mt-0.5">{user?.email || 'trader@example.com'}</p>
                      </div>

                      <button
                        onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-[#f06428] transition-colors"
                      >
                        <User size={16} strokeWidth={1.5} /> My Profile
                      </button>
                      <button
                        onClick={() => { navigate('/preferences'); setShowProfileMenu(false); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-[#f06428] transition-colors"
                      >
                        <Settings size={16} strokeWidth={1.5} /> Preferences
                      </button>

                      <div className="border-t border-border/40 mt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-text-secondary hover:bg-surface-2 hover:text-red-500 transition-colors"
                        >
                          <LogOut size={16} strokeWidth={1.5} /> Logout
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </header>
        </div>
      </div>

      {/* ═══ SYSTEM BROADCAST BANNER ═══ */}
      <SystemBanner />

      {/* ═══ MAIN AREA: Sidebar + Content ═══ */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Left Sidebar — Watchlist (normal or expanded) */}
        <WatchlistSidebar
          isExpanded={isWatchlistExpanded}
          onToggleExpand={() => setIsWatchlistExpanded(!isWatchlistExpanded)}
        />

        {/* Main Content Area — hidden on desktop when watchlist is expanded */}
        {!isWatchlistExpanded && (
          <main ref={mainScrollRef} className="flex-1 overflow-y-auto w-full max-w-lg lg:max-w-none pb-16 lg:pb-0 bg-surface">
            <div className="w-full h-full">
              <Outlet />
            </div>
          </main>
        )}

        {/* Mobile always gets Outlet even if expanded (sidebar hidden on mobile) */}
        {isWatchlistExpanded && (
          <main className="flex-1 overflow-y-auto w-full max-w-lg pb-16 bg-surface lg:hidden">
            <div className="w-full h-full">
              <Outlet />
            </div>
          </main>
        )}
      </div>

      {/* ═══ MOBILE: Bottom Navigation ═══ */}
      <div className="lg:hidden">
        <BottomNav />
      </div>

      {/* ═══ LIVE TOAST NOTIFICATIONS ═══ */}
      <LiveToasts />

      {/* ═══ OFFLINE SAFEGUARD OVERLAY ═══ */}
      {isOffline && (
        <div className="fixed inset-0 z-[9999] bg-background/60 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in duration-300">
          <div className="max-w-md bg-surface-2 border border-border/80 p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center text-danger border border-danger/20 animate-bounce">
              <WifiOff size={32} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight">You are offline</h2>
              <p className="text-sm text-text-muted mt-2 leading-relaxed">
                Your internet connection has been lost. Trading controls and price streams have been disabled to protect your orders.
              </p>
            </div>
            <div className="w-full h-1 bg-border/40 rounded-full overflow-hidden relative">
              <div className="h-full bg-danger animate-pulse w-1/3 rounded-full absolute left-0" style={{ animationDuration: '1.5s', animationIterationCount: 'infinite' }}></div>
            </div>
            <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold">
              Attempting to reconnect...
            </span>
          </div>
        </div>
      )}

      {/* ═══ Risk Acknowledgment Modal ═══ */}
      <AcknowledgmentModal />
    </div>
  );
}
