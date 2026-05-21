import { useState, useCallback } from 'react';
import { X, Search, FileSearch } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, formatPercent, cn , formatPrice} from '../../utils/helpers';
import { usePullToRefresh, PullIndicator } from '../../hooks/usePullToRefresh';

export default function Positions() {
  const { positions, closePosition, fetchPositions } = useTradeStore();
  const [closingId, setClosingId] = useState(null);
  const [selectAll, setSelectAll] = useState(false);

  const totalPnl = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const totalPnlPct = positions.length > 0
    ? positions.reduce((sum, p) => sum + (p.pnlPercent || 0), 0) / positions.length : 0;

  const onRefresh = useCallback(async () => {
    try { await fetchPositions(); } catch (e) { /* silent */ }
  }, [fetchPositions]);

  const { containerProps, isRefreshing, pullProgress } = usePullToRefresh(onRefresh);

  const handleClose = () => { if (closingId) { closePosition(closingId); setClosingId(null); } };

  
  return (
    <div className="page-enter bg-surface min-h-screen relative" {...containerProps}>
      <PullIndicator progress={pullProgress} isRefreshing={isRefreshing} />
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-text-primary">Positions</h1>
        <div className="mt-2 h-0.5 bg-blue-500 w-20 rounded-full" />
      </div>

      <div className="flex items-center gap-3 px-4 py-3">
        <button className="px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-lg">Netwise</button>
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input type="checkbox" checked={selectAll} onChange={() => setSelectAll(!selectAll)}
            className="w-4 h-4 border-2 border-border rounded accent-blue-500" />
          <span className="text-sm text-text-muted font-medium">Select All</span>
        </label>
      </div>

      <div className="mx-4 bg-surface-2 rounded-xl border border-border px-4 py-3.5 flex items-center justify-between">
        <span className="text-sm text-text-muted font-medium">Unrealized P&L</span>
        <span className={cn('text-base font-bold tabular-nums', totalPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
          {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)} ({totalPnlPct.toFixed(0)}%)
        </span>
      </div>

      <div className="mt-4 px-4">
        {positions.length > 0 ? (
          <div className="space-y-2">
            {positions.map((pos) => {
              const isProfit = (pos.pnl || 0) >= 0;
              return (
                <div key={pos.id} className="bg-surface-2 rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-text-primary">{pos.symbol}</p>
                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded',
                          pos.type === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>
                          {pos.type}
                        </span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5">Qty: {pos.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className={cn('text-sm font-bold tabular-nums', isProfit ? 'text-emerald-400' : 'text-red-400')}>
                        {isProfit ? '+' : ''}{formatCurrency(pos.pnl || 0)}
                      </p>
                      <p className={cn('text-xs font-semibold tabular-nums', isProfit ? 'text-emerald-400/70' : 'text-red-400/70')}>
                        {formatPercent(pos.pnlPercent || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                    <div><p className="text-[10px] text-text-muted font-medium uppercase">Entry</p><p className="text-xs font-bold text-text-secondary tabular-nums">{formatPrice(pos.entryPrice)}</p></div>
                    <div><p className="text-[10px] text-text-muted font-medium uppercase">Current</p><p className={cn('text-xs font-bold tabular-nums', isProfit ? 'text-emerald-400' : 'text-red-400')}>{formatPrice(pos.currentPrice)}</p></div>
                    <div><p className="text-[10px] text-text-muted font-medium uppercase">Margin</p><p className="text-xs font-bold text-text-secondary tabular-nums">{formatCurrency(pos.margin)}</p></div>
                    <button onClick={() => setClosingId(pos.id)}
                      className="px-3 py-1.5 border border-red-500/40 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/10 transition-colors">Close</button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="relative mb-4">
              <div className="w-16 h-20 bg-surface-3 rounded-lg border border-border flex items-center justify-center">
                <FileSearch size={28} className="text-text-muted/40" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-cyan-500/20 rounded-full flex items-center justify-center">
                <Search size={14} className="text-cyan-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-text-primary">No positions</h3>
            <p className="text-sm text-text-muted mt-1">You have no open positions at the moment</p>
          </div>
        )}
      </div>

      <Modal isOpen={!!closingId} onClose={() => setClosingId(null)} title="Close Position">
        {closingId && (() => {
          const pos = positions.find((p) => p.id === closingId);
          if (!pos) return null;
          const isProfit = (pos.pnl || 0) >= 0;
          return (
            <div className="space-y-4">
              <div className="bg-surface rounded-lg p-4 space-y-2.5">
                <div className="flex justify-between text-sm"><span className="text-text-muted">Symbol</span><span className="font-bold text-text-primary">{pos.symbol}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Type</span><span className={cn('font-semibold', pos.type === 'BUY' ? 'text-emerald-500' : 'text-red-500')}>{pos.type}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Quantity</span><span className="font-semibold text-text-primary">{pos.quantity}</span></div>
                <div className="border-t border-border/50 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-text-muted">Estimated P&L</span>
                    <span className={cn('font-extrabold text-lg tabular-nums', isProfit ? 'text-emerald-500' : 'text-red-500')}>
                      {isProfit ? '+' : ''}{formatCurrency(pos.pnl || 0)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" fullWidth size="lg" onClick={() => setClosingId(null)}>Cancel</Button>
                <Button variant="danger" fullWidth size="lg" onClick={handleClose}>Close Position</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
