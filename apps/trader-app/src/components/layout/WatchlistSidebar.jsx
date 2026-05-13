import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, TrendingUp, TrendingDown, Maximize2, X } from 'lucide-react';
import { useTradeStore } from '../../store/useTradeStore';
import { cn, formatPercent } from '../../utils/helpers';
import Sparkline from '../ui/Sparkline';

const WATCHLIST_TABS = ['MW-1', 'MW-2', 'MW-3'];

export default function WatchlistSidebar({ collapsed, onToggle }) {
  const {
    instruments, searchQuery, setSearchQuery,
    setSelectedInstrument, toggleFavorite, isFavorite,
  } = useTradeStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('MW-1');
  const [sidebarSearch, setSidebarSearch] = useState('');

  const filteredInstruments = useMemo(() => {
    const q = sidebarSearch.toLowerCase();
    let list = instruments;
    if (activeTab === 'MW-1') {
      // Show favorites first, then all
      const favs = instruments.filter(i => isFavorite(i.symbol));
      if (favs.length > 0) list = favs;
    }
    if (!q) return list;
    return list.filter(i =>
      i.symbol.toLowerCase().includes(q) || i.name.toLowerCase().includes(q)
    );
  }, [instruments, sidebarSearch, activeTab]);

  const handleClick = (inst) => {
    setSelectedInstrument(inst);
    navigate('/charts');
  };

  if (collapsed) return null;

  return (
    <aside className="hidden lg:flex flex-col w-[260px] min-w-[260px] border-r border-border/40 bg-surface h-[calc(100vh-84px)] overflow-hidden">
      {/* Search */}
      <div className="px-2 pt-2 pb-1">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted/60" />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder="Search symbols..."
            className="w-full bg-surface-2 border border-border/30 rounded-md pl-7 pr-8 py-1.5 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
          {sidebarSearch && (
            <button onClick={() => setSidebarSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted/50 hover:text-text-muted">
              <X size={12} />
            </button>
          )}
          <button className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted/40 hover:text-text-muted" title="Expand">
            <Maximize2 size={11} />
          </button>
        </div>
      </div>

      {/* Instrument List */}
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {filteredInstruments.map((inst) => (
          <button
            key={inst.symbol}
            onClick={() => handleClick(inst)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-[7px] text-left transition-colors group',
              'hover:bg-surface-2/80 border-b border-border/10'
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <span className="text-[12px] font-bold text-text-primary truncate">{inst.symbol}</span>
                {inst.segment && (
                  <span className="text-[9px] font-medium text-text-muted/50 uppercase">{inst.segment === 'nse_equity' ? '' : inst.segment === 'forex' ? '.fx' : ''}</span>
                )}
              </div>
              <p className="text-[10px] text-text-muted/60 truncate leading-tight">{inst.name}</p>
            </div>
            <div className="text-right ml-2 flex-shrink-0">
              <p className="text-[12px] font-bold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {inst.price >= 100 ? inst.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : inst.price.toFixed(inst.price < 1 ? 5 : 2)}
              </p>
              <p className={cn(
                'text-[10px] font-bold tabular-nums',
                inst.change >= 0 ? 'text-emerald-500' : 'text-red-500'
              )}>
                {inst.change >= 0 ? '+' : ''}{inst.change?.toFixed(2) || '0.00'}
              </p>
            </div>
          </button>
        ))}
        {filteredInstruments.length === 0 && (
          <div className="py-8 text-center">
            <Search size={16} className="mx-auto text-text-muted/30 mb-1" />
            <p className="text-[11px] text-text-muted">No instruments found</p>
          </div>
        )}
      </div>

      {/* Bottom Tabs */}
      <div className="border-t border-border/30 flex items-center">
        {WATCHLIST_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              'flex-1 py-2 text-[11px] font-bold transition-colors text-center',
              activeTab === tab
                ? 'text-primary border-t-2 border-primary bg-surface-2/50'
                : 'text-text-muted/60 hover:text-text-muted'
            )}
          >
            {tab}
          </button>
        ))}
        <button className="px-3 py-2 text-text-muted/40 hover:text-text-muted text-[11px]">
          ƒx
        </button>
        <button className="px-2 py-2 text-text-muted/40 hover:text-text-muted text-[11px]">
          &gt;
        </button>
      </div>
    </aside>
  );
}
