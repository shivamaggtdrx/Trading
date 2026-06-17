import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, FileText, Download, Calendar, BarChart3, TrendingUp,
  IndianRupee, Filter,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Tabs from '../../components/ui/Tabs';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, cn } from '../../utils/helpers';

const reportTabs = [
  { key: 'ledger', label: 'Ledger' },
  { key: 'pnl', label: 'P&L' },
];

export default function Reports() {
  const navigate = useNavigate();
  const { tradeHistory, walletTransactions } = useTradeStore();
  const [activeTab, setActiveTab] = useState('ledger');
  const [dateRange, setDateRange] = useState('month');

  const totalPnl = tradeHistory.reduce((sum, t) => sum + t.pnl, 0);
  const totalTrades = tradeHistory.length;
  const winRate = totalTrades > 0 ? ((tradeHistory.filter(t => t.pnl > 0).length / totalTrades) * 100).toFixed(0) : '0';

  // Build ledger from real wallet transactions
  const ledger = walletTransactions.map(tx => ({
    id: tx.id,
    date: tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '',
    description: tx.description || tx.type,
    debit: tx.amount < 0 ? Math.abs(tx.amount) : 0,
    credit: tx.amount > 0 ? tx.amount : 0,
    balance: tx.balance_after ?? 0,
  }));

  return (
    <div className="">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-surface transition-colors touch-active-subtle">
              <ArrowLeft size={18} className="text-text-primary" />
            </button>
            <h1 className="text-base font-bold text-text-primary">Reports & Statements</h1>
          </div>
          <button className="flex items-center gap-1 px-2 py-1.5 rounded-lg border border-border/40 text-sm font-bold text-text-muted hover:bg-surface transition-colors">
            <Download size={12} />
            Export
          </button>
        </div>
      </header>

      <div className="px-3 space-y-2.5 pb-3 pt-2">
        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-1.5">
          <Card padding="p-2.5">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total P&L</p>
            <p className={cn(
              'text-sm font-extrabold tabular-nums mt-0.5',
              totalPnl >= 0 ? 'text-emerald-600' : 'text-red-500'
            )} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {totalPnl >= 0 ? '+' : ''}{formatCurrency(totalPnl)}
            </p>
          </Card>
          <Card padding="p-2.5">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Trades</p>
            <p className="text-sm font-extrabold text-text-primary mt-0.5">{totalTrades}</p>
          </Card>
          <Card padding="p-2.5">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Win Rate</p>
            <p className="text-sm font-extrabold text-emerald-600 mt-0.5">{winRate}%</p>
          </Card>
        </div>

        {/* Report Type Tabs */}
        <Tabs tabs={reportTabs} activeTab={activeTab} onChange={setActiveTab} compact />

        {/* Date Range Filter */}
        <div className="flex gap-1">
          {[
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: '3months', label: '3 Months' },
            { key: 'year', label: 'FY 24-25' },
          ].map(range => (
            <button key={range.key} onClick={() => setDateRange(range.key)}
              className={cn('flex-1 py-1.5 text-sm font-bold rounded-lg transition-all',
                dateRange === range.key ? 'bg-primary text-white' : 'bg-surface text-text-muted hover:bg-surface-2')}>
              {range.label}
            </button>
          ))}
        </div>

        {/* Ledger */}
        {activeTab === 'ledger' && (
          <div>
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Account Ledger</h3>
              <div className="flex items-center gap-1 text-[11px] text-text-muted">
                <Calendar size={10} />
                <span>March 2024</span>
              </div>
            </div>
            <Card padding="p-0">
              {/* Table header */}
              <div className="flex items-center px-3 py-1.5 bg-surface/60 border-b border-border/20 text-[10px] font-bold text-text-muted uppercase tracking-wider">
                <span className="w-16">Date</span>
                <span className="flex-1">Description</span>
                <span className="w-16 text-right">Debit</span>
                <span className="w-16 text-right">Credit</span>
              </div>
              <div className="divide-y divide-border/15">
                {ledger.length > 0 ? ledger.map(entry => (
                  <div key={entry.id} className="flex items-center px-3 py-2">
                    <span className="w-16 text-sm text-text-muted font-medium">{entry.date}</span>
                    <span className="flex-1 text-sm font-medium text-text-primary truncate pr-2">{entry.description}</span>
                    <span className={cn('w-16 text-right text-sm tabular-nums font-bold', entry.debit > 0 ? 'text-red-500' : 'text-text-muted/30')}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {entry.debit > 0 ? formatCurrency(entry.debit) : '—'}
                    </span>
                    <span className={cn('w-16 text-right text-sm tabular-nums font-bold', entry.credit > 0 ? 'text-emerald-600' : 'text-text-muted/30')}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {entry.credit > 0 ? formatCurrency(entry.credit) : '—'}
                    </span>
                  </div>
                )) : (
                  <div className="py-6 text-center">
                    <p className="text-base text-text-muted font-medium">No transactions yet</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* P&L Report */}
        {activeTab === 'pnl' && (
          <div>
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">P&L Breakdown</h3>
            <Card padding="p-0">
              <div className="divide-y divide-border/20">
                {tradeHistory.slice(0, 8).map(trade => (
                  <div key={trade.id} className="flex items-center justify-between px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('w-6 h-6 rounded flex items-center justify-center text-[11px] font-bold',
                        trade.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500')}>
                        {trade.type === 'BUY' ? '▲' : '▼'}
                      </div>
                      <div>
                        <p className="text-base font-bold text-text-primary">{trade.symbol}</p>
                        <p className="text-[11px] text-text-muted">{trade.openDate} → {trade.closeDate}</p>
                      </div>
                    </div>
                    <p className={cn('text-base font-extrabold tabular-nums', trade.pnl >= 0 ? 'text-emerald-600' : 'text-red-500')}
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {trade.pnl >= 0 ? '+' : ''}{formatCurrency(trade.pnl)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}


        {/* Download Options */}
        <div className="grid grid-cols-2 gap-2">
          <Card padding="p-3" className="text-center">
            <FileText size={16} className="text-primary mx-auto mb-1.5" />
            <p className="text-base font-bold text-text-primary">Contract Notes</p>
            <p className="text-[11px] text-text-muted mt-0.5">Daily trade confirmations</p>
          </Card>
          <Card padding="p-3" className="text-center">
            <IndianRupee size={16} className="text-primary mx-auto mb-1.5" />
            <p className="text-base font-bold text-text-primary">Brokerage Report</p>
            <p className="text-[11px] text-text-muted mt-0.5">Fee & charge breakdown</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
