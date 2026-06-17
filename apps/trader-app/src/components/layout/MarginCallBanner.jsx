import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '../../store/useTradeStore';

export default function MarginCallBanner() {
  const marginCallWarning = useTradeStore((s) => s.marginCallWarning);
  const navigate = useNavigate();

  if (!marginCallWarning) return null;

  return (
    <div className="bg-gradient-to-r from-red-500/90 via-amber-500/90 to-red-500/90 text-white text-xs font-semibold px-4 py-2 flex items-center justify-between gap-2 border-b border-red-500/30 backdrop-blur-sm animate-pulse w-full">
      <div className="flex items-center gap-2 max-w-lg lg:max-w-none mx-auto w-full">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        <span className="tracking-wide text-[11px] sm:text-xs">
          <strong>Margin Call Warning!</strong> Margin Level: <span className="font-mono text-white underline decoration-wavy">{marginCallWarning.marginLevel.toFixed(1)}%</span>. Equity: ₹{marginCallWarning.equity.toLocaleString('en-IN', { maximumFractionDigits: 0 })}.
        </span>
        <button 
          onClick={() => navigate('/wallet')} 
          className="bg-white/20 hover:bg-white/30 text-white text-[10px] uppercase font-extrabold px-2.5 py-1 rounded transition-all tracking-wider flex-shrink-0 ml-auto"
        >
          Deposit
        </button>
      </div>
    </div>
  );
}
