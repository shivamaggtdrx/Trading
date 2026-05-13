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

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center w-16 py-1 select-none touch-active-subtle"
            >
              <Icon
                size={22}
                className={cn(
                  'transition-colors duration-200 mb-0.5',
                  isActive ? 'text-primary' : 'text-text-muted/70'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span
                className={cn(
                  'text-xs font-bold tracking-wide transition-colors duration-200',
                  isActive ? 'text-primary' : 'text-text-muted/70'
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
