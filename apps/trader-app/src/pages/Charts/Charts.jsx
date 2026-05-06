import { useState, useEffect, useRef } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Info,
  BarChart2,
  Minus,
  Plus,
  Check,
  ChevronDown,
  Zap,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Tabs from '../../components/ui/Tabs';
import SlideToConfirm from '../../components/ui/SlideToConfirm';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, formatPercent, cn } from '../../utils/helpers';


const orderTypes = [
  { key: 'market', label: 'Market' },
  { key: 'limit', label: 'Limit' },
  { key: 'stoploss', label: 'SL' },
];

// Generate mock order book data
function generateOrderBook(price, isForex) {
  const spread = isForex ? 0.0003 : price * 0.001;
  const bids = [], asks = [];
  for (let i = 0; i < 5; i++) {
    const bidP = price - spread * (i + 1);
    const askP = price + spread * (i + 1);
    const bidVol = Math.floor(50 + Math.random() * 200);
    const askVol = Math.floor(50 + Math.random() * 200);
    bids.push({ price: bidP, vol: bidVol });
    asks.push({ price: askP, vol: askVol });
  }
  return { bids, asks };
}

export default function Charts() {
  const {
    selectedInstrument, setSelectedInstrument,
    orderType, setOrderType,
    orderSide, setOrderSide,
    quantity, setQuantity,
    getAllInstruments,
  } = useTradeStore();
  const [limitPrice, setLimitPrice] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState(3);
  const [showPicker, setShowPicker] = useState(false);
  const [pricePulse, setPricePulse] = useState(null);
  const pulseTimer = useRef(null);

  const allInstruments = getAllInstruments();
  const instrument = selectedInstrument || (allInstruments.length > 0 ? allInstruments[0] : { symbol: 'LOADING', name: '', price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0 });
  const isForex = instrument.price < 100;
  const orderBook = generateOrderBook(instrument.price, isForex);
  const maxVol = Math.max(...orderBook.bids.map(b => b.vol), ...orderBook.asks.map(a => a.vol));

  const totalValue = quantity ? (Number(quantity) * instrument.price) : 0;
  const estimatedMargin = totalValue * 0.2;

  // Simulate price pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setPricePulse(Math.random() > 0.5 ? 'green' : 'red');
      clearTimeout(pulseTimer.current);
      pulseTimer.current = setTimeout(() => setPricePulse(null), 1000);
    }, 4000);
    return () => { clearInterval(interval); clearTimeout(pulseTimer.current); };
  }, []);

  const handleConfirmOrder = () => {
    setShowSuccess(true);
    setTimeout(() => { setShowSuccess(false); setQuantity(''); }, 2500);
  };

  const adjustQuantity = (delta) => {
    const current = Number(quantity) || 0;
    const newQty = Math.max(0, current + delta);
    setQuantity(newQty > 0 ? String(newQty) : '');
  };

  const currSymbol = isForex ? '$' : '₹';
  const fmtPrice = (p) => p >= 100 ? p.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : p.toFixed(4);

  return (
    <div className="page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
          <button onClick={() => setShowPicker(!showPicker)} className="flex items-center gap-1 p-1 rounded-md hover:bg-surface transition-colors touch-active-subtle">
            <h1 className="text-sm font-extrabold text-text-primary">{instrument.symbol}</h1>
            <ChevronDown size={14} className="text-text-muted" />
          </button>
          <span className={cn('flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-md', instrument.change >= 0 ? 'text-emerald-600 bg-emerald-500/8' : 'text-red-500 bg-red-500/8')}>
            {instrument.change >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
            {formatPercent(instrument.changePercent)}
          </span>
          <p className="text-[9px] text-text-muted truncate flex-1">{instrument.name}</p>
          <div className={cn('text-right px-1.5 py-0.5 rounded-md transition-all', pricePulse === 'green' && 'price-pulse-green', pricePulse === 'red' && 'price-pulse-red')}>
            <p className="text-sm font-extrabold text-text-primary tabular-nums leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {currSymbol}{fmtPrice(instrument.price)}
            </p>
            <p className={cn('text-[9px] font-bold', instrument.change >= 0 ? 'text-emerald-500' : 'text-red-500')}>
              {instrument.change >= 0 ? '+' : ''}{instrument.change >= 100 ? instrument.change.toFixed(2) : instrument.change.toFixed(4)}
            </p>
          </div>
        </div>
        {showPicker && (
          <div className="absolute top-full left-0 right-0 bg-white border-b border-border/30 shadow-lg max-h-48 overflow-y-auto z-50">
            {allInstruments.map((inst) => (
              <button key={inst.symbol} onClick={() => { setSelectedInstrument(inst); setShowPicker(false); }}
                className={cn('w-full flex items-center justify-between px-4 py-2 text-left hover:bg-surface/50 transition-colors', inst.symbol === instrument.symbol && 'bg-primary/5')}>
                <div>
                  <span className="text-[11px] font-bold text-text-primary">{inst.symbol}</span>
                  <span className="text-[9px] text-text-muted ml-2">{inst.name}</span>
                </div>
                <span className={cn('text-[10px] font-extrabold tabular-nums', inst.change >= 0 ? 'text-emerald-500' : 'text-red-500')}>
                  {formatPercent(inst.changePercent)}
                </span>
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Chart + Order Book side by side */}
      <div className="relative bg-white border-b border-border/20">
        <div className="flex" style={{ height: '52vh', minHeight: '260px', maxHeight: '400px' }}>
          {/* Chart Area */}
          <div className="flex-1 relative overflow-hidden">
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={instrument.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.08" />
                  <stop offset="100%" stopColor={instrument.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0" />
                </linearGradient>
                <linearGradient id="cl" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={instrument.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.3" />
                  <stop offset="100%" stopColor={instrument.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity="1" />
                </linearGradient>
              </defs>
              {[50,100,150,200,250].map(y => <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.4" />)}
              {[50,100,150,200,250,300,350].map(x => <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3,3" opacity="0.2" />)}
              <path d="M0,220 C20,215 40,210 60,200 C80,190 100,185 120,175 C140,165 160,170 180,160 C200,150 220,155 240,140 C260,125 280,130 300,115 C320,100 340,110 360,95 C380,80 390,85 400,70 L400,300 L0,300 Z" fill="url(#cg)" />
              <path d="M0,220 C20,215 40,210 60,200 C80,190 100,185 120,175 C140,165 160,170 180,160 C200,150 220,155 240,140 C260,125 280,130 300,115 C320,100 340,110 360,95 C380,80 390,85 400,70" fill="none" stroke="url(#cl)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="400" cy="70" r="3" fill={instrument.change >= 0 ? '#10b981' : '#ef4444'} />
              <circle cx="400" cy="70" r="7" fill={instrument.change >= 0 ? '#10b981' : '#ef4444'} opacity="0.12">
                <animate attributeName="r" values="7;11;7" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.12;0;0.12" dur="2s" repeatCount="indefinite" />
              </circle>
              <line x1="0" y1="70" x2="395" y2="70" stroke={instrument.change >= 0 ? '#10b981' : '#ef4444'} strokeWidth="0.5" strokeDasharray="4,3" opacity="0.35" />
            </svg>
            <div className="relative z-10 flex flex-col items-center justify-center h-full">
              <BarChart2 size={24} className="text-text-muted/10 mb-1" />
              <p className="text-[9px] text-text-muted/25 font-medium">TradingView Chart</p>
            </div>
            {/* OHLC overlay */}
            <div className="absolute top-2 left-2 flex gap-2">
              {[
                { l: 'O', v: instrument.low + (instrument.high - instrument.low) * 0.3 },
                { l: 'H', v: instrument.high, c: 'text-emerald-500' },
                { l: 'L', v: instrument.low, c: 'text-red-500' },
                { l: 'C', v: instrument.price },
              ].map(i => (
                <div key={i.l} className="text-[7px]">
                  <span className="text-text-muted/60 font-medium">{i.l} </span>
                  <span className={cn('font-bold tabular-nums', i.c || 'text-text-secondary')}>{i.v >= 100 ? i.v.toFixed(2) : i.v.toFixed(4)}</span>
                </div>
              ))}
              <div className="text-[7px]">
                <span className="text-text-muted/60 font-medium">V </span>
                <span className="font-bold text-text-secondary">{instrument.volume}</span>
              </div>
            </div>
            {/* Timeframes */}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex gap-0.5">
              {['1M','5M','15M','1H','4H','1D','1W'].map((tf, i) => (
                <button key={tf} onClick={() => setActiveTimeframe(i)}
                  className={cn('flex-1 py-1 text-[7px] font-bold rounded-sm transition-all', i === activeTimeframe ? 'bg-primary text-white' : 'bg-white/60 text-text-muted hover:text-text-secondary')}>
                  {tf}
                </button>
              ))}
            </div>
          </div>

          {/* Order Book sidebar */}
          <div className="w-[100px] border-l border-border/20 flex flex-col text-[8px] bg-surface/30">
            <div className="px-1.5 py-1 border-b border-border/20 text-[7px] font-bold text-text-muted uppercase tracking-wider text-center">
              Order Book
            </div>
            {/* Asks (reversed) */}
            <div className="flex-1 flex flex-col justify-end px-1 overflow-hidden">
              {[...orderBook.asks].reverse().map((ask, i) => (
                <div key={`a${i}`} className="orderbook-row justify-between">
                  <div className="orderbook-bar orderbook-bar-ask" style={{ width: `${(ask.vol / maxVol) * 100}%` }} />
                  <span className="text-red-500 relative z-10">{fmtPrice(ask.price)}</span>
                  <span className="text-text-muted/60 relative z-10">{ask.vol}</span>
                </div>
              ))}
            </div>
            {/* Spread / current price */}
            <div className={cn('px-1.5 py-1 text-center border-y border-border/20', pricePulse === 'green' && 'price-pulse-green', pricePulse === 'red' && 'price-pulse-red')}>
              <p className={cn('text-[10px] font-extrabold tabular-nums', instrument.change >= 0 ? 'text-emerald-600' : 'text-red-500')} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {currSymbol}{fmtPrice(instrument.price)}
              </p>
              <p className="text-[6px] text-text-muted font-medium mt-0.5">
                Spread: {isForex ? '0.3 pips' : `₹${(instrument.price * 0.002).toFixed(2)}`}
              </p>
            </div>
            {/* Bids */}
            <div className="flex-1 flex flex-col px-1 overflow-hidden">
              {orderBook.bids.map((bid, i) => (
                <div key={`b${i}`} className="orderbook-row justify-between">
                  <div className="orderbook-bar orderbook-bar-bid" style={{ width: `${(bid.vol / maxVol) * 100}%` }} />
                  <span className="text-emerald-600 relative z-10">{fmtPrice(bid.price)}</span>
                  <span className="text-text-muted/60 relative z-10">{bid.vol}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Trading Panel */}
      <div className="px-3 space-y-2 py-2 pb-44">
        {/* Price bar */}
        <div className="grid grid-cols-4 gap-1">
          {[
            { label: 'High', value: instrument.high, color: 'text-emerald-600' },
            { label: 'Low', value: instrument.low, color: 'text-red-500' },
            { label: 'Chg', value: instrument.change, color: instrument.change >= 0 ? 'text-emerald-600' : 'text-red-500' },
            { label: 'Vol', value: instrument.volume, color: 'text-text-primary' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-md p-1.5 border border-border/20">
              <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">{item.label}</p>
              <p className={cn('text-[10px] font-extrabold tabular-nums mt-0.5', item.color)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {typeof item.value === 'number' ? (item.value >= 100 ? item.value.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : item.value.toFixed(4)) : item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Buy/Sell with live price */}
        <div className="grid grid-cols-2 gap-1.5">
          <button onClick={() => setOrderSide('buy')}
            className={cn('relative py-3 rounded-lg text-sm font-extrabold tracking-wide transition-all duration-200 btn-ripple',
              orderSide === 'buy' ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white buy-active-glow' : 'bg-emerald-500/6 text-emerald-600 border border-emerald-200/50')}>
            <span className="relative z-10">▲ BUY</span>
            {orderSide === 'buy' && <span className="block text-[9px] font-bold opacity-80 mt-0.5 relative z-10">{currSymbol}{fmtPrice(orderBook.asks[0].price)}</span>}
          </button>
          <button onClick={() => setOrderSide('sell')}
            className={cn('relative py-3 rounded-lg text-sm font-extrabold tracking-wide transition-all duration-200 btn-ripple',
              orderSide === 'sell' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white sell-active-glow' : 'bg-red-500/6 text-red-500 border border-red-200/50')}>
            <span className="relative z-10">▼ SELL</span>
            {orderSide === 'sell' && <span className="block text-[9px] font-bold opacity-80 mt-0.5 relative z-10">{currSymbol}{fmtPrice(orderBook.bids[0].price)}</span>}
          </button>
        </div>

        <Tabs tabs={orderTypes} activeTab={orderType} onChange={setOrderType} compact />

        {/* Quantity */}
        <div className="space-y-1">
          <label className="block text-[9px] font-bold text-text-muted uppercase tracking-wider">Quantity</label>
          <div className="flex items-center gap-1">
            <button onClick={() => adjustQuantity(-1)} className="w-9 h-9 rounded-lg bg-white border border-border/40 flex items-center justify-center touch-active-subtle"><Minus size={14} className="text-text-secondary" /></button>
            <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="0"
              className="flex-1 bg-white border border-border/40 rounded-lg px-3 py-2 text-center text-sm font-extrabold text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }} />
            <button onClick={() => adjustQuantity(1)} className="w-9 h-9 rounded-lg bg-white border border-border/40 flex items-center justify-center touch-active-subtle"><Plus size={14} className="text-text-secondary" /></button>
          </div>
          <div className="flex gap-0.5 mt-0.5">
            {[1, 5, 10, 25, 50, 100].map(q => (
              <button key={q} onClick={() => setQuantity(String(q))}
                className={cn('flex-1 py-1 text-[9px] font-bold rounded-md transition-all', Number(quantity) === q ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-surface-2')}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {orderType === 'limit' && <Input label="Limit Price" type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder="Limit price" prefix={currSymbol} compact />}
        {orderType === 'stoploss' && <Input label="Stop Loss" type="number" value={limitPrice} onChange={(e) => setLimitPrice(e.target.value)} placeholder="Stop loss price" prefix={currSymbol} compact />}

        {/* Summary */}
        {quantity && Number(quantity) > 0 && (
          <div className="bg-white rounded-lg p-2.5 border border-border/20 space-y-1">
            <div className="flex items-center gap-1 mb-0.5">
              <Info size={10} className="text-text-muted" />
              <span className="text-[9px] font-bold text-text-muted uppercase tracking-wider">Summary</span>
            </div>
            <div className="data-row py-0.5"><span className="data-label text-[10px]">Qty × Price</span><span className="text-[11px] font-bold text-text-primary tabular-nums">{quantity} × {currSymbol}{fmtPrice(instrument.price)}</span></div>
            <div className="data-row py-0.5"><span className="data-label text-[10px]">Total</span><span className="text-[11px] font-extrabold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(totalValue)}</span></div>
            <div className="data-row py-0.5 border-t border-border/20 pt-1"><span className="data-label text-[10px]">Margin (5x)</span><span className="text-[11px] font-bold text-primary tabular-nums">{formatCurrency(estimatedMargin)}</span></div>
          </div>
        )}
      </div>

      {/* Sticky Bottom */}
      <div className="sticky-action-bar max-w-lg mx-auto">
        {showSuccess ? (
          <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-lg border border-emerald-200 order-success-burst">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white check-draw" strokeWidth={3} />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-600">Order Placed!</span>
              <p className="text-[9px] text-emerald-500 font-medium">{orderSide.toUpperCase()} {quantity} {instrument.symbol} @ {currSymbol}{fmtPrice(instrument.price)}</p>
            </div>
          </div>
        ) : quantity && Number(quantity) > 0 ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[10px] px-0.5">
              <span className="text-text-muted font-semibold flex items-center gap-1">
                <Zap size={10} className={orderSide === 'buy' ? 'text-emerald-500' : 'text-red-500'} />
                {orderSide.toUpperCase()} {quantity} {instrument.symbol}
              </span>
              <span className="font-extrabold text-text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(totalValue)}</span>
            </div>
            <SlideToConfirm onConfirm={handleConfirmOrder} label={`Slide to ${orderSide === 'buy' ? 'Buy' : 'Sell'} ${instrument.symbol}`} variant={orderSide === 'buy' ? 'success' : 'danger'} />
          </div>
        ) : (
          <Button fullWidth size="lg" variant={orderSide === 'buy' ? 'success' : 'danger'} disabled className="text-xs font-extrabold tracking-wide">
            Enter Quantity to {orderSide === 'buy' ? 'Buy' : 'Sell'}
          </Button>
        )}
      </div>
    </div>
  );
}
