import { Search, TrendingUp, TrendingDown, Star, SlidersHorizontal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/layout/Header';
import Tabs from '../../components/ui/Tabs';
import Card from '../../components/ui/Card';
import Sparkline from '../../components/ui/Sparkline';
import { useTradeStore } from '../../store/useTradeStore';
import { formatPercent, cn } from '../../utils/helpers';

const marketTabs = [
  { key: 'stocks', label: 'Stocks' },
  { key: 'forex', label: 'Forex' },
  { key: 'metals', label: 'Metals' },
];

export default function Markets() {
  const {
    activeMarketTab,
    setActiveMarketTab,
    searchQuery,
    setSearchQuery,
    getFilteredInstruments,
    setSelectedInstrument,
    showWatchlistOnly,
    setShowWatchlistOnly,
    toggleFavorite,
  } = useTradeStore();
  const navigate = useNavigate();
  const instruments = getFilteredInstruments();

  const handleInstrumentClick = (instrument) => {
    setSelectedInstrument(instrument);
    navigate('/trade');
  };

  return (
    <div className="page-enter">
      <Header title="Markets" compact />

      <div className="px-3 space-y-2.5 pb-3">
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search instruments..."
            className="w-full bg-white border border-border/50 rounded-xl pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
          />
        </div>

        {/* Tabs + Watchlist toggle */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Tabs tabs={marketTabs} activeTab={activeMarketTab} onChange={setActiveMarketTab} compact />
          </div>
          <button
            onClick={() => setShowWatchlistOnly(!showWatchlistOnly)}
            className={cn(
              'p-2 rounded-xl border transition-all touch-active-subtle',
              showWatchlistOnly
                ? 'bg-amber-50 border-amber-200 text-amber-600'
                : 'bg-white border-border/50 text-text-muted'
            )}
          >
            <Star size={16} className={showWatchlistOnly ? 'fill-amber-500' : ''} strokeWidth={2} />
          </button>
        </div>

        {/* Market Stats */}
        <div className="flex items-center gap-2 px-0.5">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-dot" />
          <span className="text-base text-text-muted font-semibold">
            {instruments.length} instruments · Live
          </span>
          {showWatchlistOnly && (
            <span className="text-base font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded ml-1">
              ★ Watchlist
            </span>
          )}
        </div>

        {/* Instrument List */}
        <Card padding="p-0">
          {/* Table Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-surface/80 rounded-t-2xl border-b border-border/20">
            <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Symbol</span>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-text-muted uppercase tracking-wider w-[48px] text-center">Chart</span>
              <span className="text-sm font-bold text-text-muted uppercase tracking-wider">Price</span>
              <span className="text-sm font-bold text-text-muted uppercase tracking-wider w-[60px] text-right">Change</span>
            </div>
          </div>

          {/* Instruments */}
          <div className="divide-y divide-border/20">
            {instruments.map((instrument, i) => (
              <div
                key={instrument.symbol}
                className="flex items-center justify-between hover:bg-surface/30 active:bg-surface/60 transition-colors"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                {/* Favorite button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(instrument.symbol);
                  }}
                  className="pl-2 pr-0 py-3 touch-active-subtle"
                >
                  <Star
                    size={14}
                    className={cn(
                      'transition-all',
                      instrument.isFavorite
                        ? 'text-amber-400 fill-amber-400 star-pop'
                        : 'text-border hover:text-text-muted'
                    )}
                  />
                </button>

                {/* Main clickable area */}
                <button
                  onClick={() => handleInstrumentClick(instrument)}
                  className="flex-1 flex items-center justify-between pl-2 pr-3 py-2.5 touch-active-subtle"
                >
                  <div className="text-left min-w-0">
                    <p className="text-sm font-bold text-text-primary leading-tight">{instrument.symbol}</p>
                    <p className="text-sm text-text-muted mt-0.5 truncate max-w-[100px]">{instrument.name}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Mini Sparkline */}
                    <Sparkline
                      data={instrument.sparkline}
                      positive={instrument.change >= 0}
                      width={48}
                      height={24}
                    />

                    {/* Price + Volume */}
                    <div className="text-right min-w-[60px]">
                      <p className="text-sm font-extrabold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {instrument.price >= 100
                          ? '₹' + instrument.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })
                          : '$' + instrument.price.toFixed(4)}
                      </p>
                      <p className="text-sm text-text-muted mt-0.5 font-medium">
                        Vol: {instrument.volume}
                      </p>
                    </div>

                    {/* Change Badge */}
                    <div className={cn(
                      'flex items-center gap-0.5 px-1.5 py-1 rounded-lg min-w-[56px] justify-center',
                      instrument.change >= 0 ? 'bg-emerald-500/8' : 'bg-red-500/8'
                    )}>
                      {instrument.change >= 0 ? (
                        <TrendingUp size={10} className="text-emerald-500" />
                      ) : (
                        <TrendingDown size={10} className="text-red-500" />
                      )}
                      <span className={cn(
                        'text-base font-bold tabular-nums',
                        instrument.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {formatPercent(instrument.changePercent)}
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            ))}
          </div>

          {instruments.length === 0 && (
            <div className="py-10 text-center">
              {showWatchlistOnly ? (
                <>
                  <Star size={28} className="mx-auto text-text-muted/40 mb-2" />
                  <p className="text-sm font-medium text-text-muted">No favorites yet</p>
                  <p className="text-base text-text-muted/60 mt-0.5">Tap ★ to add instruments</p>
                </>
              ) : (
                <>
                  <Search size={28} className="mx-auto text-text-muted/40 mb-2" />
                  <p className="text-sm font-medium text-text-muted">No instruments found</p>
                  <p className="text-base text-text-muted/60 mt-0.5">Try a different search term</p>
                </>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
