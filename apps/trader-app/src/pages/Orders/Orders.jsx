import { useState } from 'react';
import {
  Clock, CheckCircle2, XCircle, X, Calendar, ClipboardList, Zap,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Tabs from '../../components/ui/Tabs';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, cn } from '../../utils/helpers';

const orderTabs = [
  { key: 'open', label: 'Open' },
  { key: 'filled', label: 'Filled' },
  { key: 'cancelled', label: 'Cancelled' },
];

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-500/8', border: 'border-l-amber-500' },
  filled: { icon: CheckCircle2, label: 'Filled', color: 'text-emerald-600', bg: 'bg-emerald-500/8', border: 'border-l-emerald-500' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-text-muted', bg: 'bg-surface', border: 'border-l-border' },
};

export default function Orders() {
  const { activeOrderTab, setActiveOrderTab, getFilteredOrders, cancelOrder, orders } = useTradeStore();
  const [cancellingId, setCancellingId] = useState(null);

  const filteredOrders = getFilteredOrders();
  const openCount = orders.filter((o) => o.status === 'pending').length;
  const filledCount = orders.filter((o) => o.status === 'filled').length;
  const cancelledCount = orders.filter((o) => o.status === 'cancelled').length;

  const handleCancelOrder = () => { if (cancellingId) { cancelOrder(cancellingId); setCancellingId(null); } };

  const fmtPrice = (price) => price >= 100 ? '₹' + price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '$' + price.toFixed(4);
  const fmtTime = (ts) => {
    if (!ts) return '—';
    return new Date(ts).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
  };

  return (
    <div className="page-enter">
      <Header title="Orders" compact />

      <div className="px-3 pb-3">
        {/* Summary row — flat, no cards */}
        <div className="grid grid-cols-3 gap-1 mb-2">
          <button onClick={() => setActiveOrderTab('open')}
            className={cn('bg-white rounded-md p-2 border text-left transition-all', activeOrderTab === 'open' ? 'border-amber-300 ring-1 ring-amber-200/50' : 'border-border/20')}>
            <div className="flex items-center gap-1 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Open</p>
            </div>
            <p className={cn('text-lg font-extrabold tabular-nums', openCount > 0 ? 'text-amber-600' : 'text-text-primary')} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{openCount}</p>
          </button>
          <button onClick={() => setActiveOrderTab('filled')}
            className={cn('bg-white rounded-md p-2 border text-left transition-all', activeOrderTab === 'filled' ? 'border-emerald-300 ring-1 ring-emerald-200/50' : 'border-border/20')}>
            <div className="flex items-center gap-1 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Filled</p>
            </div>
            <p className="text-lg font-extrabold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{filledCount}</p>
          </button>
          <button onClick={() => setActiveOrderTab('cancelled')}
            className={cn('bg-white rounded-md p-2 border text-left transition-all', activeOrderTab === 'cancelled' ? 'border-slate-400 ring-1 ring-slate-200/50' : 'border-border/20')}>
            <div className="flex items-center gap-1 mb-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-text-muted" />
              <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Cancelled</p>
            </div>
            <p className="text-lg font-extrabold text-text-muted tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{cancelledCount}</p>
          </button>
        </div>

        {/* Sticky Tabs */}
        <div className="sticky-tabs">
          <Tabs tabs={orderTabs} activeTab={activeOrderTab} onChange={setActiveOrderTab} compact />
        </div>

        {/* Order list */}
        <div className="mt-1.5">
          {filteredOrders.length > 0 ? (
            <div className="space-y-1">
              {filteredOrders.map((order) => {
                const config = statusConfig[order.status];
                const StatusIcon = config.icon;
                const isOpen = order.status === 'pending';

                return (
                  <div key={order.id}
                    className={cn(
                      'bg-white rounded-md border overflow-hidden transition-all',
                      isOpen ? 'border-amber-200/60 border-l-2 border-l-amber-400' : 'border-border/20 border-l-2',
                      config.border
                    )}>
                    <div className="px-2.5 py-2">
                      {/* Row 1 */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <div className={cn('w-6 h-6 rounded-sm flex items-center justify-center text-[8px] font-extrabold',
                            order.side === 'BUY' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500')}>
                            {order.side === 'BUY' ? '▲' : '▼'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <p className="text-[11px] font-extrabold text-text-primary">{order.symbol}</p>
                              <span className={cn('text-[6px] font-bold px-1 py-px rounded-sm', order.side === 'BUY' ? 'bg-emerald-500/8 text-emerald-600' : 'bg-red-500/8 text-red-500')}>{order.side}</span>
                              <span className="text-[6px] font-semibold px-1 py-px rounded-sm bg-surface text-text-muted">{order.type}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className={cn('flex items-center gap-0.5 px-1.5 py-0.5 rounded-sm', config.bg)}>
                            <StatusIcon size={9} className={config.color} />
                            <span className={cn('text-[7px] font-bold', config.color)}>{config.label}</span>
                          </div>
                          {isOpen && (
                            <button onClick={() => setCancellingId(order.id)} className="p-0.5 rounded-sm hover:bg-red-50 transition-colors touch-active-subtle">
                              <X size={13} className="text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Row 2 — data */}
                      <div className="flex items-center justify-between ml-7.5 pl-0.5">
                        <div className="flex items-center gap-3">
                          <div>
                            <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Qty</p>
                            <p className="text-[10px] font-bold text-text-primary tabular-nums">{order.quantity}</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Price</p>
                            <p className="text-[10px] font-extrabold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{fmtPrice(order.price)}</p>
                          </div>
                          <div>
                            <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Value</p>
                            <p className="text-[9px] font-bold text-text-secondary tabular-nums">{formatCurrency(order.price * order.quantity)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[8px] text-text-muted font-medium flex items-center gap-0.5 justify-end">
                            <Calendar size={7} />
                            {fmtTime(order.filledAt || order.cancelledAt || order.createdAt)}
                          </p>
                          <p className="text-[6px] text-text-muted/40 mt-0.5 font-medium" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{order.id}</p>
                        </div>
                      </div>

                      {/* Open order emphasis bar */}
                      {isOpen && (
                        <div className="mt-1.5 flex items-center gap-1.5 bg-amber-50/60 rounded-sm px-2 py-1">
                          <Zap size={9} className="text-amber-500" />
                          <span className="text-[8px] font-semibold text-amber-600">Awaiting execution at {fmtPrice(order.price)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center bg-white rounded-lg border border-border/20">
              <ClipboardList size={18} className="mx-auto text-text-muted/30 mb-1.5" />
              <p className="text-[10px] font-semibold text-text-secondary">
                No {activeOrderTab === 'open' ? 'open' : activeOrderTab === 'filled' ? 'filled' : 'cancelled'} orders
              </p>
              <p className="text-[8px] text-text-muted mt-0.5">
                {activeOrderTab === 'open' ? 'Place orders from Charts' : 'History appears here'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Cancel modal */}
      <Modal isOpen={!!cancellingId} onClose={() => setCancellingId(null)} title="Cancel Order">
        {cancellingId && (() => {
          const order = orders.find((o) => o.id === cancellingId);
          if (!order) return null;
          return (
            <div className="space-y-4">
              <div className="bg-surface rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-text-muted">Symbol</span><span className="font-bold text-text-primary">{order.symbol}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Side</span><span className={cn('font-semibold', order.side === 'BUY' ? 'text-emerald-500' : 'text-red-500')}>{order.side}</span></div>
                <div className="flex justify-between text-sm"><span className="text-text-muted">Qty × Price</span><span className="font-bold text-text-primary">{order.quantity} × {fmtPrice(order.price)}</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" fullWidth size="md" onClick={() => setCancellingId(null)}>Keep</Button>
                <Button variant="danger" fullWidth size="md" onClick={handleCancelOrder}>Cancel Order</Button>
              </div>
            </div>
          );
        })()}
      </Modal>
    </div>
  );
}
