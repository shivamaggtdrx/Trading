import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  ChevronRight, Star, Search,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Card from '../../components/ui/Card';
import Tabs from '../../components/ui/Tabs';
import Sparkline from '../../components/ui/Sparkline';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, formatPercent, cn } from '../../utils/helpers';

const marketTabs = [
  { key: 'stocks', label: 'Stocks' },
  { key: 'forex', label: 'Forex' },
  { key: 'metals', label: 'Metals' },
];

export default function Home() {
  const {
    positions, activeMarketTab, setActiveMarketTab,
    searchQuery, setSearchQuery, getFilteredInstruments,
    setSelectedInstrument, toggleFavorite,
    showWatchlistOnly, setShowWatchlistOnly,
  } = useTradeStore();
  const navigate = useNavigate();
  const walletRaw = useTradeStore(s => s.wallet);
  const wallet = walletRaw || { balance: 0, equity: 0, usedMargin: 0, todayPnl: 0, todayPnlPercent: 0, availableMargin: 0 };

  const totalOpenPnl = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const instruments = getFilteredInstruments();

  const handleInstrumentClick = (instrument) => {
    setSelectedInstrument(instrument);
    navigate('/charts');
  };

  return (
    <div className="page-enter">
      <Header showGreeting showNotification />

      <div className="px-4 space-y-4 pb-4 pt-2">
        {/* Portfolio Summary — Clean Flat UI */}
        <div className="flex flex-col gap-1">
          <p className="text-sm font-semibold text-text-muted uppercase tracking-wider">Equity</p>
          <div className="flex items-end justify-between">
            <h2 className="text-3xl font-bold text-text-primary tabular-nums tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(wallet.equity)}
            </h2>
            <div className="text-right">
              <div className={cn('flex items-center gap-1 text-sm font-bold justify-end', wallet.todayPnl >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                {wallet.todayPnl >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {wallet.todayPnl >= 0 ? '+' : ''}{formatCurrency(wallet.todayPnl)}
              </div>
              <p className="text-xs text-text-muted mt-0.5">Today's P&L</p>
            </div>
          </div>
        </div>

        {/* Stats — inline row, minimal border */}
        <div className="grid grid-cols-3 gap-3 py-3 border-y border-border/40">
          <div>
            <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Balance</p>
            <p className="text-sm font-bold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(wallet.balance)}</p>
          </div>
          <div>
            <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Margin</p>
            <p className="text-sm font-bold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(wallet.usedMargin)}</p>
          </div>
          <div>
            <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Open P&L</p>
            <p className={cn('text-sm font-bold tabular-nums', totalOpenPnl >= 0 ? 'text-emerald-500' : 'text-red-500')} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {totalOpenPnl >= 0 ? '+' : ''}{formatCurrency(totalOpenPnl)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search instruments..."
            className="w-full bg-surface border border-border/30 rounded-md pl-7 pr-3 py-1.5 text-base text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all" />
        </div>

        {/* Tabs + Watchlist */}
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <Tabs tabs={marketTabs} activeTab={activeMarketTab} onChange={setActiveMarketTab} compact />
          </div>
          <button onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
            className={cn('p-1.5 rounded-md border transition-all touch-active-subtle', showWatchlistOnly ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-surface border-border/40 text-text-muted')}>
            <Star size={13} className={showWatchlistOnly ? 'fill-amber-500' : ''} strokeWidth={2} />
          </button>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-0.5">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-dot" />
          <span className="text-[11px] text-text-muted font-semibold">{instruments.length} instruments · Live</span>
          {showWatchlistOnly && <span className="text-[11px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded-sm ml-1">★ Watchlist</span>}
        </div>

        {/* Compact Instrument List — terminal-style rows */}
        <div className="bg-surface">
          {/* Table header */}
          <div className="flex items-center px-2 py-2 border-b border-border/40 text-xs font-bold text-text-muted uppercase tracking-wider">
            <span className="w-6" />
            <span className="flex-1">Symbol</span>
            <span className="w-12 text-center">Chart</span>
            <span className="w-20 text-right">Price</span>
            <span className="w-16 text-right">Chg %</span>
          </div>

          <div className="divide-y divide-border/20">
            {instruments.map((inst) => (
              <div key={inst.symbol} className="instrument-row flex items-center group hover:bg-surface/30 transition-colors">
                {/* Star */}
                <button onClick={(e) => { e.stopPropagation(); toggleFavorite(inst.symbol); }}
                  className="w-6 flex items-center justify-center pl-1 py-3 touch-active-subtle">
                  <Star size={14} className={cn('transition-all', inst.isFavorite ? 'text-amber-400 fill-amber-400 star-pop' : 'text-border/60 hover:text-text-muted')} />
                </button>

                {/* Row content */}
                <button onClick={() => handleInstrumentClick(inst)} className="flex-1 flex items-center py-2.5 pr-2 touch-active-subtle">
                  <div className="flex-1 min-w-0 pl-1">
                    <p className="text-sm font-bold text-text-primary leading-tight">{inst.symbol}</p>
                    <p className="text-xs text-text-muted truncate mt-0.5">{inst.name}</p>
                  </div>
                  <div className="w-12 flex justify-center">
                    <Sparkline data={inst.sparkline} positive={inst.change >= 0} width={40} height={16} />
                  </div>
                  <div className="w-20 text-right">
                    <p className="text-sm font-bold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {inst.price >= 100 ? '₹' + inst.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '$' + inst.price.toFixed(4)}
                    </p>
                    <p className="text-[10px] text-text-muted font-medium mt-0.5">{inst.volume}</p>
                  </div>
                  <div className={cn('w-16 flex items-center gap-0.5 justify-end', inst.change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                    {inst.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    <span className="text-sm font-bold tabular-nums">{formatPercent(inst.changePercent)}</span>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {instruments.length === 0 && (
            <div className="py-12 text-center">
              {showWatchlistOnly ? (
                <><Star size={24} className="mx-auto text-text-muted/30 mb-2" /><p className="text-sm font-semibold text-text-muted">No favorites yet</p></>
              ) : (
                <><Search size={24} className="mx-auto text-text-muted/30 mb-2" /><p className="text-sm font-semibold text-text-muted">No instruments found</p></>
              )}
            </div>
          )}
        </div>

        {/* Open Positions preview */}
        {positions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1 px-0.5">
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">Open Positions ({positions.length})</h2>
              <button onClick={() => navigate('/positions')} className="flex items-center gap-0.5 text-sm font-semibold text-primary">
                View All <ChevronRight size={10} />
              </button>
            </div>
            <div className="bg-surface rounded-lg border border-border/20 overflow-hidden">
              {positions.slice(0, 3).map((pos, i) => (
                <div key={pos.id} className={cn('flex items-center justify-between px-2.5 py-1.5', i > 0 && 'border-t border-border/10')}>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-5 h-5 rounded-sm flex items-center justify-center text-[11px] font-extrabold',
                      pos.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500')}>
                      {pos.type === 'BUY' ? '▲' : '▼'}
                    </div>
                    <div>
                      <p className="text-base font-bold text-text-primary">{pos.symbol}</p>
                      <p className="text-[11px] text-text-muted">Qty: {pos.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-base font-extrabold tabular-nums', pos.pnl >= 0 ? 'pnl-glow-profit' : 'pnl-glow-loss')} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                    </p>
                    <p className={cn('text-[11px] font-bold', pos.pnl >= 0 ? 'text-emerald-500/60' : 'text-red-500/60')}>
                      {formatPercent(pos.pnlPercent)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Market status */}
        <div className="flex items-center gap-1.5 px-0.5 py-0.5">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-dot" />
          <span className="text-[11px] font-medium text-text-muted">Market Open</span>
          <span className="text-[11px] text-text-muted/40 ml-auto">NSE · BSE</span>
        </div>
      </div>
    </div>
  );
}
