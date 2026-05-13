import { Bell, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '../../store/useTradeStore';
import { cn } from '../../utils/helpers';

export default function Header({ title, showNotification = true, showGreeting = false, compact = false }) {
  const { user, unreadCount } = useTradeStore();
  const navigate = useNavigate();

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
    <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
      <div className={cn(
        'max-w-lg mx-auto flex items-center justify-between px-4',
        compact ? 'py-2' : 'py-3'
      )}>
        <div>
          {showGreeting ? (
            <>
              <p className="text-xs text-text-muted font-bold tracking-wide uppercase mb-0.5">{getTimeOfDay()}</p>
              <h1 className="text-2xl font-bold text-text-primary tracking-tight leading-none">{user?.name || user?.full_name || 'Trader'}</h1>
            </>
          ) : (
            <h1 className="text-xl font-bold text-text-primary tracking-tight">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button onClick={toggleDarkMode} className="p-2 rounded-xl bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors touch-active-subtle border border-border/30 text-text-secondary">
            {isDark ? <Sun size={18} strokeWidth={1.8} /> : <Moon size={18} strokeWidth={1.8} />}
          </button>
          
          {showNotification && (
            <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-xl bg-white/60 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors touch-active-subtle border border-border/30">
              <Bell size={18} className="text-text-secondary" strokeWidth={1.8} />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow-sm">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}
