import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Wallet as WalletIcon, ArrowUpRight, ArrowDownRight,
  Plus, Minus, Clock, CheckCircle2, XCircle, IndianRupee, Shield,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, cn } from '../../utils/helpers';

const mockTransactions = [
  { id: 'TX-001', type: 'deposit', amount: 100000, status: 'completed', date: '2024-03-28 10:30', method: 'UPI' },
  { id: 'TX-002', type: 'withdrawal', amount: 25000, status: 'pending', date: '2024-03-27 14:20', method: 'Bank Transfer' },
  { id: 'TX-003', type: 'deposit', amount: 50000, status: 'completed', date: '2024-03-25 09:15', method: 'NEFT' },
  { id: 'TX-004', type: 'withdrawal', amount: 15000, status: 'completed', date: '2024-03-22 16:45', method: 'UPI' },
  { id: 'TX-005', type: 'deposit', amount: 200000, status: 'completed', date: '2024-03-20 11:00', method: 'Wire Transfer' },
  { id: 'TX-006', type: 'withdrawal', amount: 30000, status: 'rejected', date: '2024-03-18 13:30', method: 'IMPS' },
];

export default function WalletPage() {
  const navigate = useNavigate();
  const { wallet } = useTradeStore();
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('deposit');
  const [amount, setAmount] = useState('');

  const openModal = (type) => {
    setModalType(type);
    setAmount('');
    setShowModal(true);
  };

  const statusConfig = {
    completed: { icon: CheckCircle2, label: 'Completed', color: 'text-emerald-600', bg: 'bg-emerald-500/8' },
    pending: { icon: Clock, label: 'Pending', color: 'text-amber-600', bg: 'bg-amber-500/8' },
    rejected: { icon: XCircle, label: 'Rejected', color: 'text-red-500', bg: 'bg-red-500/8' },
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-3 py-2.5">
          <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-surface transition-colors touch-active-subtle">
            <ArrowLeft size={18} className="text-text-primary" />
          </button>
          <h1 className="text-sm font-bold text-text-primary">Funds & Withdrawals</h1>
        </div>
      </header>

      <div className="px-3 space-y-2.5 pb-3 pt-2">
        {/* Balance Card */}
        <Card padding="p-0" className="overflow-hidden">
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 rounded-2xl text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '14px 14px'
            }} />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
                  <WalletIcon size={14} />
                </div>
                <span className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Available Balance</span>
              </div>
              <p className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {formatCurrency(wallet.balance)}
              </p>
            </div>
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-400/5 rounded-full" />
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1.5">
          <Card padding="p-2.5">
            <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Equity</p>
            <p className="text-[10px] font-extrabold text-text-primary tabular-nums mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(wallet.equity)}
            </p>
          </Card>
          <Card padding="p-2.5">
            <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Used Margin</p>
            <p className="text-[10px] font-extrabold text-text-primary tabular-nums mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(wallet.usedMargin)}
            </p>
          </Card>
          <Card padding="p-2.5">
            <p className="text-[7px] text-text-muted font-bold uppercase tracking-wider">Free Margin</p>
            <p className="text-[10px] font-extrabold text-emerald-500 tabular-nums mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(wallet.availableMargin)}
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
          <h3 className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">
            Recent Transactions
          </h3>
          <Card padding="p-0">
            <div className="divide-y divide-border/20">
              {mockTransactions.map((tx) => {
                const config = statusConfig[tx.status];
                const StatusIcon = config.icon;
                const isDeposit = tx.type === 'deposit';
                return (
                  <div key={tx.id} className="px-3 py-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          isDeposit ? 'bg-emerald-500/10' : 'bg-red-500/10'
                        )}>
                          {isDeposit ? (
                            <ArrowDownRight size={14} className="text-emerald-600" />
                          ) : (
                            <ArrowUpRight size={14} className="text-red-500" />
                          )}
                        </div>
                        <div>
                          <p className="text-[11px] font-bold text-text-primary capitalize">{tx.type}</p>
                          <p className="text-[9px] text-text-muted mt-0.5">{tx.method} · {tx.date}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn(
                          'text-[11px] font-extrabold tabular-nums',
                          isDeposit ? 'text-emerald-600' : 'text-text-primary'
                        )} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {isDeposit ? '+' : '-'}{formatCurrency(tx.amount)}
                        </p>
                        <div className={cn('flex items-center gap-0.5 justify-end mt-0.5', config.color)}>
                          <StatusIcon size={8} />
                          <span className="text-[8px] font-bold">{config.label}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      {/* Deposit/Withdraw Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={modalType === 'deposit' ? 'Add Funds' : 'Withdraw Funds'}>
        <div className="space-y-4">
          <div className="bg-surface rounded-lg p-3">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-text-muted">Available Balance</span>
              <span className="font-bold text-text-primary">{formatCurrency(wallet.balance)}</span>
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">Amount (₹)</label>
            <div className="relative">
              <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-white border border-border/50 rounded-xl pl-8 pr-4 py-2.5 text-sm font-bold text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
          </div>
          {/* Quick amounts */}
          <div className="flex gap-1">
            {[5000, 10000, 25000, 50000, 100000].map(q => (
              <button key={q} onClick={() => setAmount(String(q))}
                className={cn('flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all',
                  Number(amount) === q ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-surface-2')}>
                {q >= 100000 ? '₹1L' : `₹${q/1000}K`}
              </button>
            ))}
          </div>
          {modalType === 'deposit' && (
            <div className="flex items-start gap-2 bg-blue-50 rounded-lg p-2.5 border border-blue-200/50">
              <Shield size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-blue-700">Funds will be credited instantly via UPI or within 1 hour via NEFT/IMPS.</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button variant="outline" fullWidth size="md" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button variant={modalType === 'deposit' ? 'success' : 'danger'} fullWidth size="md" disabled={!amount || Number(amount) <= 0}>
              {modalType === 'deposit' ? 'Deposit' : 'Withdraw'} {amount ? formatCurrency(Number(amount)) : ''}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
