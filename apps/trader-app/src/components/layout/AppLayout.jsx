import { Outlet, NavLink } from 'react-router-dom';
import { Home, Layers, CandlestickChart, ClipboardList, User, LogOut, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import BottomNav from './BottomNav';
import { useTradeStore } from '../../store/useTradeStore';
import { api } from '../../services/api';

export default function AppLayout() {
  const user = useTradeStore((s) => s.user);

  const handleLogout = async () => {
    await api.logout();
    window.location.href = '/login';
  };

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDarkMode = () => {
    document.documentElement.classList.toggle('dark');
    setIsDark(!isDark);
    localStorage.setItem('theme', !isDark ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-surface md:bg-surface-3 flex flex-col">
      {/* Desktop Top Navbar (Hidden on mobile) */}
      <header className="hidden md:flex items-center justify-between px-6 py-3 bg-[#0f172a] text-white shadow-md z-50">
        <div className="flex items-center gap-8">
          <div className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center text-white font-black text-xs">T</div>
            TradeX
          </div>
          <nav className="flex gap-6">
            <NavLink to="/" className={({isActive}) => \`text-sm font-semibold flex items-center gap-2 transition-colors \${isActive ? 'text-primary-light' : 'text-gray-300 hover:text-white'}\`}><Home size={16}/> Dashboard</NavLink>
            <NavLink to="/orders" className={({isActive}) => \`text-sm font-semibold flex items-center gap-2 transition-colors \${isActive ? 'text-primary-light' : 'text-gray-300 hover:text-white'}\`}><ClipboardList size={16}/> Orders</NavLink>
            <NavLink to="/positions" className={({isActive}) => \`text-sm font-semibold flex items-center gap-2 transition-colors \${isActive ? 'text-primary-light' : 'text-gray-300 hover:text-white'}\`}><Layers size={16}/> Portfolio</NavLink>
            <NavLink to="/charts" className={({isActive}) => \`text-sm font-semibold flex items-center gap-2 transition-colors \${isActive ? 'text-primary-light' : 'text-gray-300 hover:text-white'}\`}><CandlestickChart size={16}/> Charts</NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold">{user?.name || 'Trader'}</p>
            <p className="text-xs text-gray-400">{user?.clientId || 'N/A'}</p>
          </div>
          <button onClick={toggleDarkMode} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white mr-2" title="Toggle Theme">
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary-light font-bold border border-primary/30">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-300 hover:text-white" title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex justify-center w-full">
        <main className="w-full max-w-lg md:max-w-7xl md:px-4 md:py-6 pb-16 md:pb-0 relative bg-surface md:bg-transparent shadow-none md:shadow-sm md:rounded-lg">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navbar (Hidden on desktop) */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}
