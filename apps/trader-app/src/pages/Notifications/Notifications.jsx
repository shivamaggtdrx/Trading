import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, TrendingUp, AlertTriangle, Info, CheckCircle2,
  Megaphone, Settings,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useTradeStore } from '../../store/useTradeStore';
import { cn } from '../../utils/helpers';

const iconMap = {
  trade: TrendingUp,
  alert: AlertTriangle,
  system: Info,
  broadcast: Megaphone,
};

const colorMap = {
  trade: { icon: 'text-emerald-600', bg: 'bg-emerald-500/10' },
  alert: { icon: 'text-amber-600', bg: 'bg-amber-500/10' },
  system: { icon: 'text-blue-600', bg: 'bg-blue-500/10' },
  broadcast: { icon: 'text-violet-600', bg: 'bg-violet-500/10' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { notifications, markAsRead, unreadCount } = useTradeStore();

  return (
    <div className="page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-surface transition-colors touch-active-subtle">
              <ArrowLeft size={18} className="text-text-primary" />
            </button>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-text-primary">Notifications</h1>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>
          <button className="p-1.5 rounded-lg hover:bg-surface transition-colors">
            <Settings size={16} className="text-text-muted" />
          </button>
        </div>
      </header>

      <div className="px-3 space-y-2 pb-3 pt-2">
        {/* Unread count */}
        {unreadCount > 0 && (
          <div className="flex items-center gap-2 px-0.5">
            <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse-dot" />
            <span className="text-[9px] font-bold text-red-500">{unreadCount} unread</span>
          </div>
        )}

        {/* Notification List */}
        {notifications.length > 0 ? (
          <Card padding="p-0">
            <div className="divide-y divide-border/20">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.type] || Info;
                const colors = colorMap[notification.type] || colorMap.system;
                return (
                  <button
                    key={notification.id}
                    onClick={() => markAsRead(notification.id)}
                    className={cn(
                      'w-full flex items-start gap-3 px-3 py-3 text-left transition-colors touch-active-subtle',
                      !notification.read ? 'bg-blue-50/30' : 'hover:bg-surface/30'
                    )}
                  >
                    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5', colors.bg)}>
                      <Icon size={14} className={colors.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'text-[11px] leading-relaxed',
                        !notification.read ? 'font-bold text-text-primary' : 'font-medium text-text-secondary'
                      )}>
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] text-text-muted">{notification.time}</span>
                        {!notification.read && (
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        ) : (
          <Card className="py-10 text-center">
            <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mx-auto mb-2">
              <Bell size={22} className="text-text-muted/50" />
            </div>
            <p className="text-xs font-semibold text-text-secondary">No Notifications</p>
            <p className="text-[10px] text-text-muted mt-0.5">You're all caught up!</p>
          </Card>
        )}

        {/* Info */}
        <div className="flex items-start gap-2 bg-surface rounded-lg p-2.5">
          <Info size={12} className="text-text-muted mt-0.5 flex-shrink-0" />
          <p className="text-[9px] text-text-muted">
            Trade confirmations, price alerts, and platform announcements will appear here. Configure alert preferences in Settings.
          </p>
        </div>
      </div>
    </div>
  );
}
