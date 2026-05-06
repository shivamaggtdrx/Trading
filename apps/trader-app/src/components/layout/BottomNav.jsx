import { NavLink, useLocation } from 'react-router-dom';
import { Home, Layers, CandlestickChart, ClipboardList, User } from 'lucide-react';
import { cn } from '../../utils/helpers';

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/positions', icon: Layers, label: 'Positions' },
  { path: '/charts', icon: CandlestickChart, label: 'Charts' },
  { path: '/orders', icon: ClipboardList, label: 'Orders' },
  { path: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 glass-heavy border-t border-border/40 z-40 bottom-nav">
      <div className="max-w-lg mx-auto flex items-center justify-around px-1 pt-1 pb-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const isChartsBtn = item.path === '/charts';

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center w-14 py-1 select-none touch-active-subtle"
            >
              {isChartsBtn ? (
                <div className={cn(
                  'flex items-center justify-center w-11 h-11 rounded-xl -mt-5 mb-0 transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/30'
                    : 'bg-gradient-to-br from-blue-500/90 to-indigo-600/90 shadow-md shadow-blue-500/20'
                )}>
                  <Icon size={19} className="text-white" strokeWidth={2.5} />
                </div>
              ) : (
                <div className={cn(
                  'flex items-center justify-center w-9 h-7 rounded-md transition-all duration-200',
                  isActive && 'bg-primary/8'
                )}>
                  <Icon
                    size={19}
                    className={cn(
                      'transition-colors duration-200',
                      isActive ? 'text-primary' : 'text-text-muted'
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                </div>
              )}
              <span
                className={cn(
                  'text-[9px] mt-0.5 font-semibold tracking-wide transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-text-muted',
                  isChartsBtn && 'text-primary'
                )}
              >
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
