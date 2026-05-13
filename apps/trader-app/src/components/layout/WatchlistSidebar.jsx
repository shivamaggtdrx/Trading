import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, X, Maximize2, Minimize2, GripVertical } from 'lucide-react';
import { useTradeStore } from '../../store/useTradeStore';
import { cn } from '../../utils/helpers';

const WATCHLIST_TABS = ['MW-1', 'MW-2', 'MW-3', 'MW-4', 'MW-5'];

export default function WatchlistSidebar({ isExpanded, onToggleExpand }) {
  const {
    instruments, setSelectedInstrument, toggleFavorite, isFavorite,
  } = useTradeStore();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('MW-1');
  const [sidebarSearch, setSidebarSearch] = useState('');

  // ═══ Resizable sidebar width ═══
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('tradex_sidebar_width');
    return saved ? Number(saved) : 280;
  });
  const isResizing = useRef(false);
  const sidebarRef = useRef(null);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (e) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(500, Math.max(200, startWidth + (e.clientX - startX)));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Persist width
      localStorage.setItem('tradex_sidebar_width', String(sidebarWidth));
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [sidebarWidth]);

  // Save width on change
  useEffect(() => {
    localStorage.setItem('tradex_sidebar_width', String(sidebarWidth));
  }, [sidebarWidth]);

  const filteredInstruments = useMemo(() => {
    const q = sidebarSearch.toLowerCase();
    let list = instruments;
    if (activeTab === 'MW-1') {
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

  const fmtPrice = (p) => {
    if (!p || p === 0) return '0.00';
    return p >= 100
      ? p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
      : p.toFixed(p < 1 ? 5 : 2);
  };

  // ═══ EXPANDED VIEW — Full market watch table ═══
  if (isExpanded) {
    return (
      <div className="hidden lg:flex flex-col flex-1 bg-surface h-[calc(100vh-84px)] overflow-hidden border-r border-border/40">
        {/* Top tabs */}
        <div className="border-b border-border/30 flex items-center">
          {WATCHLIST_TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-5 py-2.5 text-xs font-bold transition-colors uppercase tracking-wider',
                activeTab === tab
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-text-muted/60 hover:text-text-muted'
              )}
            >
              MARKETWATCH-{tab.split('-')[1]}
            </button>
          ))}

          {/* Right side — search + collapse */}
          <div className="ml-auto flex items-center gap-2 px-3">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted/60" />
              <input
                type="text"
                value={sidebarSearch}
                onChange={(e) => setSidebarSearch(e.target.value)}
                placeholder="Search symbols..."
                className="bg-surface-2 border border-border/30 rounded-md pl-7 pr-3 py-1.5 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/30 w-48"
              />
            </div>
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-md hover:bg-surface-2 transition-colors text-text-muted hover:text-text-primary"
              title="Collapse market watch"
            >
              <Minimize2 size={14} />
            </button>
          </div>
        </div>

        {/* Table Header */}
        <div className="flex items-center px-3 py-2 border-b border-border/30 bg-surface-2/50 text-[11px] font-bold text-text-muted uppercase tracking-wider select-none min-w-max">
          <span className="w-[180px] flex-shrink-0">Symbol</span>
          <span className="w-[90px] text-right flex-shrink-0">LTP</span>
          <span className="w-[80px] text-right flex-shrink-0">Change</span>
          <span className="w-[70px] text-right flex-shrink-0">%Chg</span>
          <span className="w-[90px] text-right flex-shrink-0">Volume</span>
          <span className="w-[80px] text-right flex-shrink-0">Open</span>
          <span className="w-[80px] text-right flex-shrink-0">Day High</span>
          <span className="w-[80px] text-right flex-shrink-0">Day Low</span>
          <span className="w-[90px] text-right flex-shrink-0">Prev Close</span>
          <span className="w-[80px] text-right flex-shrink-0">Best Bid</span>
          <span className="w-[60px] text-right flex-shrink-0">Bid Qty</span>
          <span className="w-[80px] text-right flex-shrink-0">Best Ask</span>
          <span className="w-[60px] text-right flex-shrink-0">Ask Qty</span>
          <span className="w-[70px] text-right flex-shrink-0">LTT</span>
        </div>

        {/* Table Body */}
        <div className="flex-1 overflow-y-auto overflow-x-auto scrollbar-hide">
          {filteredInstruments.map((inst) => {
            const isUp = (inst.change || 0) >= 0;
            const spread = inst.price < 100 ? 0.0003 : inst.price * 0.001;
            const bidPrice = inst.bid_price || (inst.price - spread);
            const askPrice = inst.ask_price || (inst.price + spread);
            const bidQty = Math.floor(Math.random() * 500) + 1;
            const askQty = Math.floor(Math.random() * 500) + 1;
            const now = new Date();
            const ltt = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

            return (
              <button
                key={inst.symbol}
                onClick={() => handleClick(inst)}
                className="w-full flex items-center px-3 py-2 text-left border-b border-border/10 hover:bg-surface-2/60 transition-colors min-w-max"
              >
                <div className="w-[180px] flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold text-text-primary">{inst.symbol}</span>
                    <span className="text-[9px] font-medium px-1 py-0.5 rounded bg-surface-2 text-text-muted/70 uppercase">
                      {inst.segment === 'nse_equity' ? 'NSE' : inst.segment === 'forex' ? 'FX' : inst.segment === 'mcx' ? 'CDS' : 'BSE'}
                    </span>
                  </div>
                  <p className="text-[10px] text-text-muted/60 truncate leading-tight">{inst.name}</p>
                </div>
                <span className={cn('w-[90px] text-right text-[12px] font-bold tabular-nums flex-shrink-0', isUp ? 'text-text-primary' : 'text-red-500')}
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {fmtPrice(inst.price)}
                </span>
                <span className={cn('w-[80px] text-right text-[11px] font-bold tabular-nums flex-shrink-0', isUp ? 'text-emerald-500' : 'text-red-500')}>
                  {isUp ? '+' : ''}{(inst.change || 0).toFixed(2)}
                </span>
                <span className={cn('w-[70px] text-right text-[11px] font-bold tabular-nums flex-shrink-0', isUp ? 'text-emerald-500' : 'text-red-500')}>
                  {isUp ? '+' : ''}{(inst.changePercent || 0).toFixed(2)}%
                </span>
                <span className="w-[90px] text-right text-[11px] text-text-muted tabular-nums flex-shrink-0">
                  {inst.volume || '0'}
                </span>
                <span className="w-[80px] text-right text-[11px] text-text-muted tabular-nums flex-shrink-0">
                  {fmtPrice(inst.open || 0)}
                </span>
                <span className="w-[80px] text-right text-[11px] text-text-muted tabular-nums flex-shrink-0">
                  {fmtPrice(inst.high || 0)}
                </span>
                <span className="w-[80px] text-right text-[11px] text-text-muted tabular-nums flex-shrink-0">
                  {fmtPrice(inst.low || 0)}
                </span>
                <span className="w-[90px] text-right text-[11px] text-text-muted tabular-nums flex-shrink-0">
                  {fmtPrice(inst.prevClose || 0)}
                </span>
                <span className="w-[80px] text-right text-[11px] text-emerald-500 font-medium tabular-nums flex-shrink-0">
                  {fmtPrice(bidPrice)}
                </span>
                <span className="w-[60px] text-right text-[11px] text-text-muted tabular-nums flex-shrink-0">
                  {bidQty}
                </span>
                <span className="w-[80px] text-right text-[11px] text-red-500 font-medium tabular-nums flex-shrink-0">
                  {fmtPrice(askPrice)}
                </span>
                <span className="w-[60px] text-right text-[11px] text-text-muted tabular-nums flex-shrink-0">
                  {askQty}
                </span>
                <span className="w-[70px] text-right text-[10px] text-text-muted/50 tabular-nums flex-shrink-0">
                  {ltt}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ═══ NORMAL COMPACT VIEW — Sidebar with resize handle ═══
  return (
    <aside
      ref={sidebarRef}
      className="hidden lg:flex flex-col border-r border-border/40 bg-surface h-[calc(100vh-84px)] overflow-hidden relative select-none"
      style={{ width: sidebarWidth, minWidth: 200, maxWidth: 500 }}
    >
      {/* Search + Expand */}
      <div className="px-2 pt-2 pb-1">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted/60" />
          <input
            type="text"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            placeholder="Search symbols..."
            className="w-full bg-surface-2 border border-border/30 rounded-md pl-7 pr-16 py-1.5 text-xs text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/30 transition-all"
          />
          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            {sidebarSearch && (
              <button onClick={() => setSidebarSearch('')} className="p-1 text-text-muted/50 hover:text-text-muted rounded">
                <X size={11} />
              </button>
            )}
            <button
              onClick={onToggleExpand}
              className="p-1 text-text-muted/50 hover:text-primary rounded hover:bg-primary/5 transition-colors"
              title="Expand to full market watch"
            >
              <Maximize2 size={12} />
            </button>
          </div>
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
                  <span className="text-[9px] font-medium text-text-muted/50 uppercase">
                    {inst.segment === 'nse_equity' ? '' : inst.segment === 'forex' ? '.fx' : ''}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-text-muted/60 truncate leading-tight">{inst.name}</p>
            </div>
            <div className="text-right ml-2 flex-shrink-0">
              <p className="text-[12px] font-bold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {fmtPrice(inst.price)}
              </p>
              <p className={cn(
                'text-[10px] font-bold tabular-nums',
                (inst.change || 0) >= 0 ? 'text-emerald-500' : 'text-red-500'
              )}>
                {(inst.change || 0) >= 0 ? '+' : ''}{(inst.change || 0).toFixed(2)}
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
        {WATCHLIST_TABS.slice(0, 3).map((tab) => (
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

      {/* ═══ Resize Handle ═══ */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-[5px] h-full cursor-col-resize z-10 group hover:bg-primary/20 transition-colors"
        title="Drag to resize"
      >
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-[5px] h-12 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical size={10} className="text-primary/60" />
        </div>
      </div>
    </aside>
  );
}
