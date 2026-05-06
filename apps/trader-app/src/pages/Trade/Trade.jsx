import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Info,
  BarChart2,
  Minus,
  Plus,
  Check,
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

export default function Trade() {
  const {
    selectedInstrument,
    setSelectedInstrument,
    orderType,
    setOrderType,
    orderSide,
    setOrderSide,
    quantity,
    setQuantity,
  } = useTradeStore();
  const navigate = useNavigate();
  const [limitPrice, setLimitPrice] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTimeframe, setActiveTimeframe] = useState(3); // 1H default

  const instruments = useTradeStore(state => state.getAllInstruments());
  // Default to first instrument if none selected
  const instrument = selectedInstrument || (instruments.length > 0 ? instruments[0] : { symbol: 'LOADING', name: '', price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0 });

  const totalValue = quantity ? (Number(quantity) * instrument.price) : 0;
  const estimatedMargin = totalValue * 0.2; // 5x leverage

  const handleConfirmOrder = () => {
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setQuantity('');
    }, 2000);
  };

  const adjustQuantity = (delta) => {
    const current = Number(quantity) || 0;
    const newQty = Math.max(0, current + delta);
    setQuantity(newQty > 0 ? String(newQty) : '');
  };

  const currSymbol = instrument.price >= 100 ? '₹' : '$';
  const formatInstrumentPrice = (price) => {
    return price >= 100
      ? price.toLocaleString('en-IN', { minimumFractionDigits: 2 })
      : price.toFixed(4);
  };

  return (
    <div className="page-enter">
      {/* Compact Header */}
      <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center gap-2 px-3 py-2">
          <button
            onClick={() => navigate(-1)}
            className="p-1 rounded-lg hover:bg-surface transition-colors touch-active-subtle"
          >
            <ArrowLeft size={18} className="text-text-primary" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-text-primary">{instrument.symbol}</h1>
              <span className={cn(
                'flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded',
                instrument.change >= 0 ? 'text-emerald-600 bg-emerald-500/8' : 'text-red-500 bg-red-500/8'
              )}>
                {instrument.change >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                {formatPercent(instrument.changePercent)}
              </span>
            </div>
            <p className="text-[9px] text-text-muted truncate">{instrument.name}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-extrabold text-text-primary tabular-nums leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {currSymbol}{formatInstrumentPrice(instrument.price)}
            </p>
            <p className={cn(
              'text-[9px] font-semibold',
              instrument.change >= 0 ? 'text-emerald-500' : 'text-red-500'
            )}>
              {instrument.change >= 0 ? '+' : ''}{instrument.change >= 100 ? instrument.change.toFixed(2) : instrument.change.toFixed(4)}
            </p>
          </div>
        </div>
      </header>

      {/* Chart Area — Dominant (~55% viewport) */}
      <div className="relative bg-white border-b border-border/20">
        <div className="h-[55vh] min-h-[280px] max-h-[420px] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Mock chart background */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 300" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradBuy" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={orderSide === 'buy' ? '#10b981' : '#ef4444'} stopOpacity="0.08" />
                <stop offset="100%" stopColor={orderSide === 'buy' ? '#10b981' : '#ef4444'} stopOpacity="0" />
              </linearGradient>
              <linearGradient id="chartLine" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={instrument.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity="0.4" />
                <stop offset="100%" stopColor={instrument.change >= 0 ? '#10b981' : '#ef4444'} stopOpacity="1" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[60, 120, 180, 240].map(y => (
              <line key={y} x1="0" y1={y} x2="400" y2={y} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.5" />
            ))}
            {[80, 160, 240, 320].map(x => (
              <line key={x} x1={x} y1="0" x2={x} y2="300" stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="4,4" opacity="0.3" />
            ))}

            {/* Chart area fill */}
            <path
              d="M0,220 C20,215 40,210 60,200 C80,190 100,185 120,175 C140,165 160,170 180,160 C200,150 220,155 240,140 C260,125 280,130 300,115 C320,100 340,110 360,95 C380,80 390,85 400,70 L400,300 L0,300 Z"
              fill="url(#chartGradBuy)"
            />

            {/* Chart line */}
            <path
              d="M0,220 C20,215 40,210 60,200 C80,190 100,185 120,175 C140,165 160,170 180,160 C200,150 220,155 240,140 C260,125 280,130 300,115 C320,100 340,110 360,95 C380,80 390,85 400,70"
              fill="none"
              stroke="url(#chartLine)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* Current price dot */}
            <circle cx="400" cy="70" r="4" fill={instrument.change >= 0 ? '#10b981' : '#ef4444'} />
            <circle cx="400" cy="70" r="7" fill={instrument.change >= 0 ? '#10b981' : '#ef4444'} opacity="0.2">
              <animate attributeName="r" values="7;12;7" dur="2s" repeatCount="indefinite" />
              <animate attributeName="opacity" values="0.2;0;0.2" dur="2s" repeatCount="indefinite" />
            </circle>
          </svg>

          {/* Chart overlay content */}
          <div className="relative z-10 flex flex-col items-center">
            <BarChart2 size={32} className="text-text-muted/20 mb-1" />
            <p className="text-[11px] text-text-muted/40 font-medium">TradingView Chart</p>
          </div>

          {/* OHLC bar */}
          <div className="absolute top-3 left-3 flex gap-3">
            {[
              { label: 'O', value: instrument.low + (instrument.high - instrument.low) * 0.3 },
              { label: 'H', value: instrument.high, color: 'text-emerald-500' },
              { label: 'L', value: instrument.low, color: 'text-red-500' },
              { label: 'C', value: instrument.price },
            ].map(item => (
              <div key={item.label} className="text-[9px]">
                <span className="text-text-muted font-medium">{item.label}: </span>
                <span className={cn('font-bold tabular-nums', item.color || 'text-text-secondary')}>
                  {item.value >= 100 ? item.value.toFixed(2) : item.value.toFixed(4)}
                </span>
              </div>
            ))}
          </div>

          {/* Volume indicator */}
          <div className="absolute top-3 right-3 text-[9px]">
            <span className="text-text-muted font-medium">Vol: </span>
            <span className="font-bold text-text-secondary">{instrument.volume}</span>
          </div>

          {/* Time frame buttons */}
          <div className="absolute bottom-2 left-2 right-2 flex gap-1">
            {['1M', '5M', '15M', '1H', '4H', '1D', '1W'].map((tf, i) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(i)}
                className={cn(
                  'flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all',
                  i === activeTimeframe
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white/70 text-text-muted hover:bg-white hover:text-text-secondary'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Panel Below Chart */}
      <div className="px-3 space-y-2.5 py-3 pb-44">
        {/* Price Info Bar — compact */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: 'High', value: instrument.high, color: 'text-emerald-600' },
            { label: 'Low', value: instrument.low, color: 'text-red-500' },
            { label: 'Chg', value: instrument.change, color: instrument.change >= 0 ? 'text-emerald-600' : 'text-red-500' },
            { label: 'Vol', value: instrument.volume, color: 'text-text-primary' },
          ].map((item) => (
            <div key={item.label} className="bg-white rounded-lg p-2 border border-border/30">
              <p className="text-[8px] text-text-muted font-bold uppercase tracking-wider">{item.label}</p>
              <p className={cn('text-[11px] font-extrabold tabular-nums mt-0.5', item.color)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {typeof item.value === 'number'
                  ? (item.value >= 100 ? item.value.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : item.value.toFixed(4))
                  : item.value}
              </p>
            </div>
          ))}
        </div>

        {/* Buy/Sell Toggle — Large impact */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => setOrderSide('buy')}
            className={cn(
              'py-3.5 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-200 btn-ripple',
              orderSide === 'buy'
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-emerald-500/6 text-emerald-600 border border-emerald-200/50'
            )}
          >
            ▲ BUY
          </button>
          <button
            onClick={() => setOrderSide('sell')}
            className={cn(
              'py-3.5 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-200 btn-ripple',
              orderSide === 'sell'
                ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/25'
                : 'bg-red-500/6 text-red-500 border border-red-200/50'
            )}
          >
            ▼ SELL
          </button>
        </div>

        {/* Order Type */}
        <Tabs tabs={orderTypes} activeTab={orderType} onChange={setOrderType} compact />

        {/* Quantity with +/- */}
        <div className="space-y-1">
          <label className="block text-[10px] font-semibold text-text-muted uppercase tracking-wider">Quantity</label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => adjustQuantity(-1)}
              className="w-10 h-10 rounded-xl bg-white border border-border/50 flex items-center justify-center touch-active-subtle hover:bg-surface"
            >
              <Minus size={16} className="text-text-secondary" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="flex-1 bg-white border border-border/50 rounded-xl px-3 py-2.5 text-center text-sm font-bold text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
            <button
              onClick={() => adjustQuantity(1)}
              className="w-10 h-10 rounded-xl bg-white border border-border/50 flex items-center justify-center touch-active-subtle hover:bg-surface"
            >
              <Plus size={16} className="text-text-secondary" />
            </button>
          </div>
          {/* Quick quantity buttons */}
          <div className="flex gap-1 mt-1">
            {[1, 5, 10, 25, 50, 100].map(q => (
              <button
                key={q}
                onClick={() => setQuantity(String(q))}
                className={cn(
                  'flex-1 py-1 text-[10px] font-semibold rounded-lg transition-all',
                  Number(quantity) === q
                    ? 'bg-primary text-white'
                    : 'bg-surface text-text-muted hover:bg-surface-2'
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Limit / SL Price */}
        {orderType === 'limit' && (
          <Input
            label="Limit Price"
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="Enter limit price"
            prefix={currSymbol}
            compact
          />
        )}

        {orderType === 'stoploss' && (
          <Input
            label="Stop Loss Price"
            type="number"
            value={limitPrice}
            onChange={(e) => setLimitPrice(e.target.value)}
            placeholder="Enter stop loss price"
            prefix={currSymbol}
            compact
          />
        )}

        {/* Order Summary */}
        {quantity && Number(quantity) > 0 && (
          <div className="bg-white rounded-xl p-3 border border-border/30 space-y-1.5">
            <div className="flex items-center gap-1 mb-1">
              <Info size={11} className="text-text-muted" />
              <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Summary</span>
            </div>
            <div className="data-row py-1">
              <span className="data-label">Quantity × Price</span>
              <span className="text-xs font-bold text-text-primary tabular-nums">
                {quantity} × {currSymbol}{formatInstrumentPrice(instrument.price)}
              </span>
            </div>
            <div className="data-row py-1">
              <span className="data-label">Total Value</span>
              <span className="text-xs font-extrabold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatCurrency(totalValue)}
              </span>
            </div>
            <div className="data-row py-1 border-t border-border/30 pt-1.5">
              <span className="data-label">Margin Required (5x)</span>
              <span className="text-xs font-bold text-primary tabular-nums">
                {formatCurrency(estimatedMargin)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky-action-bar max-w-lg mx-auto">
        {showSuccess ? (
          <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" strokeWidth={3} />
            </div>
            <span className="text-sm font-bold text-emerald-600">Order Placed Successfully!</span>
          </div>
        ) : quantity && Number(quantity) > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] px-1">
              <span className="text-text-muted font-medium">
                {orderSide.toUpperCase()} {quantity} {instrument.symbol}
              </span>
              <span className="font-bold text-text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatCurrency(totalValue)}
              </span>
            </div>
            <SlideToConfirm
              onConfirm={handleConfirmOrder}
              label={`Slide to ${orderSide === 'buy' ? 'Buy' : 'Sell'} ${instrument.symbol}`}
              variant={orderSide === 'buy' ? 'success' : 'danger'}
            />
          </div>
        ) : (
          <Button
            fullWidth
            size="xl"
            variant={orderSide === 'buy' ? 'success' : 'danger'}
            disabled
            className="text-sm font-extrabold tracking-wide"
          >
            Enter Quantity to {orderSide === 'buy' ? 'Buy' : 'Sell'}
          </Button>
        )}
      </div>
    </div>
  );
}
