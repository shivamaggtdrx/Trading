import { useState, useMemo, useCallback, useRef } from 'react';
import { Search, Maximize2, Trash2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '../../store/useTradeStore';
import { cn } from '../../utils/helpers';
import ScriptActionSheet from '../../components/ui/ScriptActionSheet';
import SideDrawer from '../../components/ui/SideDrawer';
import InstrumentBrowser from '../../components/ui/InstrumentBrowser';

// Watchlist persistence
function getWatchlists() {
  try {
    return JSON.parse(localStorage.getItem('tradex_watchlists') || 'null') || {
      active: 'MW-1',
      lists: { 'MW-1': [], 'MW-2': [], 'MW-3': [], 'MW-4': [], 'MW-5': [] }
    };
  } catch { return { active: 'MW-1', lists: { 'MW-1': [], 'MW-2': [], 'MW-3': [], 'MW-4': [], 'MW-5': [] } }; }
}
function saveWatchlists(data) {
  localStorage.setItem('tradex_watchlists', JSON.stringify(data));
}

// ── Swipeable Row Component ──
function SwipeableRow({ children, onDelete }) {
  const rowRef = useRef(null);
  const startX = useRef(0);
  const isSwiping = useRef(false);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const THRESHOLD = 70;

  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    isSwiping.current = true;
  };
  const handleTouchMove = (e) => {
    if (!isSwiping.current) return;
    const diff = startX.current - e.touches[0].clientX;
    if (diff > 0) setSwipeOffset(Math.min(diff, 100));
    else setSwipeOffset(0);
  };
  const handleTouchEnd = () => {
    isSwiping.current = false;
    if (swipeOffset >= THRESHOLD) { setShowDelete(true); setSwipeOffset(THRESHOLD); }
    else { setSwipeOffset(0); setShowDelete(false); }
  };
  const handleDelete = () => { setSwipeOffset(0); setShowDelete(false); onDelete?.(); };
  const resetSwipe = () => { setSwipeOffset(0); setShowDelete(false); };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end bg-red-600 w-full">
        <button onClick={handleDelete} className="flex items-center justify-center w-[70px] h-full">
          <Trash2 size={20} className="text-white" />
        </button>
      </div>
      <div
        ref={rowRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={showDelete ? resetSwipe : undefined}
        style={{ transform: `translateX(-${swipeOffset}px)`, transition: isSwiping.current ? 'none' : 'transform 0.3s ease-out' }}
        className="relative bg-surface z-10"
      >
        {children}
      </div>
    </div>
  );
}

