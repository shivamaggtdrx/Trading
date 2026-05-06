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
    wallet, positions, activeMarketTab, setActiveMarketTab,
    searchQuery, setSearchQuery, getFilteredInstruments,
    setSelectedInstrument, toggleFavorite,
    showWatchlistOnly, setShowWatchlistOnly,
  } = useTradeStore();
  const navigate = useNavigate();

  const totalOpenPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const instruments = getFilteredInstruments();

  const handleInstrumentClick = (instrument) => {
    setSelectedInstrument(instrument);
    navigate('/charts');
  };

  return (
    <div className="page-enter">
      <Header showGreeting showNotification />

      <div className="px-3 space-y-1.5 pb-3">
        {/* Portfolio Summary — ultra-compact */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 px-3 py-2.5 rounded-lg text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '14px 14px'
          }} />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white/10 rounded-md flex items-center justify-center">
                <Wallet size={12} />
              </div>
              <div>
                <p className="text-[8px] font-medium text-white/40 uppercase tracking-wider">Equity</p>
                <p className="text-base font-extrabold tracking-tight leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatCurrency(wallet.equity)}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={cn('flex items-center gap-0.5 text-[9px] font-bold justify-end', wallet.todayPnl >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                {wallet.todayPnl >= 0 ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                {wallet.todayPnl >= 0 ? '+' : ''}{formatCurrency(wallet.todayPnl)}
              </div>
              <p className={cn('text-[8px] font-bold', wallet.todayPnl >= 0 ? 'text-emerald-400/60' : 'text-red-400/60')}>
                {formatPercent(wallet.todayPnlPercent)} today
              </p>
            </div>
          </div>
        </div>

        {/* Stats — inline row, no card wrapper */}
        <div className="grid grid-cols-3 gap-1">
          <div className="bg-white rounded-md px-2.5 py-1.5 border border-border/20">
            <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Balance</p>
            <p className="text-[10px] font-extrabold text-text-primary tabular-nums mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(wallet.balance)}</p>
          </div>
          <div className="bg-white rounded-md px-2.5 py-1.5 border border-border/20">
            <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Margin</p>
            <p className="text-[10px] font-extrabold text-text-primary tabular-nums mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(wallet.usedMargin)}</p>
          </div>
          <div className="bg-white rounded-md px-2.5 py-1.5 border border-border/20">
            <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Open P&L</p>
            <p className={cn('text-[10px] font-extrabold tabular-nums mt-0.5', totalOpenPnl >= 0 ? 'pnl-glow-profit' : 'pnl-glow-loss')} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {totalOpenPnl >= 0 ? '+' : ''}{formatCurrency(totalOpenPnl)}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search instruments..."
            className="w-full bg-white border border-border/30 rounded-md pl-7 pr-3 py-1.5 text-[11px] text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/20 focus:border-primary/30 transition-all" />
        </div>

        {/* Tabs + Watchlist */}
        <div className="flex items-center gap-1">
          <div className="flex-1">
            <Tabs tabs={marketTabs} activeTab={activeMarketTab} onChange={setActiveMarketTab} compact />
          </div>
          <button onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
            className={cn('p-1.5 rounded-md border transition-all touch-active-subtle', showWatchlistOnly ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-border/40 text-text-muted')}>
            <Star size={13} className={showWatchlistOnly ? 'fill-amber-500' : ''} strokeWidth={2} />
          </button>
        </div>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-0.5">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-dot" />
          <span className="text-[8px] text-text-muted font-semibold">{instruments.length} instruments · Live</span>
          {showWatchlistOnly && <span className="text-[8px] font-bold text-amber-600 bg-amber-50 px-1 py-0.5 rounded-sm ml-1">★ Watchlist</span>}
        </div>

        {/* Compact Instrument List — terminal-style rows */}
        <div className="bg-white rounded-lg border border-border/20 overflow-hidden">
          {/* Table header */}
          <div className="flex items-center px-2 py-1 bg-surface/50 border-b border-border/15 text-[7px] font-bold text-text-muted uppercase tracking-wider">
            <span className="w-5" />
            <span className="flex-1">Symbol</span>
            <span className="w-10 text-center">Chart</span>
            <span className="w-[62px] text-right">Price</span>
            <span className="w-[50px] text-right">Chg %</span>
          </div>

          {instruments.map((inst, idx) => (
            <div key={inst.symbol} className={cn('instrument-row flex items-center', idx % 2 === 1 && 'bg-surface/20')}>
              {/* Star */}
              <button onClick={(e) => { e.stopPropagation(); toggleFavorite(inst.symbol); }}
                className="w-5 flex items-center justify-center pl-1.5 py-1.5 touch-active-subtle">
                <Star size={10} className={cn('transition-all', inst.isFavorite ? 'text-amber-400 fill-amber-400 star-pop' : 'text-border/60 hover:text-text-muted')} />
              </button>

              {/* Row content */}
              <button onClick={() => handleInstrumentClick(inst)} className="flex-1 flex items-center py-1.5 pr-2 touch-active-subtle">
                <div className="flex-1 min-w-0 pl-1">
                  <p className="text-[10px] font-extrabold text-text-primary leading-tight">{inst.symbol}</p>
                  <p className="text-[7px] text-text-muted truncate">{inst.name}</p>
                </div>
                <div className="w-10 flex justify-center">
                  <Sparkline data={inst.sparkline} positive={inst.change >= 0} width={36} height={16} />
                </div>
                <div className="w-[62px] text-right">
                  <p className="text-[10px] font-extrabold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {inst.price >= 100 ? '₹' + inst.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '$' + inst.price.toFixed(4)}
                  </p>
                  <p className="text-[7px] text-text-muted font-medium">{inst.volume}</p>
                </div>
                <div className={cn('w-[50px] flex items-center gap-0.5 justify-end', inst.change >= 0 ? 'text-emerald-600' : 'text-red-500')}>
                  {inst.change >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                  <span className="text-[9px] font-extrabold tabular-nums">{formatPercent(inst.changePercent)}</span>
                </div>
              </button>
            </div>
          ))}

          {instruments.length === 0 && (
            <div className="py-8 text-center">
              {showWatchlistOnly ? (
                <><Star size={20} className="mx-auto text-text-muted/20 mb-1.5" /><p className="text-[10px] font-semibold text-text-muted">No favorites yet</p></>
              ) : (
                <><Search size={20} className="mx-auto text-text-muted/20 mb-1.5" /><p className="text-[10px] font-semibold text-text-muted">No instruments found</p></>
              )}
            </div>
          )}
        </div>

        {/* Open Positions preview */}
        {positions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-1 px-0.5">
              <h2 className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">Open Positions ({positions.length})</h2>
              <button onClick={() => navigate('/positions')} className="flex items-center gap-0.5 text-[9px] font-semibold text-primary">
                View All <ChevronRight size={10} />
              </button>
            </div>
            <div className="bg-white rounded-lg border border-border/20 overflow-hidden">
              {positions.slice(0, 3).map((pos, i) => (
                <div key={pos.id} className={cn('flex items-center justify-between px-2.5 py-1.5', i > 0 && 'border-t border-border/10')}>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-5 h-5 rounded-sm flex items-center justify-center text-[8px] font-extrabold',
                      pos.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500')}>
                      {pos.type === 'BUY' ? '▲' : '▼'}
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-text-primary">{pos.symbol}</p>
                      <p className="text-[8px] text-text-muted">Qty: {pos.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn('text-[10px] font-extrabold tabular-nums', pos.pnl >= 0 ? 'pnl-glow-profit' : 'pnl-glow-loss')} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                    </p>
                    <p className={cn('text-[8px] font-bold', pos.pnl >= 0 ? 'text-emerald-500/60' : 'text-red-500/60')}>
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
          <span className="text-[8px] font-medium text-text-muted">Market Open</span>
          <span className="text-[8px] text-text-muted/40 ml-auto">NSE · BSE</span>
        </div>
      </div>
    </div>
  );
}
