import { useState, useRef, useEffect } from 'react';
import TradingViewChart from '../../components/ui/TradingViewChart';
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
  AlertTriangle,
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
  const selectedInstrument = useTradeStore(state => state.selectedInstrument);
  const setSelectedInstrument = useTradeStore(state => state.setSelectedInstrument);
  const orderType = useTradeStore(state => state.orderType);
  const setOrderType = useTradeStore(state => state.setOrderType);
  const orderSide = useTradeStore(state => state.orderSide);
  const setOrderSide = useTradeStore(state => state.setOrderSide);
  const quantity = useTradeStore(state => state.quantity);
  const setQuantity = useTradeStore(state => state.setQuantity);
  const placeOrder = useTradeStore(state => state.placeOrder);
  const orderLoading = useTradeStore(state => state.orderLoading);
  const debugStats = useTradeStore(state => state.debugStats);
  const updateSubscriptions = useTradeStore(state => state.updateSubscriptions);
  const navigate = useNavigate();
  const [limitPrice, setLimitPrice] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [activeTimeframe, setActiveTimeframe] = useState(3); // 1H default

  // Ensure we're subscribed to the selected instrument's price feed
  useEffect(() => {
    if (selectedInstrument?.symbol) {
      updateSubscriptions();
    }
  }, [selectedInstrument?.symbol]);

  const instrument = useTradeStore(state => {
    const inst = state.instruments.find(i => i.symbol === state.selectedInstrument?.symbol);
    if (inst) return inst;
    return state.selectedInstrument || state.instruments[0] || { symbol: 'LOADING', name: '', price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0 };
  });

  const totalValue = quantity ? (Number(quantity) * instrument.price) : 0;
  const estimatedMargin = totalValue * 0.2; // 5x leverage

  const handleConfirmOrder = async () => {
    setOrderError(null);
    const orderData = {
      symbol: instrument.symbol,
      side: orderSide,
      quantity: Number(quantity),
      order_type: orderType,
    };
    if (orderType === 'limit' && limitPrice) {
      orderData.price = Number(limitPrice);
    }
    if (orderType === 'stoploss' && limitPrice) {
      orderData.stop_price = Number(limitPrice);
    }

    const result = await placeOrder(orderData);
    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setQuantity('');
        setLimitPrice('');
      }, 2000);
    } else {
      setOrderError(result.error || 'Order failed');
      setTimeout(() => setOrderError(null), 4000);
    }
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
              <h1 className="text-base font-bold text-text-primary">{instrument.symbol}</h1>
              <span className={cn(
                'flex items-center gap-0.5 text-sm font-bold px-1.5 py-0.5 rounded',
                instrument.change >= 0 ? 'text-emerald-600 bg-emerald-500/8' : 'text-red-500 bg-red-500/8'
              )}>
                {instrument.change >= 0 ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
                {formatPercent(instrument.changePercent)}
              </span>
            </div>
            <p className="text-sm text-text-muted truncate">{instrument.name}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-extrabold text-text-primary tabular-nums leading-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {currSymbol}{formatInstrumentPrice(instrument.price)}
            </p>
            <p className={cn(
              'text-sm font-semibold',
              instrument.change >= 0 ? 'text-emerald-500' : 'text-red-500'
            )}>
              {instrument.change >= 0 ? '+' : ''}{instrument.change >= 100 ? instrument.change.toFixed(2) : instrument.change.toFixed(4)}
            </p>
          </div>
        </div>
      </header>

      {/* Chart Area — Dominant (~55% viewport) */}
      <div className="relative bg-surface border-b border-border/20" style={{ height: '45vh' }}>
          {/* Chart Area */}
          <div className="w-full h-full">
            <TradingViewChart
              symbol={instrument.symbol}
              timeframe={['1m', '5m', '15m', '1H', '4H', 'D', 'W'][activeTimeframe]}
              isDark={true}
            />
          </div>

          {/* OHLC + Bid/Ask/Spread bar */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-x-2 gap-y-1.5 z-10 pointer-events-none max-w-[80%]">
            {[
              { label: 'O', value: instrument.open || instrument.price },
              { label: 'H', value: instrument.high || instrument.price, color: 'text-emerald-400' },
              { label: 'L', value: instrument.low || instrument.price, color: 'text-red-400' },
              { label: 'C', value: instrument.price },
              { label: 'BID', value: instrument.bid_price, color: 'text-emerald-400' },
              { label: 'ASK', value: instrument.ask_price, color: 'text-red-400' },
              { label: 'SPREAD', value: instrument.spread, color: 'text-text-primary' },
            ].map(item => (
              <div key={item.label} className="text-[10px] bg-surface/80 dark:bg-surface-2/80 px-1.5 py-0.5 rounded backdrop-blur-sm">
                <span className="text-text-muted font-bold">{item.label}: </span>
                <span className={cn('font-bold tabular-nums', item.color || 'text-text-secondary')}>
                  {item.value !== undefined ? (item.value >= 100 ? item.value.toFixed(2) : item.value.toFixed(4)) : '-'}
                </span>
              </div>
            ))}
          </div>

          {/* Volume indicator */}
          <div className="absolute top-3 right-3 text-sm">
            <span className="text-text-muted font-medium">Vol: </span>
            <span className="font-bold text-text-secondary">{instrument.volume}</span>
          </div>

          {/* Time frame buttons */}
          <div className="absolute bottom-2 left-2 right-2 flex gap-1 z-10">
            {['1m', '5m', '15m', '1H', '4H', 'D', 'W'].map((tf, i) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(i)}
                className={cn(
                  'flex-1 py-1.5 text-sm font-bold rounded-lg transition-all',
                  i === activeTimeframe
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-2/80 text-text-muted hover:bg-surface-3 hover:text-text-secondary backdrop-blur-sm'
                )}
              >
                {tf}
              </button>
            ))}
          </div>
      </div>
      
      {/* Latency Debug Panel Overlay */}
      {debugStats && (
        <div className="absolute top-16 right-3 bg-black/80 backdrop-blur-md rounded border border-white/10 p-2 text-[10px] font-mono text-white/90 z-40 pointer-events-none shadow-lg">
          <div className="flex items-center gap-1.5 mb-1">
            <div className={cn("w-1.5 h-1.5 rounded-full", debugStats.connected ? "bg-emerald-500" : "bg-red-500 animate-pulse")} />
            <span className={cn("font-bold", debugStats.staleWarning && "text-red-500 animate-pulse")}>
              {debugStats.staleWarning ? 'STALE FEED' : `WS ${debugStats.connected ? 'LIVE' : 'DOWN'}`}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 opacity-80">
            <span>Latency:</span>
            <span className={cn("text-right", instrument._debug?.latencyMs > 500 ? "text-red-400" : "text-emerald-400")}>
              {instrument._debug?.latencyMs ?? 0}ms
            </span>
            <span>Subs:</span>
            <span className="text-right">{debugStats.subscriptions || 0}</span>
            <span>Tick/s:</span>
            <span className="text-right">{debugStats.packetsPerSec || 0}</span>
            <span>Reconnects:</span>
            <span className="text-right">{debugStats.reconnects || 0}</span>
          </div>
        </div>
      )}

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
            <div key={item.label} className="bg-surface rounded-lg p-2 border border-border/30">
              <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider">{item.label}</p>
              <p className={cn('text-base font-extrabold tabular-nums mt-0.5', item.color)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
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
              'py-3.5 rounded-xl text-base font-extrabold tracking-wide transition-all duration-200',
              orderSide === 'buy'
                ? 'bg-[#00b852] text-white shadow-lg shadow-emerald-500/20'
                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
            )}
          >
            ▲ BUY
          </button>
          <button
            onClick={() => setOrderSide('sell')}
            className={cn(
              'py-3.5 rounded-xl text-base font-extrabold tracking-wide transition-all duration-200',
              orderSide === 'sell'
                ? 'bg-[#ef4444] text-white shadow-lg shadow-red-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            )}
          >
            ▼ SELL
          </button>
        </div>

        {/* Order Type */}
        <Tabs tabs={orderTypes} activeTab={orderType} onChange={setOrderType} compact />

        {/* Quantity with +/- */}
        <div className="space-y-1">
          <label className="block text-base font-semibold text-text-muted uppercase tracking-wider">Quantity</label>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => adjustQuantity(-1)}
              className="w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center touch-active-subtle hover:bg-surface"
            >
              <Minus size={16} className="text-text-secondary" />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              className="flex-1 bg-surface border border-border/50 rounded-xl px-3 py-2.5 text-center text-base font-bold text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all tabular-nums"
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            />
            <button
              onClick={() => adjustQuantity(1)}
              className="w-10 h-10 rounded-xl bg-surface border border-border/50 flex items-center justify-center touch-active-subtle hover:bg-surface"
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
                  'flex-1 py-1 text-base font-semibold rounded-lg transition-all',
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
          <div className="bg-surface rounded-xl p-3 border border-border/30 space-y-1.5">
            <div className="flex items-center gap-1 mb-1">
              <Info size={11} className="text-text-muted" />
              <span className="text-base font-bold text-text-muted uppercase tracking-wider">Summary</span>
            </div>
            <div className="data-row py-1">
              <span className="data-label">Quantity × Price</span>
              <span className="text-sm font-bold text-text-primary tabular-nums">
                {quantity} × {currSymbol}{formatInstrumentPrice(instrument.price)}
              </span>
            </div>
            <div className="data-row py-1">
              <span className="data-label">Total Value</span>
              <span className="text-sm font-extrabold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatCurrency(totalValue)}
              </span>
            </div>
            <div className="data-row py-1 border-t border-border/30 pt-1.5">
              <span className="data-label">Margin Required (5x)</span>
              <span className="text-sm font-bold text-primary tabular-nums">
                {formatCurrency(estimatedMargin)}
              </span>
            </div>
          </div>
        )}

        {/* Order Error */}
        {orderError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-3 py-2.5 flex items-center gap-2">
            <AlertTriangle size={14} className="text-red-500 flex-shrink-0" />
            <span className="text-base font-semibold text-red-700">{orderError}</span>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar */}
      <div className="sticky-action-bar max-w-lg mx-auto" style={{ bottom: '64px' }}>
        {showSuccess ? (
          <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
              <Check size={14} className="text-white" strokeWidth={3} />
            </div>
            <span className="text-base font-bold text-emerald-600">Order Placed Successfully!</span>
          </div>
        ) : quantity && Number(quantity) > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-base px-1">
              <span className="text-text-muted font-medium">
                {orderSide.toUpperCase()} {quantity} {instrument.symbol}
              </span>
              <span className="font-bold text-text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatCurrency(totalValue)}
              </span>
            </div>
            <div className={cn(debugStats?.staleWarning ? 'opacity-50 pointer-events-none' : '')}>
              <SlideToConfirm
                onConfirm={handleConfirmOrder}
                label={`Slide to ${orderSide === 'buy' ? 'Buy' : 'Sell'} ${instrument.symbol}`}
                variant={orderSide === 'buy' ? 'success' : 'danger'}
              />
            </div>
          </div>
        ) : (
          <Button
            fullWidth
            size="xl"
            variant={orderSide === 'buy' ? 'success' : 'danger'}
            disabled
            className="text-base font-extrabold tracking-wide"
          >
            Enter Quantity to {orderSide === 'buy' ? 'Buy' : 'Sell'}
          </Button>
        )}
      </div>
    </div>
  );
}