export default function Markets() {
  const { instruments, setSelectedInstrument, user, setOrderSide, updateSubscriptions } = useTradeStore();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [watchlistData, setWatchlistData] = useState(getWatchlists);
  const [actionInstrument, setActionInstrument] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showBrowser, setShowBrowser] = useState(false);

  const activeTab = watchlistData.active;
  const activeSymbols = watchlistData.lists[activeTab] || [];
  const nifty = instruments.find(i => i.symbol === 'NIFTY50');
  const bankNifty = instruments.find(i => i.symbol === 'BANKNIFTY');
  const userName = user?.name || user?.full_name || user?.email?.split('@')[0] || 'S';
  const userInitial = userName.charAt(0).toUpperCase();

  const displayInstruments = useMemo(() => {
    const query = searchQuery.toLowerCase();
    if (query) {
      return instruments.filter(i =>
        i.symbol.toLowerCase().includes(query) || i.name.toLowerCase().includes(query)
      ).slice(0, 20);
    }
    if (activeSymbols.length === 0) return [];
    return activeSymbols.map(sym => instruments.find(i => i.symbol === sym)).filter(Boolean);
  }, [instruments, searchQuery, activeSymbols]);

  const isInWatchlist = useCallback((symbol) => activeSymbols.includes(symbol), [activeSymbols]);

  const addToWatchlist = (symbol) => {
    const updated = { ...watchlistData };
    if (!updated.lists[activeTab].includes(symbol)) {
      updated.lists[activeTab] = [...updated.lists[activeTab], symbol];
      setWatchlistData(updated); saveWatchlists(updated);
      updateSubscriptions(); // Update WS subscriptions
    }
    setSearchQuery('');
  };
  const removeFromWatchlist = (symbol) => {
    const updated = { ...watchlistData };
    updated.lists[activeTab] = updated.lists[activeTab].filter(s => s !== symbol);
    setWatchlistData(updated); saveWatchlists(updated);
    updateSubscriptions(); // Update WS subscriptions
  };
  const switchTab = (tab) => {
    const updated = { ...watchlistData, active: tab };
    setWatchlistData(updated); saveWatchlists(updated);
    updateSubscriptions(); // Update WS subscriptions
  };

  const fmtPrice = (p) => {
    if (!p || p === 0) return '0.00';
    return p >= 100 ? p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : p.toFixed(p < 1 ? 5 : 3);
  };
  const fmtChange = (change, pct) => `${(change || 0).toFixed(2)} (${(pct || 0).toFixed(2)}%)`;

  const handleInstrumentTap = (inst) => setActionInstrument(inst);
  const handleBuy = (inst) => { setSelectedInstrument(inst); setOrderSide('buy'); navigate('/trade'); };
  const handleSell = (inst) => { setSelectedInstrument(inst); setOrderSide('sell'); navigate('/trade'); };
  const handleChart = (inst) => { setSelectedInstrument(inst); navigate('/charts'); };

  const tickerFmt = (data) => {
    if (!data) return { price: '0.00', change: '0.00', pct: '(0.00%)' };
    return {
      price: fmtPrice(data.price || data.last_price || 0),
      change: ((data.change || data.change_amount || 0)).toFixed(2),
      pct: `(${((data.changePercent || data.change_percent || 0)).toFixed(2)}%)`,
    };
  };
  const niftyData = tickerFmt(nifty);
  const bnData = tickerFmt(bankNifty);
  const niftyUp = (nifty?.change || 0) >= 0;
  const bnUp = (bankNifty?.change || 0) >= 0;

  return (
    <div className="flex flex-col h-full bg-surface min-h-screen">
      {/* ── Top Ticker Bar ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-surface-2 border-b border-border lg:hidden">
        <div className="flex items-center gap-1">
          <button onClick={() => setDrawerOpen(true)} className="w-7 h-7 rounded bg-surface-3 flex items-center justify-center mr-1">
            <span className="text-text-primary text-xs font-bold">≡</span>
          </button>
          {/* NIFTY 50 */}
          <div className="bg-surface-3 rounded-lg px-2.5 py-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-text-muted uppercase">NIFTY 50</span>
              <span className={cn('text-[10px] font-bold', niftyUp ? 'text-emerald-400' : 'text-red-400')}>{niftyData.change}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-text-primary tabular-nums">{niftyData.price}</span>
              <span className={cn('text-[9px]', niftyUp ? 'text-emerald-400' : 'text-red-400')}>{niftyData.pct}</span>
            </div>
          </div>
          {/* BANK NIFTY */}
          <div className="bg-surface-3 rounded-lg px-2.5 py-1">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-text-muted uppercase">NIFTY BANK</span>
              <span className={cn('text-[10px] font-bold', bnUp ? 'text-emerald-400' : 'text-red-400')}>{bnData.change}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[11px] font-bold text-text-primary tabular-nums">{bnData.price}</span>
              <span className={cn('text-[9px]', bnUp ? 'text-emerald-400' : 'text-red-400')}>{bnData.pct}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-cyan-500/20">
          {userInitial}
        </button>
      </div>

      {/* ── Search Bar ── */}
      <div className="px-3 pt-3 pb-2 bg-surface">
        <div className="relative flex items-center gap-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search symbols..."
              className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted/50 focus:outline-none focus:border-primary/50 transition-colors" />
          </div>
          <button className="p-2.5 bg-surface-2 border border-border rounded-lg text-text-muted hover:text-text-primary transition-colors">
            <Maximize2 size={16} />
          </button>
          <button
            onClick={() => setShowBrowser(true)}
            className="p-2.5 bg-primary/10 border border-primary/20 rounded-lg text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {/* ── Instrument List ── */}
      <div className="flex-1 overflow-y-auto pb-28">
        {searchQuery ? (
          displayInstruments.length > 0 ? (
            displayInstruments.map((inst) => {
              const change = inst.change || 0; const pct = inst.changePercent || 0; const isUp = change >= 0;
              return (
                <div key={inst.symbol} className="flex items-center justify-between px-4 py-3 border-b border-border/40 hover:bg-surface-2 transition-colors cursor-pointer"
                  onClick={() => isInWatchlist(inst.symbol) ? handleInstrumentTap(inst) : addToWatchlist(inst.symbol)}>
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-bold text-text-primary">{inst.symbol}</p>
                    <p className="text-[12px] text-text-muted truncate">{inst.name}</p>
                  </div>
                  <div className="text-right ml-3">
                    <p className="text-[14px] font-bold text-text-primary tabular-nums">{fmtPrice(inst.price)}</p>
                    <p className={cn('text-[12px] font-medium tabular-nums', isUp ? 'text-emerald-400' : 'text-red-400')}>{fmtChange(change, pct)}</p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-16 text-center"><Search size={32} className="mx-auto text-text-muted/30 mb-3" /><p className="text-sm text-text-muted">No instruments found</p></div>
          )
        ) : (
          displayInstruments.length > 0 ? (
            displayInstruments.map((inst) => {
              const change = inst.change || 0; const pct = inst.changePercent || 0; const isUp = change >= 0;
              return (
                <SwipeableRow key={inst.symbol} onDelete={() => removeFromWatchlist(inst.symbol)}>
                  <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 cursor-pointer active:bg-surface-2"
                    onClick={() => handleInstrumentTap(inst)}>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-text-primary">{inst.symbol}</p>
                      <p className="text-[12px] text-text-muted truncate">{inst.name}</p>
                    </div>
                    <div className="text-right ml-3">
                      <p className="text-[14px] font-bold text-text-primary tabular-nums">{fmtPrice(inst.price)}</p>
                      <p className={cn('text-[12px] font-medium tabular-nums', isUp ? 'text-emerald-400' : 'text-red-400')}>{fmtChange(change, pct)}</p>
                    </div>
                  </div>
                </SwipeableRow>
              );
            })
          ) : (
            <div className="py-16 text-center"><p className="text-sm text-text-muted mb-2">Watchlist is empty</p><p className="text-xs text-text-muted/60">Search for symbols to add them</p></div>
          )
        )}
      </div>

      {/* ── Bottom Watchlist Tabs ── */}
      <div className="fixed left-0 right-0 bg-surface border-t border-border z-30 max-w-lg mx-auto lg:hidden" style={{ bottom: '56px' }}>
        <div className="flex items-center px-1">
          <button className="p-2 text-text-muted"><span className="text-lg">‹</span></button>
          <div className="flex-1 flex items-center gap-0 overflow-x-auto scrollbar-hide">
            {Object.keys(watchlistData.lists).map((tab) => (
              <button key={tab} onClick={() => switchTab(tab)}
                className={cn('px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors relative', activeTab === tab ? 'text-blue-500' : 'text-text-muted hover:text-text-secondary')}>
                {tab}
                {activeTab === tab && <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-500 rounded-full" />}
              </button>
            ))}
          </div>
          <button className="p-2 text-text-muted"><span className="text-lg">›</span></button>
        </div>
      </div>

      {actionInstrument && (
        <ScriptActionSheet instrument={actionInstrument} onClose={() => setActionInstrument(null)}
          onBuy={handleBuy} onSell={handleSell} onChart={handleChart}
          onDelete={(inst) => removeFromWatchlist(inst.symbol)} />
      )}
      <SideDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* ── MT5-Style Instrument Browser ── */}
      {showBrowser && (
        <InstrumentBrowser
          instruments={instruments}
          activeSymbols={activeSymbols}
          onAdd={(symbol) => {
            addToWatchlist(symbol);
          }}
          onClose={() => setShowBrowser(false)}
        />
      )}
    </div>
  );
}
