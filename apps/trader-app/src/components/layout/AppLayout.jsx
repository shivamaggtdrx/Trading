import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home as HomeIcon, Layers, CandlestickChart, ClipboardList, User, LogOut,
  Moon, Sun, Wallet as WalletIcon, FileText, Headphones, Settings, WifiOff,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import BottomNav from './BottomNav';
import WatchlistSidebar from './WatchlistSidebar';
// MarketTickerBar import removed — rendered inside WatchlistSidebar
import AcknowledgmentModal from '../ui/AcknowledgmentModal';
import SystemBanner from './SystemBanner';
import MarginCallBanner from './MarginCallBanner';
import ConnectionStatus from './ConnectionStatus';
import LiveToasts from './LiveToasts';
import { useTradeStore } from '../../store/useTradeStore';

// Import Main Tab Pages for IndexedStack (Keep-Alive)
import Markets from '../../pages/Markets/Markets';
import Home from '../../pages/Home/Home';
import Positions from '../../pages/Positions/Positions';
import Charts from '../../pages/Charts/Charts';
import Orders from '../../pages/Orders/Orders';
import Wallet from '../../pages/Wallet/Wallet';
import Profile from '../../pages/Profile/Profile';
import { cn } from '../../utils/helpers';


const desktopNavItems = [
  { path: '/dashboard', icon: HomeIcon, label: 'Dashboard' },
  { path: '/orders', icon: ClipboardList, label: 'Orders' },
  { path: '/positions', icon: Layers, label: 'Portfolio' },
  { path: '/charts', icon: CandlestickChart, label: 'Charts' },
  { path: '/wallet', icon: WalletIcon, label: 'Funds' },
  { path: '/reports', icon: FileText, label: 'Reports' },
  { path: '/help', icon: Headphones, label: 'Support' },
];

const mainTabPages = [
  { id: 'markets', Component: Markets },
  { id: 'dashboard', Component: Home },
  { id: 'positions', Component: Positions },
  { id: 'charts', Component: Charts },
  { id: 'orders', Component: Orders },
  { id: 'wallet', Component: Wallet },
  { id: 'profile', Component: Profile },
];

function DebugMountLogger({ name }) {
  useEffect(() => {
    if (!import.meta.env.DEV) return undefined;

    console.log('MOUNT', name);
    return () => console.log('UNMOUNT', name);
  }, [name]);

  return null;
}

function MainTabStack({ currentTab }) {
  return (
    <>
      {mainTabPages.map(({ id, Component }) => {
        const isActive = currentTab === id;

        return (
          <section
            key={id}
            aria-hidden={!isActive}
            className="absolute inset-0 w-full min-h-full bg-surface overflow-y-auto overflow-x-hidden"
            style={{
              visibility: isActive ? 'visible' : 'hidden',
              zIndex: isActive ? 10 : 0,
              pointerEvents: isActive ? 'auto' : 'none',
            }}
          >
            <DebugMountLogger name={id} />
            <Component />
          </section>
        );
      })}
    </>
  );
}

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

  // Determine which main tab is active for IndexedStack
  const currentTab = location.pathname === '/' || location.pathname === '/markets' ? 'markets' :
                     location.pathname === '/dashboard' ? 'dashboard' :
                     location.pathname === '/positions' ? 'positions' :
                     location.pathname === '/charts' ? 'charts' :
                     location.pathname === '/orders' ? 'orders' :
                     location.pathname === '/wallet' ? 'wallet' :
                     location.pathname === '/profile' ? 'profile' : null;

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
    <div className="h-dvh lg:h-auto lg:min-h-screen bg-surface flex flex-col overflow-hidden lg:overflow-visible">
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

        {/* Main Content Area */}
        <main
          ref={mainScrollRef}
          className={cn(
            "flex-1 overflow-x-hidden w-full pb-16 bg-surface max-w-lg",
            isWatchlistExpanded ? "lg:hidden" : "lg:max-w-none lg:pb-0",
            currentTab ? "overflow-hidden" : "overflow-y-auto"
          )}
        >
          <div className="w-full h-full relative">
            {/* INDEXED STACK: keeps tab pages mounted and avoids display:none paint gaps on mobile. */}
            <MainTabStack currentTab={currentTab} />

            {/* NORMAL OUTLET: For sub-pages like /trade, /history, /kyc/submit */}
            <div className={!currentTab ? 'block h-full w-full' : 'hidden'}>
              <Outlet />
            </div>
          </div>
        </main>
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
