import { X, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useTradeStore } from '../../store/useTradeStore';

const BANNER_STYLES = {
  info: {
    bg: 'bg-blue-600',
    border: 'border-blue-700',
    text: 'text-white',
    icon: <Info className="h-4 w-4 shrink-0" />,
  },
  warning: {
    bg: 'bg-amber-500',
    border: 'border-amber-600',
    text: 'text-white',
    icon: <AlertTriangle className="h-4 w-4 shrink-0" />,
  },
  system: {
    bg: 'bg-red-600',
    border: 'border-red-700',
    text: 'text-white',
    icon: <AlertCircle className="h-4 w-4 shrink-0" />,
  },
  alert: {
    bg: 'bg-red-600',
    border: 'border-red-700',
    text: 'text-white',
    icon: <AlertCircle className="h-4 w-4 shrink-0" />,
  },
};

export default function SystemBanner() {
  const systemBanner = useTradeStore((s) => s.systemBanner);
  const dismissBanner = useTradeStore((s) => s.dismissBanner);

  if (!systemBanner) return null;

  const style = BANNER_STYLES[systemBanner.type] || BANNER_STYLES.info;

  return (
    <div className={`${style.bg} ${style.border} ${style.text} border-b px-4 py-2.5 flex items-center gap-3 text-sm font-medium shadow-sm z-50`}>
      {style.icon}
      <div className="flex-1 min-w-0">
        <span className="font-bold mr-2">{systemBanner.title}:</span>
        <span className="opacity-90">{systemBanner.message}</span>
      </div>
      {systemBanner.type !== 'system' && (
        <button
          onClick={dismissBanner}
          className="shrink-0 p-1 rounded hover:bg-white/20 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
