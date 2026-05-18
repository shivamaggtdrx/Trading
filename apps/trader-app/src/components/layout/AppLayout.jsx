import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Layers, CandlestickChart, ClipboardList, User, LogOut,
  Moon, Sun, Wallet, FileText, Headphones, Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import BottomNav from './BottomNav';
import WatchlistSidebar from './WatchlistSidebar';
import MarketTickerBar from './MarketTickerBar';
import AcknowledgmentModal from '../ui/AcknowledgmentModal';
import SystemBanner from './SystemBanner';
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const [isDark, setIsDark] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isWatchlistExpanded, setIsWatchlistExpanded] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col">
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
          <main className="flex-1 overflow-y-auto w-full max-w-lg lg:max-w-none pb-16 lg:pb-0 bg-surface">
            <Outlet />
          </main>
        )}

        {/* Mobile always gets Outlet even if expanded (sidebar hidden on mobile) */}
        {isWatchlistExpanded && (
          <main className="flex-1 overflow-y-auto w-full max-w-lg pb-16 bg-surface lg:hidden">
            <Outlet />
          </main>
        )}
      </div>

      {/* ═══ MOBILE: Bottom Navigation ═══ */}
      <div className="lg:hidden">
        <BottomNav />
      </div>

      {/* ═══ Risk Acknowledgment Modal ═══ */}
      <AcknowledgmentModal />
    </div>
  );
}
