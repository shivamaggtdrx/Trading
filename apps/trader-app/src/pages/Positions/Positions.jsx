import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, X, AlertCircle, ArrowRight } from 'lucide-react';
import Header from '../../components/layout/Header';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, formatPercent, cn } from '../../utils/helpers';

export default function Positions() {
  const { positions, closePosition } = useTradeStore();
  const [closingId, setClosingId] = useState(null);
  const [animatedPnl, setAnimatedPnl] = useState({});

  const totalPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const totalMargin = positions.reduce((sum, p) => sum + p.margin, 0);
  const profitCount = positions.filter(p => p.pnl >= 0).length;
  const lossCount = positions.filter(p => p.pnl < 0).length;

  // Simulate real-time P&L updates
  useEffect(() => {
    const interval = setInterval(() => {
      const randomIndex = Math.floor(Math.random() * positions.length);
      if (positions[randomIndex]) {
        setAnimatedPnl(prev => ({
          ...prev,
          [positions[randomIndex].id]: true
        }));
        setTimeout(() => {
          setAnimatedPnl(prev => ({
            ...prev,
            [positions[randomIndex].id]: false
          }));
        }, 800);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [positions]);

  const handleClose = () => {
    if (closingId) {
      closePosition(closingId);
      setClosingId(null);
    }
  };

  const getPnlBarWidth = (pnlPercent) => {
    const absPercent = Math.abs(pnlPercent);
    return Math.min(absPercent * 20, 100); // scale for visibility
  };

  return (
    <div className="page-enter">
      <Header title="Positions" compact />

      <div className="px-3 space-y-2.5 pb-3">
        {/* P&L Summary — Enhanced */}
        <Card padding="p-0" className="overflow-hidden">
          <div className={cn(
            'p-3.5 border-b-2',
            totalPnl >= 0 ? 'border-emerald-500/20' : 'border-red-500/20'
          )}>
            <div className="grid grid-cols-4 gap-3">
              <div className="col-span-2">
                <p className="text-sm text-text-muted font-bold uppercase tracking-wider mb-1">Unrealized P&L</p>
                <p className={cn(
                  'text-xl font-extrabold tabular-nums',
                  totalPnl >= 0 ? 'pnl-glow-profit' : 'pnl-glow-loss'
                )} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
                </p>
              </div>
              <div>
                <p className="text-sm text-text-muted font-bold uppercase tracking-wider mb-1">Margin</p>
                <p className="text-sm font-bold text-text-primary tabular-nums">{formatCurrency(totalMargin)}</p>
              </div>
              <div>
                <p className="text-sm text-text-muted font-bold uppercase tracking-wider mb-1">W / L</p>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-emerald-500">{profitCount}</span>
                  <span className="text-base text-text-muted">/</span>
                  <span className="text-sm font-bold text-red-500">{lossCount}</span>
                </div>
              </div>
            </div>
          </div>
          {/* P&L distribution bar */}
          <div className="h-1 flex">
            <div
              className="bg-emerald-500 transition-all duration-500"
              style={{ width: `${positions.length > 0 ? (profitCount / positions.length) * 100 : 50}%` }}
            />
            <div
              className="bg-red-500 transition-all duration-500"
              style={{ width: `${positions.length > 0 ? (lossCount / positions.length) * 100 : 50}%` }}
            />
          </div>
        </Card>

        {/* Position List */}
        {positions.length > 0 ? (
          <div className="space-y-2">
            {positions.map((pos, i) => {
              const isProfit = pos.pnl >= 0;
              const isAnimating = animatedPnl[pos.id];

              return (
                <Card
                  key={pos.id}
                  padding="p-0"
                  className="overflow-hidden border border-border/60 shadow-sm"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  {/* P&L accent bar */}
                  <div className={cn(
                    'h-0.5',
                    isProfit ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-red-400 to-red-500'
                  )} />

                  <div className="p-3">
                    {/* Header Row */}
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center text-base font-extrabold',
                          pos.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
                        )}>
                          {pos.type === 'BUY' ? '▲' : '▼'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <p className="text-base font-bold text-text-primary">{pos.symbol}</p>
                            <span className={cn(
                              'text-[11px] font-bold px-1.5 py-0.5 rounded-md',
                              pos.type === 'BUY' ? 'bg-emerald-500/8 text-emerald-600' : 'bg-red-500/8 text-red-500'
                            )}>
                              {pos.type}
                            </span>
                          </div>
                          <p className="text-base text-text-muted mt-0.5">
                            Qty: <span className="font-semibold text-text-secondary">{pos.quantity}</span>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-base font-extrabold tabular-nums',
                            isProfit ? 'pnl-glow-profit' : 'pnl-glow-loss',
                            isAnimating && 'blink-update'
                          )}
                          style={{ fontFamily: "'JetBrains Mono', monospace" }}
                        >
                          {isProfit ? '+' : ''}{formatCurrency(pos.pnl)}
                        </p>
                        <div className={cn(
                          'inline-flex items-center gap-0.5 text-base font-bold px-1.5 py-0.5 rounded-md mt-0.5',
                          isProfit ? 'bg-emerald-500/8 text-emerald-600' : 'bg-red-500/8 text-red-500'
                        )}>
                          {isProfit ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                          ROI {formatPercent(pos.pnlPercent)}
                        </div>
                      </div>
                    </div>

                    {/* Entry vs Current — visual comparison */}
                    <div className="bg-surface/80 rounded-lg p-2.5 mb-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Entry</p>
                          <p className="text-sm font-bold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {pos.entryPrice >= 100 ? '₹' : '$'}
                            {pos.entryPrice >= 100
                              ? pos.entryPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                              : pos.entryPrice.toFixed(4)}
                          </p>
                        </div>
                        <div className="flex flex-col items-center gap-0.5">
                          <ArrowRight size={12} className={isProfit ? 'text-emerald-500' : 'text-red-500'} />
                          <span className={cn(
                            'text-[11px] font-bold',
                            isProfit ? 'text-emerald-500' : 'text-red-500'
                          )}>
                            {isProfit ? '+' : ''}{((pos.currentPrice - pos.entryPrice) / pos.entryPrice * 100).toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-0.5">Current</p>
                          <p className={cn(
                            'text-sm font-bold tabular-nums',
                            isProfit ? 'text-emerald-600' : 'text-red-500',
                            isAnimating && 'blink-update'
                          )} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {pos.currentPrice >= 100 ? '₹' : '$'}
                            {pos.currentPrice >= 100
                              ? pos.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                              : pos.currentPrice.toFixed(4)}
                          </p>
                        </div>
                      </div>
                      {/* Progress bar */}
                      <div className="mt-2 h-1 bg-border/30 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            'h-full rounded-full transition-all duration-700',
                            isProfit ? 'bg-emerald-500' : 'bg-red-500'
                          )}
                          style={{ width: `${getPnlBarWidth(pos.pnlPercent)}%` }}
                        />
                      </div>
                    </div>

                    {/* Margin info + close */}
                    <div className="flex items-center justify-between">
                      <div className="text-base text-text-muted">
                        Margin: <span className="font-semibold text-text-secondary">{formatCurrency(pos.margin)}</span>
                      </div>
                      <Button
                        variant="outline-danger"
                        size="xs"
                        onClick={() => setClosingId(pos.id)}
                        className="font-bold"
                      >
                        <X size={11} className="mr-1" />
                        Close
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="py-10 text-center">
            <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mx-auto mb-2">
              <AlertCircle size={22} className="text-text-muted/50" />
            </div>
            <p className="text-sm font-semibold text-text-secondary">No Open Positions</p>
            <p className="text-base text-text-muted mt-0.5">Your active trades will appear here</p>
          </Card>
        )}
      </div>

      {/* Close Position Confirmation */}
      <Modal
        isOpen={!!closingId}
        onClose={() => setClosingId(null)}
        title="Close Position"
      >
        {closingId && (() => {
          const pos = positions.find((p) => p.id === closingId);
          if (!pos) return null;
          const isProfit = pos.pnl >= 0;
          return (
            <div className="space-y-4">
              <div className="bg-surface rounded-lg p-4 space-y-2.5">
                <div className="flex justify-between text-base">
                  <span className="text-text-muted">Symbol</span>
                  <span className="font-bold text-text-primary">{pos.symbol}</span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-text-muted">Type</span>
                  <span className={cn(
                    'font-semibold',
                    pos.type === 'BUY' ? 'text-emerald-500' : 'text-red-500'
                  )}>
                    {pos.type}
                  </span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-text-muted">Quantity</span>
                  <span className="font-semibold text-text-primary">{pos.quantity}</span>
                </div>
                <div className="border-t border-border/50 pt-2.5">
                  <div className="flex justify-between items-center">
                    <span className="text-base text-text-muted">Realized P&L</span>
                    <span className={cn(
                      'font-extrabold text-lg tabular-nums',
                      isProfit ? 'pnl-profit' : 'pnl-loss'
                    )} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {isProfit ? '+' : ''}{formatCurrency(pos.pnl)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" fullWidth size="lg" onClick={() => setClosingId(null)}>
                  Cancel
                </Button>
                <Button variant="danger" fullWidth size="lg" onClick={handleClose}>
                  Close Position
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
