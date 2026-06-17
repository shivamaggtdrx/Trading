import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { useTradeStore } from '../../store/useTradeStore';

export default function LiveToasts() {
  const toasts = useTradeStore((s) => s.toasts || []);
  const removeToast = useTradeStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-4 lg:right-4 z-[999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto w-full bg-surface-2 border border-border/80 rounded-xl p-4 shadow-xl flex gap-3 relative overflow-hidden backdrop-blur-md"
        >
          {toast.type === 'success' && (
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
              <CheckCircle size={20} strokeWidth={2} />
            </div>
          )}
          {toast.type === 'warning' && (
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} strokeWidth={2} />
            </div>
          )}
          {toast.type === 'error' && (
            <div className="w-10 h-10 rounded-full bg-danger/10 border border-danger/20 text-danger flex items-center justify-center shrink-0">
              <AlertCircle size={20} strokeWidth={2} />
            </div>
          )}
          {toast.type === 'info' && (
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center justify-center shrink-0">
              <Info size={20} strokeWidth={2} />
            </div>
          )}
          <div className="flex-1 min-w-0 pr-4">
            <h4 className="text-sm font-bold text-text-primary">{toast.title}</h4>
            <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="absolute top-2 right-2 text-text-muted hover:text-text-primary transition-colors p-1"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
