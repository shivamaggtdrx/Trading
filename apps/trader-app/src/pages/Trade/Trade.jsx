import { useState, useRef, useEffect } from 'react';
import { AdvancedRealTimeChart } from 'react-ts-tradingview-widgets';
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
  const {
    selectedInstrument,
    setSelectedInstrument,
    orderType,
    setOrderType,
    orderSide,
    setOrderSide,
    quantity,
    setQuantity,
    placeOrder,
    orderLoading,
  } = useTradeStore();
  const navigate = useNavigate();
  const [limitPrice, setLimitPrice] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [orderError, setOrderError] = useState(null);
  const [activeTimeframe, setActiveTimeframe] = useState(3); // 1H default

  const instruments = useTradeStore(state => state.getAllInstruments());
  // Default to first instrument if none selected
  const instrument = selectedInstrument || (instruments.length > 0 ? instruments[0] : { symbol: 'LOADING', name: '', price: 0, change: 0, changePercent: 0, high: 0, low: 0, volume: 0 });

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
      <div className="relative bg-surface border-b border-border/20">
          {/* Chart Area */}
          <div className="flex-1 relative overflow-hidden bg-[#f8fafc] w-full h-full">
            <AdvancedRealTimeChart
              symbol={instrument.symbol}
              theme="light"
              autosize
              hide_top_toolbar
              hide_legend
              save_image={false}
              toolbar_bg="#f8fafc"
              allow_symbol_change={false}
            />
          </div>

          {/* OHLC bar */}
          <div className="absolute top-3 left-3 flex gap-3">
            {[
              { label: 'O', value: instrument.low + (instrument.high - instrument.low) * 0.3 },
              { label: 'H', value: instrument.high, color: 'text-emerald-500' },
              { label: 'L', value: instrument.low, color: 'text-red-500' },
              { label: 'C', value: instrument.price },
            ].map(item => (
              <div key={item.label} className="text-sm">
                <span className="text-text-muted font-medium">{item.label}: </span>
                <span className={cn('font-bold tabular-nums', item.color || 'text-text-secondary')}>
                  {item.value >= 100 ? item.value.toFixed(2) : item.value.toFixed(4)}
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
          <div className="absolute bottom-2 left-2 right-2 flex gap-1">
            {['1M', '5M', '15M', '1H', '4H', '1D', '1W'].map((tf, i) => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(i)}
                className={cn(
                  'flex-1 py-1.5 text-sm font-bold rounded-lg transition-all',
                  i === activeTimeframe
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white/70 text-text-muted hover:bg-surface hover:text-text-secondary'
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
                ? 'bg-[#00b852] text-white'
                : 'bg-[#f0fdf4] text-[#00b852] border border-[#dcfce7]'
            )}
          >
            ▲ BUY
          </button>
          <button
            onClick={() => setOrderSide('sell')}
            className={cn(
              'py-3.5 rounded-xl text-base font-extrabold tracking-wide transition-all duration-200',
              orderSide === 'sell'
                ? 'bg-[#ef4444] text-white'
                : 'bg-[#fef2f2] text-[#ef4444] border border-[#fee2e2]'
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
            className="text-base font-extrabold tracking-wide"
          >
            Enter Quantity to {orderSide === 'buy' ? 'Buy' : 'Sell'}
          </Button>
        )}
      </div>
    </div>
  );
}
