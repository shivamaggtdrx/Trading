import { useNavigate } from 'react-router-dom';
import {
  TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownRight,
  ChevronRight, BarChart3, Zap, Activity, Shield, Layers,
  Clock, DollarSign, PieChart,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Card from '../../components/ui/Card';
import Sparkline from '../../components/ui/Sparkline';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, formatPercent, cn } from '../../utils/helpers';

export default function Home() {
  const { positions, instruments, setSelectedInstrument } = useTradeStore();
  const navigate = useNavigate();
  const walletRaw = useTradeStore(s => s.wallet);
  const wallet = walletRaw || { balance: 0, equity: 0, usedMargin: 0, todayPnl: 0, todayPnlPercent: 0, availableMargin: 0 };

  const totalOpenPnl = positions.reduce((sum, p) => sum + (p.pnl || 0), 0);

  // Top movers — sort by absolute change %
  const topMovers = [...instruments]
    .sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0))
    .slice(0, 5);

  const handleInstrumentClick = (instrument) => {
    setSelectedInstrument(instrument);
    navigate('/charts');
  };

  // Market status
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();
  const totalMins = hours * 60 + mins;
  const isMarketOpen = totalMins >= 555 && totalMins <= 930; // 9:15 AM - 3:30 PM IST

  return (
    <div className="page-enter">
      <Header showGreeting showNotification />

      <div className="px-4 lg:px-6 space-y-5 pb-6 pt-2">
        {/* ═══ Portfolio Overview ═══ */}
        <Card className="relative overflow-hidden" padding="p-0">
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-5 lg:p-6 rounded-lg text-white relative overflow-hidden">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Wallet size={16} />
                  </div>
                  <span className="text-sm font-medium text-white/60 uppercase tracking-wider">Portfolio Value</span>
                </div>
                <div className={cn(
                  'flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-bold',
                  wallet.todayPnl >= 0 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'
                )}>
                  {wallet.todayPnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                  {formatPercent(wallet.todayPnlPercent)}
                </div>
              </div>

              <div className="mb-1">
                <span className="text-3xl lg:text-4xl font-extrabold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatCurrency(wallet.equity)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-sm text-white/50">
                {wallet.todayPnl >= 0 ? (
                  <ArrowUpRight size={14} className="text-emerald-400" />
                ) : (
                  <ArrowDownRight size={14} className="text-red-400" />
                )}
                <span className={wallet.todayPnl >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                  {wallet.todayPnl >= 0 ? '+' : ''}{formatCurrency(wallet.todayPnl)}
                </span>
                <span>today</span>
              </div>
            </div>

            <div className="absolute -top-8 -right-8 w-32 h-32 bg-blue-400/5 rounded-full" />
            <div className="absolute -bottom-6 -right-4 w-24 h-24 bg-indigo-400/5 rounded-full" />
          </div>
        </Card>

        {/* ═══ Stats Row ═══ */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
          <Card padding="p-3">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Balance</p>
            <p className="text-sm font-bold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(wallet.balance)}</p>
          </Card>
          <Card padding="p-3">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Margin Used</p>
            <p className="text-sm font-bold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(wallet.usedMargin)}</p>
          </Card>
          <Card padding="p-3">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Open P&L</p>
            <p className={cn('text-sm font-bold tabular-nums', totalOpenPnl >= 0 ? 'text-emerald-500' : 'text-red-500')} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {totalOpenPnl >= 0 ? '+' : ''}{formatCurrency(totalOpenPnl)}
            </p>
          </Card>
          {/* Desktop-only extra stats */}
          <Card padding="p-3" className="hidden lg:block">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Available</p>
            <p className="text-sm font-bold text-emerald-500 tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>{formatCurrency(wallet.availableMargin)}</p>
          </Card>
          <Card padding="p-3" className="hidden lg:block">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Positions</p>
            <p className="text-sm font-bold text-text-primary tabular-nums">{positions.length}</p>
          </Card>
          <Card padding="p-3" className="hidden lg:block">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-1">Market</p>
            <div className="flex items-center gap-1.5">
              <div className={cn('w-2 h-2 rounded-full', isMarketOpen ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-500')} />
              <p className="text-sm font-bold text-text-primary">{isMarketOpen ? 'Open' : 'Closed'}</p>
            </div>
          </Card>
        </div>

        {/* ═══ Quick Actions ═══ */}
        <div>
          <h2 className="text-sm font-bold text-text-secondary mb-2.5 uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              { icon: BarChart3, label: 'Markets', color: 'from-blue-500/10 to-blue-600/10 text-blue-600', path: '/markets' },
              { icon: Zap, label: 'Trade', color: 'from-amber-500/10 to-orange-500/10 text-amber-600', path: '/charts' },
              { icon: Layers, label: 'Positions', color: 'from-emerald-500/10 to-green-500/10 text-emerald-600', path: '/positions' },
              { icon: Shield, label: 'History', color: 'from-violet-500/10 to-purple-500/10 text-violet-600', path: '/history' },
              { icon: DollarSign, label: 'Funds', color: 'from-teal-500/10 to-cyan-500/10 text-teal-600', path: '/wallet', desktop: true },
              { icon: Activity, label: 'Orders', color: 'from-pink-500/10 to-rose-500/10 text-pink-600', path: '/orders', desktop: true },
              { icon: PieChart, label: 'Reports', color: 'from-indigo-500/10 to-blue-500/10 text-indigo-600', path: '/reports', desktop: true },
              { icon: Clock, label: 'Referral', color: 'from-orange-500/10 to-amber-500/10 text-orange-600', path: '/referral', desktop: true },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-3 rounded-xl bg-surface border border-border/30 hover:border-border transition-all touch-active-subtle',
                  action.desktop && 'hidden lg:flex'
                )}
              >
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br', action.color)}>
                  <action.icon size={18} strokeWidth={2} />
                </div>
                <span className="text-xs font-semibold text-text-secondary">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ Desktop: Full width layout for Positions ═══ */}
        <div className="grid grid-cols-1 gap-4">
          {/* Open Positions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-sm font-bold text-text-secondary uppercase tracking-wider">
                Open Positions {positions.length > 0 && `(${positions.length})`}
              </h2>
              {positions.length > 0 && (
                <button onClick={() => navigate('/positions')} className="flex items-center gap-0.5 text-xs font-semibold text-primary">
                  View All <ChevronRight size={12} />
                </button>
              )}
            </div>
            <Card padding="p-0">
              {positions.length > 0 ? (
                <div className="divide-y divide-border/20">
                  {positions.slice(0, 5).map((pos) => (
                    <div key={pos.id} className="flex items-center justify-between px-3 py-2.5 hover:bg-surface-2/50 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center text-xs font-extrabold',
                          pos.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
                        )}>
                          {pos.type === 'BUY' ? 'B' : 'S'}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{pos.symbol}</p>
                          <p className="text-xs text-text-muted">Qty: {pos.quantity}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={cn('text-sm font-extrabold tabular-nums', pos.pnl >= 0 ? 'text-emerald-500' : 'text-red-500')}
                           style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                        </p>
                        <p className={cn('text-xs font-semibold', pos.pnl >= 0 ? 'text-emerald-500/60' : 'text-red-500/60')}>
                          {formatPercent(pos.pnlPercent)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Layers size={20} className="mx-auto text-text-muted/30 mb-2" />
                  <p className="text-sm font-semibold text-text-muted">No open positions</p>
                  <p className="text-xs text-text-muted/60 mt-0.5">Click an instrument from the sidebar to start trading</p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Market status footer */}
        <div className="flex items-center gap-2 px-1 py-1 lg:hidden">
          <div className={cn('w-1.5 h-1.5 rounded-full', isMarketOpen ? 'bg-emerald-500 animate-pulse-dot' : 'bg-red-500')} />
          <span className="text-xs font-medium text-text-muted">{isMarketOpen ? 'Market Open' : 'Market Closed'}</span>
          <span className="text-xs text-text-muted/40 ml-auto">NSE · BSE</span>
        </div>
      </div>
    </div>
  );
}
