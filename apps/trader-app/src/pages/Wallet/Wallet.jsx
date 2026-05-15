import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus, ArrowDownToLine, Clock, CheckCircle2, XCircle,
  IndianRupee, Shield, AlertCircle, Loader2,
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import Button from '../../components/ui/Button';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, cn } from '../../utils/helpers';

export default function WalletPage() {
  const navigate = useNavigate();
  const { wallet, walletTransactions, positions, submitDeposit, submitWithdrawal, depositLoading, withdrawLoading } = useTradeStore();
  const [activeInfoTab, setActiveInfoTab] = useState('info');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [submitResult, setSubmitResult] = useState(null);

  const bal = wallet?.balance || 0;
  const availMargin = wallet?.availableMargin || 0;
  const usedMargin = wallet?.usedMargin || 0;
  const equity = wallet?.equity || 0;
  const unrealizedPnl = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);
  const equityPct = bal > 0 ? ((equity / bal) * 100).toFixed(2) : '--';

  const openModal = (type) => {
    setModalType(type);
    setAmount('');
    setUtrNumber('');
    setSubmitResult(null);
    setShowModal(true);
  };

  const handleSubmit = async () => {
    setSubmitResult(null);
    if (modalType === 'deposit') {
      const result = await submitDeposit(Number(amount), 'UPI', utrNumber || undefined);
      if (result.success) {
        setSubmitResult({ type: 'success', message: 'Deposit request submitted!' });
        setTimeout(() => { setShowModal(false); setSubmitResult(null); }, 2500);
      } else {
        setSubmitResult({ type: 'error', message: result.error || 'Deposit failed' });
      }
    } else {
      const result = await submitWithdrawal({ amount: Number(amount), method: 'bank_transfer' });
      if (result.success) {
        setSubmitResult({ type: 'success', message: 'Withdrawal request submitted!' });
        setTimeout(() => { setShowModal(false); setSubmitResult(null); }, 2500);
      } else {
        setSubmitResult({ type: 'error', message: result.error || 'Withdrawal failed' });
      }
    }
  };

  const statusConfig = {
    completed: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-500' },
    approved: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-500' },
    pending: { icon: Clock, label: 'Pending', color: 'text-amber-500' },
    rejected: { icon: XCircle, label: 'Rejected', color: 'text-red-500' },
  };

  const formatTxType = (type) => {
    const map = {
      deposit: 'Deposit', withdrawal: 'Withdrawal', trade_pnl: 'Trade P&L',
      commission: 'Commission', swap_fee: 'Swap Fee', bonus: 'Bonus',
      adjustment: 'Adjustment', refund: 'Refund',
    };
    return map[type] || type;
  };

  const infoItems = [
    { label: 'Balance', value: formatCurrency(bal) },
    { label: 'Available Margin', value: formatCurrency(availMargin) },
    { label: 'Unrealized P&L', value: formatCurrency(unrealizedPnl), color: unrealizedPnl >= 0 ? 'text-emerald-500' : 'text-red-500' },
    { label: 'Blocked Margin', value: formatCurrency(usedMargin) },
    { label: 'Equity', value: formatCurrency(equity) },
    { label: 'Equity Percentage', value: equityPct },
  ];

  return (
    <div className="page-enter bg-surface min-h-screen">
      {/* Header */}
      <div className="px-4 pt-6 pb-4">
        <h1 className="text-2xl font-bold text-text-primary">Funds</h1>
        <p className="text-sm text-text-muted mt-1">Manage your trading account funds</p>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4 flex gap-3">
        <button
          onClick={() => openModal('withdraw')}
          className="flex items-center gap-2 px-5 py-2.5 bg-surface-3 border border-border rounded-lg text-text-primary font-semibold text-sm hover:bg-surface-2 transition-colors"
        >
          <ArrowDownToLine size={16} className="text-blue-400" />
          Withdraw
        </button>
        <button
          onClick={() => openModal('deposit')}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 rounded-lg text-white font-semibold text-sm hover:bg-emerald-700 transition-colors"
        >
          <Plus size={16} />
          Add Funds
        </button>
      </div>

      {/* Info / Transactions Tabs */}
      <div className="px-4 pb-2">
        <div className="bg-surface-2 rounded-xl border border-border overflow-hidden">
          {/* Tab Bar */}
          <div className="flex border-b border-border">
            <button
              onClick={() => setActiveInfoTab('info')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold text-center transition-colors relative',
                activeInfoTab === 'info' ? 'text-blue-500' : 'text-text-muted'
              )}
            >
              Info
              {activeInfoTab === 'info' && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
            <button
              onClick={() => setActiveInfoTab('transactions')}
              className={cn(
                'flex-1 py-3 text-sm font-semibold text-center transition-colors relative',
                activeInfoTab === 'transactions' ? 'text-blue-500' : 'text-text-muted'
              )}
            >
              Transactions
              {activeInfoTab === 'transactions' && (
                <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          </div>

          {/* Tab Content */}
          {activeInfoTab === 'info' ? (
            <div className="divide-y divide-border">
              {infoItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[14px] text-text-muted">{item.label}</span>
                  <span className={cn('text-[14px] font-semibold tabular-nums', item.color || 'text-text-primary')}>
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div>
              {walletTransactions.length > 0 ? (
                <div className="divide-y divide-border">
                  {walletTransactions.map((tx) => {
                    const credit = tx.amount > 0;
                    const status = tx.status || 'completed';
                    const config = statusConfig[status] || statusConfig.completed;
                    const StatusIcon = config.icon;
                    return (
                      <div key={tx.id} className="px-4 py-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[13px] font-semibold text-text-primary">{formatTxType(tx.type)}</p>
                            <p className="text-[11px] text-text-muted mt-0.5">
                              {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={cn('text-[13px] font-bold tabular-nums', credit ? 'text-emerald-400' : 'text-text-primary')}>
                              {credit ? '+' : ''}{formatCurrency(tx.amount)}
                            </p>
                            <div className={cn('flex items-center gap-1 justify-end mt-0.5', config.color)}>
                              <StatusIcon size={10} />
                              <span className="text-[10px] font-semibold">{config.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <Clock size={24} className="mx-auto text-text-muted/30 mb-2" />
                  <p className="text-sm text-text-muted">No transactions yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Deposit/Withdraw Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalType === 'deposit' ? 'Add Funds' : 'Withdraw Funds'}>
        <div className="space-y-4">
          <div className="bg-surface rounded-lg p-3">
            <div className="flex justify-between text-base mb-2">
              <span className="text-text-muted">Available Balance</span>
              <span className="font-bold text-text-primary">{formatCurrency(bal)}</span>
            </div>
          </div>
          <div>
            <label className="block text-base font-bold text-text-muted uppercase tracking-wider mb-1">Amount (₹)</label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-surface border border-border/50 rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
          </div>
          {/* Quick amounts */}
          <div className="flex gap-1">
            {[5000, 10000, 25000, 50000, 100000].map(q => (
              <button key={q} onClick={() => setAmount(String(q))}
                className={cn('flex-1 py-1.5 text-sm font-bold rounded-lg transition-all',
                  Number(amount) === q ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-surface-2')}>
                {q >= 100000 ? '₹1L' : `₹${q/1000}K`}
              </button>
            ))}
          </div>
          {modalType === 'deposit' && (
            <>
              <div>
                <label className="block text-base font-bold text-text-muted uppercase tracking-wider mb-1">UTR Number (optional)</label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter UTR / Transaction Ref"
                  className="w-full bg-surface border border-border/50 rounded-xl px-4 py-2.5 text-base font-medium text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
                />
              </div>
              <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-2.5 border border-blue-200/50">
                <Shield size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-base text-blue-700">Funds will be credited instantly via UPI or within 1 hour via NEFT/IMPS.</p>
              </div>
            </>
          )}
          {submitResult && (
            <div className={cn(
              'flex items-center gap-2 rounded-lg p-2.5 border text-base font-semibold',
              submitResult.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
            )}>
              {submitResult.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
              {submitResult.message}
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" fullWidth size="md" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button
              variant={modalType === 'deposit' ? 'success' : 'danger'}
              fullWidth
              size="md"
              disabled={!amount || Number(amount) <= 0 || depositLoading || withdrawLoading}
              onClick={handleSubmit}
            >
              {(depositLoading || withdrawLoading) && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              {modalType === 'deposit' ? 'Deposit' : 'Withdraw'} {amount ? formatCurrency(Number(amount)) : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
