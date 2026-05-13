import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight,
  Plus, Minus, Clock, CheckCircle2, XCircle, IndianRupee, Shield,
  AlertCircle, Loader2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, cn } from '../../utils/helpers';

export default function WalletPage() {
  const navigate = useNavigate();
  const { wallet, walletTransactions, submitDeposit, submitWithdrawal, depositLoading, withdrawLoading } = useTradeStore();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('deposit');
  const [amount, setAmount] = useState('');
  const [utrNumber, setUtrNumber] = useState('');
  const [submitResult, setSubmitResult] = useState(null);

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
        setSubmitResult({ type: 'success', message: 'Deposit request submitted! It will be reviewed shortly.' });
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
    completed: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
    approved: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
    pending: { icon: Clock, label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-500/8' },
    rejected: { icon: XCircle, label: 'Rejected', color: 'text-red-500', bg: 'bg-red-500/8' },
  };

  // Format wallet transaction for display
  const formatTxType = (type) => {
    const map = {
      deposit: 'Deposit', withdrawal: 'Withdrawal', trade_pnl: 'Trade P&L',
      commission: 'Commission', swap_fee: 'Swap Fee', bonus: 'Bonus',
      adjustment: 'Adjustment', refund: 'Refund',
    };
    return map[type] || type;
  };

  const isCredit = (tx) => tx.amount > 0;

  return (
    <div className="page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-3 py-2.5">
          <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-surface transition-colors touch-active-subtle">
            <ArrowLeft size={18} className="text-text-primary" />
          </button>
          <h1 className="text-base font-bold text-text-primary">Funds & Withdrawals</h1>
        </div>
      </header>

      <div className="px-3 space-y-2.5 pb-3 pt-2">
        {/* Balance Card */}
        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center gap-1.5 mb-1">
            <WalletIcon size={16} className="text-text-muted" />
            <span className="text-sm font-semibold text-text-muted uppercase tracking-wider">Available Balance</span>
          </div>
          <p className="text-3xl font-bold tracking-tight text-text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
            {formatCurrency(wallet?.balance || 0)}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1.5">
          <Card padding="p-2.5">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Equity</p>
            <p className="text-base font-extrabold text-text-primary tabular-nums mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(wallet?.equity || 0)}
            </p>
          </Card>
          <Card padding="p-2.5">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Used Margin</p>
            <p className="text-base font-extrabold text-text-primary tabular-nums mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(wallet?.usedMargin || 0)}
            </p>
          </Card>
          <Card padding="p-2.5">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Free Margin</p>
            <p className="text-base font-extrabold text-emerald-500 tabular-nums mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(wallet?.availableMargin || 0)}
            </p>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="success" fullWidth size="md" onClick={() => openModal('deposit')}>
            <Plus size={14} className="mr-1.5" /> Add Funds
          </Button>
          <Button variant="outline-danger" fullWidth size="md" onClick={() => openModal('withdraw')}>
            <Minus size={14} className="mr-1.5" /> Withdraw
          </Button>
        </div>

        {/* Transaction History */}
        <div>
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">
            Recent Transactions
          </h3>
          {walletTransactions.length > 0 ? (
            <Card padding="p-0">
              <div className="divide-y divide-border/20">
                {walletTransactions.map((tx) => {
                  const credit = isCredit(tx);
                  const status = tx.status || (credit ? 'completed' : 'completed');
                  const config = statusConfig[status] || statusConfig.completed;
                  const StatusIcon = config.icon;
                  return (
                    <div key={tx.id} className="px-3 py-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className={cn(
                            'w-8 h-8 rounded-lg flex items-center justify-center',
                            credit ? 'bg-emerald-500/10' : 'bg-red-500/10'
                          )}>
                            {credit ? (
                              <ArrowDownRight size={14} className="text-emerald-600" />
                            ) : (
                              <ArrowUpRight size={14} className="text-red-500" />
                            )}
                          </div>
                          <div>
                            <p className="text-base font-bold text-text-primary">{formatTxType(tx.type)}</p>
                            <p className="text-sm text-text-muted mt-0.5 truncate max-w-[180px]">
                              {tx.description || tx.type} · {new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            'text-base font-extrabold tabular-nums',
                            credit ? 'text-emerald-600' : 'text-text-primary'
                          )} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            {credit ? '+' : ''}{formatCurrency(tx.amount)}
                          </p>
                          <div className={cn('flex items-center gap-0.5 justify-end mt-0.5', config.color)}>
                            <StatusIcon size={8} />
                            <span className="text-[11px] font-bold">{config.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          ) : (
            <Card className="py-6 text-center">
              <Clock size={18} className="mx-auto text-text-muted/40 mb-1.5" />
              <p className="text-base font-semibold text-text-muted">No transactions yet</p>
            </Card>
          )}
        </div>
      </div>

      {/* Deposit/Withdraw Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalType === 'deposit' ? 'Add Funds' : 'Withdraw Funds'}>
        <div className="space-y-4">
          <div className="bg-surface rounded-lg p-3">
            <div className="flex justify-between text-base mb-2">
              <span className="text-text-muted">Available Balance</span>
              <span className="font-bold text-text-primary">{formatCurrency(wallet?.balance || 0)}</span>
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
                className="w-full bg-white border border-border/50 rounded-xl pl-8 pr-4 py-2.5 text-base font-bold text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
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
                  className="w-full bg-white border border-border/50 rounded-xl px-4 py-2.5 text-base font-medium text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
                />
              </div>
              <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-2.5 border border-blue-200/50">
                <Shield size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-base text-blue-700">Funds will be credited instantly via UPI or within 1 hour via NEFT/IMPS.</p>
              </div>
            </>
          )}
          {/* Result message */}
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
