import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  ChevronRight,
  BarChart3,
  Zap,
  Activity,
  Shield,
  Star,
} from 'lucide-react';
import Header from '../../components/layout/Header';
import Card from '../../components/ui/Card';
import Sparkline from '../../components/ui/Sparkline';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, formatPercent, cn } from '../../utils/helpers';

export default function Dashboard() {
  const { wallet, stocks, positions, getAllFavorites, setSelectedInstrument } = useTradeStore();
  const navigate = useNavigate();

  const totalOpenPnl = positions.reduce((sum, p) => sum + p.pnl, 0);
  const topMovers = [...stocks].sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent)).slice(0, 5);
  const favorites = getAllFavorites();

  const handleInstrumentClick = (instrument) => {
    setSelectedInstrument(instrument);
    navigate('/trade');
  };

  return (
    <div className="page-enter">
      <Header showGreeting showNotification />

      <div className="px-3 space-y-3 pb-3">
        {/* Portfolio Card */}
        <Card className="relative overflow-hidden" padding="p-0">
          <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-4 rounded-2xl text-white relative overflow-hidden">
            {/* Subtle grid pattern */}
            <div className="absolute inset-0 opacity-5" style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }} />

            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <Wallet size={14} />
                  </div>
                  <span className="text-[11px] font-medium text-white/60 uppercase tracking-wider">Portfolio Value</span>
                </div>
                <div className={cn(
                  'flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold',
                  wallet.todayPnl >= 0 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'
                )}>
                  {wallet.todayPnl >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                  {formatPercent(wallet.todayPnlPercent)}
                </div>
              </div>

              <div className="mb-0.5">
                <span className="text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {formatCurrency(wallet.equity)}
                </span>
              </div>

              <div className="flex items-center gap-1 text-xs text-white/50">
                {wallet.todayPnl >= 0 ? (
                  <ArrowUpRight size={12} className="text-emerald-400" />
                ) : (
                  <ArrowDownRight size={12} className="text-red-400" />
                )}
                <span className={wallet.todayPnl >= 0 ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                  {wallet.todayPnl >= 0 ? '+' : ''}{formatCurrency(wallet.todayPnl)}
                </span>
                <span>today</span>
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -top-8 -right-8 w-28 h-28 bg-blue-400/5 rounded-full" />
            <div className="absolute -bottom-6 -right-4 w-20 h-20 bg-indigo-400/5 rounded-full" />
          </div>
        </Card>

        {/* Stats Row — 3 cols for density */}
        <div className="grid grid-cols-3 gap-2">
          <Card padding="p-2.5">
            <p className="text-[9px] text-text-muted font-semibold uppercase tracking-wider mb-0.5">Balance</p>
            <p className="text-xs font-bold text-text-primary tabular-nums">{formatCurrency(wallet.balance)}</p>
          </Card>
          <Card padding="p-2.5">
            <p className="text-[9px] text-text-muted font-semibold uppercase tracking-wider mb-0.5">Margin Used</p>
            <p className="text-xs font-bold text-text-primary tabular-nums">{formatCurrency(wallet.usedMargin)}</p>
          </Card>
          <Card padding="p-2.5">
            <p className="text-[9px] text-text-muted font-semibold uppercase tracking-wider mb-0.5">Open P&L</p>
            <p className={cn(
              'text-xs font-bold tabular-nums',
              totalOpenPnl >= 0 ? 'pnl-profit' : 'pnl-loss'
            )}>
              {totalOpenPnl >= 0 ? '+' : ''}{formatCurrency(totalOpenPnl)}
            </p>
          </Card>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-[11px] font-bold text-text-secondary mb-2 px-0.5 uppercase tracking-wider">Quick Actions</h2>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { icon: BarChart3, label: 'Markets', color: 'from-blue-500/10 to-blue-600/10 text-blue-600', path: '/markets' },
              { icon: Zap, label: 'Trade', color: 'from-amber-500/10 to-orange-500/10 text-amber-600', path: '/trade' },
              { icon: Activity, label: 'Positions', color: 'from-emerald-500/10 to-green-500/10 text-emerald-600', path: '/positions' },
              { icon: Shield, label: 'History', color: 'from-violet-500/10 to-purple-500/10 text-violet-600', path: '/history' },
            ].map((action) => (
              <button
                key={action.label}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl bg-white border border-border/30 hover:border-border transition-all touch-active-subtle"
              >
                <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br', action.color)}>
                  <action.icon size={17} strokeWidth={2} />
                </div>
                <span className="text-[10px] font-semibold text-text-secondary">{action.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Watchlist */}
        {favorites.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <div className="flex items-center gap-1.5">
                <Star size={12} className="text-amber-500 fill-amber-500" />
                <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Watchlist</h2>
              </div>
              <button
                onClick={() => navigate('/markets')}
                className="flex items-center gap-0.5 text-[10px] font-semibold text-primary"
              >
                View All <ChevronRight size={12} />
              </button>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 scrollbar-hide">
              {favorites.slice(0, 6).map((stock) => (
                <Card
                  key={stock.symbol}
                  className="min-w-[130px] flex-shrink-0"
                  padding="p-2.5"
                  onClick={() => handleInstrumentClick(stock)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-[11px] font-bold text-text-primary">{stock.symbol}</p>
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-extrabold text-text-primary tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {stock.price >= 100 ? '₹' + stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '$' + stock.price.toFixed(4)}
                      </p>
                      <div className={cn(
                        'flex items-center gap-0.5 text-[10px] font-bold mt-0.5',
                        stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {stock.change >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                        {formatPercent(stock.changePercent)}
                      </div>
                    </div>
                    <Sparkline data={stock.sparkline} positive={stock.change >= 0} width={48} height={24} />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Open Positions Summary */}
        {positions.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2 px-0.5">
              <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Open Positions</h2>
              <button
                onClick={() => navigate('/positions')}
                className="flex items-center gap-0.5 text-[10px] font-semibold text-primary"
              >
                View All <ChevronRight size={12} />
              </button>
            </div>
            <Card padding="p-0">
              <div className="divide-y divide-border/30">
                {positions.slice(0, 3).map((pos) => (
                  <div key={pos.id} className="flex items-center justify-between px-3 py-2.5 touch-active-subtle">
                    <div className="flex items-center gap-2.5">
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-extrabold',
                        pos.type === 'BUY' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
                      )}>
                        {pos.type === 'BUY' ? 'B' : 'S'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-text-primary">{pos.symbol}</p>
                        <p className="text-[10px] text-text-muted">Qty: {pos.quantity}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn(
                        'text-xs font-extrabold tabular-nums',
                        pos.pnl >= 0 ? 'pnl-profit' : 'pnl-loss'
                      )} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                        {pos.pnl >= 0 ? '+' : ''}{formatCurrency(pos.pnl)}
                      </p>
                      <p className={cn(
                        'text-[10px] font-semibold',
                        pos.pnl >= 0 ? 'text-emerald-500/70' : 'text-red-500/70'
                      )}>
                        {formatPercent(pos.pnlPercent)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Top Movers */}
        <div>
          <div className="flex items-center justify-between mb-2 px-0.5">
            <h2 className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Top Movers</h2>
            <button
              onClick={() => navigate('/markets')}
              className="flex items-center gap-0.5 text-[10px] font-semibold text-primary"
            >
              See All <ChevronRight size={12} />
            </button>
          </div>
          <Card padding="p-0">
            <div className="divide-y divide-border/30">
              {topMovers.map((stock, i) => (
                <button
                  key={stock.symbol}
                  onClick={() => handleInstrumentClick(stock)}
                  className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-surface/50 active:bg-surface transition-colors touch-active-subtle"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
                      <span className="text-[10px] font-bold text-text-secondary">{stock.symbol.slice(0, 2)}</span>
                    </div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-text-primary">{stock.symbol}</p>
                      <p className="text-[10px] text-text-muted">{stock.name}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Sparkline data={stock.sparkline} positive={stock.change >= 0} width={44} height={20} />
                    <div className="text-right min-w-[70px]">
                      <p className="text-xs font-bold text-text-primary tabular-nums">
                        {stock.price >= 100 ? '₹' : '$'}{stock.price >= 100 ? stock.price.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : stock.price.toFixed(4)}
                      </p>
                      <p className={cn(
                        'text-[10px] font-bold',
                        stock.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                      )}>
                        {formatPercent(stock.changePercent)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        {/* Market Status */}
        <div className="flex items-center gap-2 px-1 py-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse-dot" />
          <span className="text-[10px] font-medium text-text-muted">Market Open</span>
          <span className="text-[10px] text-text-muted/60 ml-auto">NSE · BSE</span>
        </div>
      </div>
    </div>
  );
}
