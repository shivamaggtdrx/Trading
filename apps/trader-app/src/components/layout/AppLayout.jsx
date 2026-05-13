import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  Home, Layers, CandlestickChart, ClipboardList, User, LogOut,
  Moon, Sun, Wallet, FileText, Headphones, BarChart3, Settings,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import BottomNav from './BottomNav';
import WatchlistSidebar from './WatchlistSidebar';
import MarketTickerBar from './MarketTickerBar';
import { useTradeStore } from '../../store/useTradeStore';
import { api } from '../../services/api';
import { cn } from '../../utils/helpers';

const desktopNavItems = [
  { path: '/', icon: Home, label: 'Dashboard' },
  { path: '/orders', icon: ClipboardList, label: 'Orders' },
  { path: '/positions', icon: Layers, label: 'Portfolio' },
  { path: '/charts', icon: CandlestickChart, label: 'Charts' },
  { path: '/wallet', icon: Wallet, label: 'Funds' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/help', icon: Headphones, label: 'Support' },
];

export default function AppLayout() {
  const user = useTradeStore((s) => s.user);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await api.logout();
    window.location.href = '/login';
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
      <div className="hidden lg:block sticky top-0 z-50">
        <MarketTickerBar />

        {/* Main Navigation Bar */}
        <header className="flex items-center justify-between px-4 py-0 bg-[#131722] text-white border-b border-white/5">
          {/* Nav Items */}
          <nav className="flex items-center">
            {desktopNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => cn(
                  'flex items-center gap-1.5 px-4 py-3 text-[13px] font-semibold transition-all border-b-2 -mb-[1px]',
                  isActive
                    ? 'text-white border-primary bg-white/5'
                    : 'text-gray-400 border-transparent hover:text-gray-200 hover:bg-white/[0.03]'
                )}
              >
                <item.icon size={15} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right Side — User Controls */}
          <div className="flex items-center gap-1">
            {/* Screeners (like competitor) */}
            <NavLink
              to="/markets"
              className={({ isActive }) => cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-semibold transition-all',
                isActive
                  ? 'bg-primary text-white'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              )}
            >
              <BarChart3 size={14} />
              Screeners
            </NavLink>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-md hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              title="Toggle Theme"
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* User Profile Dropdown */}
            <div className="relative ml-1">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5 transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-primary/20">
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 w-56 bg-surface border border-border/40 rounded-lg shadow-2xl z-50 py-1 overflow-hidden">
                    {/* User Info */}
                    <div className="px-3 py-2.5 border-b border-border/30">
                      <p className="text-sm font-bold text-text-primary">{user?.name || 'Trader'}</p>
                      <p className="text-[11px] text-text-muted mt-0.5">{user?.clientId || 'TDX-00000'}</p>
                    </div>

                    <button
                      onClick={() => { navigate('/profile'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
                    >
                      <User size={14} /> My Profile
                    </button>
                    <button
                      onClick={() => { navigate('/preferences'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
                    >
                      <Settings size={14} /> Preferences
                    </button>
                    <button
                      onClick={() => { navigate('/referral'); setShowProfileMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:bg-surface-2 transition-colors"
                    >
                      <BarChart3 size={14} /> Referral Program
                    </button>

                    <div className="border-t border-border/30 mt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/5 transition-colors"
                      >
                        <LogOut size={14} /> Logout
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
      </div>

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
    </div>
  );
}
