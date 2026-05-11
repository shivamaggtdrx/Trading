import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '../../store/useTradeStore';
import { cn } from '../../utils/helpers';

export default function Header({ title, showNotification = true, showGreeting = false, compact = false }) {
  const { user, unreadCount } = useTradeStore();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
      <div className={cn(
        'max-w-lg mx-auto flex items-center justify-between px-4',
        compact ? 'py-2' : 'py-2.5'
      )}>
        <div>
          {showGreeting ? (
            <>
              <p className="text-[10px] text-text-muted font-medium tracking-wide uppercase">{getTimeOfDay()}</p>
              <h1 className="text-base font-bold text-text-primary tracking-tight leading-tight">{user?.name || user?.full_name || 'Trader'}</h1>
            </>
          ) : (
            <h1 className="text-base font-bold text-text-primary tracking-tight">{title}</h1>
          )}
        </div>

        {showNotification && (
          <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-xl bg-white/60 hover:bg-white transition-colors touch-active-subtle border border-border/30">
            <Bell size={18} className="text-text-secondary" strokeWidth={1.8} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-danger text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm">
                {unreadCount}
              </span>
            )}
          </button>
        )}
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
