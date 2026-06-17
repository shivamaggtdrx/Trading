import { useTradeStore } from '../../store/useTradeStore';
import { cn } from '../../utils/helpers';

export default function ConnectionStatus() {
  const socketConnected = useTradeStore((s) => s.socketConnected);

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-surface-2 border border-border/40 shadow-sm select-none">
      <span className="relative flex h-2 w-2">
        <span className={cn(
          "animate-ping absolute inline-flex h-full w-full rounded-full opacity-75",
          socketConnected ? "bg-emerald-500" : "bg-red-500"
        )}></span>
        <span className={cn(
          "relative inline-flex rounded-full h-2 w-2",
          socketConnected ? "bg-emerald-500" : "bg-red-500"
        )}></span>
      </span>
      <span className="text-[11px] font-extrabold tracking-wider uppercase text-text-secondary">
        {socketConnected ? 'Live' : 'Offline'}
      </span>
    </div>
  );
}
