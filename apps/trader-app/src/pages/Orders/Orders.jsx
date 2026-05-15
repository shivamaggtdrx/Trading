import { useState } from 'react';
import { Clock, CheckCircle2, XCircle, X, Calendar, ClipboardList, Zap } from 'lucide-react';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, cn } from '../../utils/helpers';

const statusConfig = {
  pending: { icon: Clock, label: 'Pending', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  filled: { icon: CheckCircle2, label: 'Filled', color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  cancelled: { icon: XCircle, label: 'Cancelled', color: 'text-text-muted', bg: 'bg-surface-3' },
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
    <div className="page-enter bg-surface min-h-screen">
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-lg font-bold text-text-primary">Orders</h1>
      </div>

      <div className="px-4 pb-20">
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button onClick={() => setActiveOrderTab('open')}
            className={cn('bg-surface-2 rounded-xl border p-3 text-left transition-all', activeOrderTab === 'open' ? 'border-amber-500/40' : 'border-border')}>
            <div className="flex items-center gap-1.5 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-amber-500" /><p className="text-[10px] text-text-muted font-bold uppercase">Open</p></div>
            <p className={cn('text-xl font-bold tabular-nums', openCount > 0 ? 'text-amber-400' : 'text-text-muted')}>{openCount}</p>
          </button>
          <button onClick={() => setActiveOrderTab('filled')}
            className={cn('bg-surface-2 rounded-xl border p-3 text-left transition-all', activeOrderTab === 'filled' ? 'border-emerald-500/40' : 'border-border')}>
            <div className="flex items-center gap-1.5 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /><p className="text-[10px] text-text-muted font-bold uppercase">Filled</p></div>
            <p className="text-xl font-bold text-text-muted tabular-nums">{filledCount}</p>
          </button>
          <button onClick={() => setActiveOrderTab('cancelled')}
            className={cn('bg-surface-2 rounded-xl border p-3 text-left transition-all', activeOrderTab === 'cancelled' ? 'border-border' : 'border-border')}>
            <div className="flex items-center gap-1.5 mb-1"><div className="w-1.5 h-1.5 rounded-full bg-gray-500" /><p className="text-[10px] text-text-muted font-bold uppercase">Cancelled</p></div>
            <p className="text-xl font-bold text-text-muted tabular-nums">{cancelledCount}</p>
          </button>
        </div>

        <div className="mt-2">
          {filteredOrders.length > 0 ? (
            <div className="space-y-2">
              {filteredOrders.map((order) => {
                const config = statusConfig[order.status];
                const StatusIcon = config.icon;
                const isOpen = order.status === 'pending';
                return (
                  <div key={order.id} className="bg-surface-2 rounded-xl border border-border p-3.5 overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[11px] font-bold px-1.5 py-0.5 rounded',
                          order.side === 'BUY' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400')}>{order.side}</span>
                        <p className="text-sm font-bold text-text-primary">{order.symbol}</p>
                        <span className="text-[10px] text-text-muted font-medium px-1.5 py-0.5 bg-surface rounded">{order.type}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn('flex items-center gap-1 px-1.5 py-0.5 rounded', config.bg)}>
                          <StatusIcon size={10} className={config.color} /><span className={cn('text-[10px] font-bold', config.color)}>{config.label}</span>
                        </div>
                        {isOpen && <button onClick={() => setCancellingId(order.id)} className="p-1 hover:bg-red-500/10 rounded"><X size={14} className="text-red-400" /></button>}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div><p className="text-[10px] text-text-muted font-medium uppercase">Qty</p><p className="text-xs font-bold text-text-secondary tabular-nums">{order.quantity}</p></div>
                        <div><p className="text-[10px] text-text-muted font-medium uppercase">Price</p><p className="text-xs font-bold text-text-primary tabular-nums">{fmtPrice(order.price)}</p></div>
                        <div><p className="text-[10px] text-text-muted font-medium uppercase">Value</p><p className="text-xs font-bold text-text-secondary tabular-nums">{formatCurrency(order.price * order.quantity)}</p></div>
                      </div>
                      <p className="text-[11px] text-text-muted flex items-center gap-1"><Calendar size={8} />{fmtTime(order.filledAt || order.cancelledAt || order.createdAt)}</p>
                    </div>
                    {isOpen && (
                      <div className="mt-2 flex items-center gap-1.5 bg-amber-500/5 rounded-lg px-2.5 py-1.5">
                        <Zap size={10} className="text-amber-400" /><span className="text-[11px] font-medium text-amber-400">Awaiting execution at {fmtPrice(order.price)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center">
              <ClipboardList size={32} className="mx-auto text-text-muted/30 mb-3" />
              <p className="text-sm font-semibold text-text-muted">No {activeOrderTab === 'open' ? 'open' : activeOrderTab === 'filled' ? 'filled' : 'cancelled'} orders</p>
              <p className="text-xs text-text-muted/60 mt-1">{activeOrderTab === 'open' ? 'Place orders from Charts' : 'History appears here'}</p>
            </div>
          )}
        </div>
      </div>

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
