import { useState } from 'react';
import { Crown, Users, TrendingUp, TrendingDown, IndianRupee, Settings, Save, Shield, Zap, Eye, RefreshCw } from 'lucide-react';

const tierConfig = [
  { tier: 'Whale', icon: '🐋', criteria: 'Deposits > ₹10L', color: 'blue', clients: 12, spread: 'Tightest', slippage: 'Minimal', leverage: '100x', withdrawalDelay: '2 hrs', profitCap: '₹2,00,000/day', creditLine: 'Up to ₹20L', rm: 'Personal RM', deposit: 8500000, avgPnl: 45000 },
  { tier: 'Regular', icon: '👤', criteria: 'Deposits ₹1-10L', color: 'gray', clients: 68, spread: 'Standard', slippage: 'Moderate', leverage: '50x', withdrawalDelay: '24 hrs', profitCap: '₹50,000/day', creditLine: 'Up to ₹2L', rm: 'Ticket Support', deposit: 2400000, avgPnl: -12000 },
  { tier: 'Retail', icon: '🏷️', criteria: 'Deposits < ₹1L', color: 'yellow', clients: 142, spread: 'Wider', slippage: 'Aggressive', leverage: '20x', withdrawalDelay: '48 hrs', profitCap: '₹15,000/day', creditLine: 'None', rm: 'Self-Service', deposit: 350000, avgPnl: -8500 },
  { tier: 'Profitable', icon: '⚡', criteria: 'Win Rate > 60%', color: 'red', clients: 15, spread: 'Widest', slippage: 'Maximum', leverage: '10x', withdrawalDelay: '72 hrs', profitCap: '₹25,000/day', creditLine: 'None', rm: 'Under Watch', deposit: 1200000, avgPnl: 85000 },
  { tier: 'New User', icon: '🌱', criteria: 'Account < 30 days', color: 'green', clients: 28, spread: 'Promotional', slippage: 'Minimal', leverage: '50x', withdrawalDelay: '72 hrs (1st WD)', profitCap: '₹30,000/day', creditLine: 'None', rm: 'Onboarding Bot', deposit: 180000, avgPnl: -3200 },
];

const recentMigrations = [
  { time: '14:30', client: 'TDX-10921', from: 'Regular', to: 'Whale', reason: 'Deposited ₹12,00,000 (total crossed ₹10L threshold)' },
  { time: '13:15', client: 'TDX-84110', from: 'Whale', to: 'Profitable', reason: 'Win rate climbed to 78% over 30-day window' },
  { time: '11:00', client: 'TDX-55012', from: 'New User', to: 'Retail', reason: 'Account age exceeded 30 days' },
  { time: '09:30', client: 'TDX-33201', from: 'Retail', to: 'Regular', reason: 'Cumulative deposits crossed ₹1L' },
];

export default function ClientTiers() {
  const [editingTier, setEditingTier] = useState(null);
  const totalClients = tierConfig.reduce((s, t) => s + t.clients, 0);
  const totalDeposits = tierConfig.reduce((s, t) => s + t.deposit, 0);

  const getTierBg = (color) => ({
    blue: 'bg-blue-50 border-blue-200', gray: 'bg-gray-50 border-gray-200', yellow: 'bg-yellow-50 border-yellow-200',
    red: 'bg-red-50 border-red-200', green: 'bg-green-50 border-green-200',
  }[color] || 'bg-gray-50 border-gray-200');

  const getTierText = (color) => ({
    blue: 'text-blue-700', gray: 'text-gray-700', yellow: 'text-yellow-700', red: 'text-red-700', green: 'text-green-700',
  }[color] || 'text-gray-700');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Automated Client Tier System</h1>
          <p className="text-sm text-gray-500 mt-1">Auto-classify clients for differentiated spreads, leverage, withdrawal rules & profit caps.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => console.log('Action triggered')} className="inline-flex items-center rounded-md text-sm font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 py-2"><RefreshCw className="h-4 w-4 mr-2" /> Re-Classify All</button>
          <button onClick={() => console.log('Action triggered')} className="inline-flex items-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 shadow-sm"><Save className="h-4 w-4 mr-2" /> Save Tier Rules</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-blue-500" /><span className="text-xs font-bold text-gray-500 uppercase">Total Clients</span></div>
          <div className="text-xl font-black text-gray-900">{totalClients}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><IndianRupee className="h-4 w-4 text-green-500" /><span className="text-xs font-bold text-gray-500 uppercase">Total Deposits</span></div>
          <div className="text-xl font-black text-green-600">₹{(totalDeposits / 100000).toFixed(1)}L</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Crown className="h-4 w-4 text-purple-500" /><span className="text-xs font-bold text-gray-500 uppercase">Tier Count</span></div>
          <div className="text-xl font-black text-gray-900">{tierConfig.length} Tiers</div>
        </div>
        <div className="bg-red-50 p-5 rounded-lg border border-red-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Shield className="h-4 w-4 text-red-500" /><span className="text-xs font-bold text-gray-500 uppercase">Profitable Clients</span></div>
          <div className="text-xl font-black text-red-600">{tierConfig.find(t => t.tier === 'Profitable')?.clients || 0}</div>
          <div className="text-[10px] text-red-500 mt-0.5">Under maximum restriction</div>
        </div>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tierConfig.map((t, i) => (
          <div key={t.tier} className={`rounded-lg border-2 ${getTierBg(t.color)} p-5 relative overflow-hidden`}>
            <div className="absolute top-3 right-3 text-3xl opacity-20">{t.icon}</div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{t.icon}</span>
                <h3 className={`text-lg font-black ${getTierText(t.color)}`}>{t.tier}</h3>
                <span className="text-[10px] font-bold bg-white/60 px-2 py-0.5 rounded text-gray-600">{t.clients} clients</span>
              </div>
              <p className="text-xs text-gray-600 font-medium mb-3">{t.criteria}</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Spread', value: t.spread },
                  { label: 'Slippage', value: t.slippage },
                  { label: 'Leverage', value: t.leverage },
                  { label: 'Withdrawal', value: t.withdrawalDelay },
                  { label: 'Profit Cap', value: t.profitCap },
                  { label: 'Credit Line', value: t.creditLine },
                  { label: 'Support', value: t.rm },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">{item.label}</span>
                    <span className="font-bold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-200/50 flex justify-between">
                <div>
                  <div className="text-[9px] text-gray-500 uppercase font-bold">Avg Deposit</div>
                  <div className="text-xs font-black text-gray-900">₹{(t.deposit / 100000).toFixed(1)}L</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] text-gray-500 uppercase font-bold">Avg Daily PnL</div>
                  <div className={`text-xs font-black ${t.avgPnl >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {t.avgPnl >= 0 ? '+' : ''}₹{t.avgPnl.toLocaleString('en-IN')}
                    <span className="text-[9px] ml-1">{t.avgPnl >= 0 ? '(clients winning)' : '(house earns)'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setEditingTier(editingTier === i ? null : i)} className="mt-3 w-full py-1.5 text-xs font-bold bg-white/80 rounded border border-gray-200 hover:bg-white transition-colors text-gray-700">
                {editingTier === i ? '✓ Close' : '✎ Edit Rules'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Migration Log */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Zap className="h-4 w-4 text-purple-600" /> Recent Tier Migrations</h2>
          <span className="text-[10px] text-gray-500">Auto-triggered by system rules</span>
        </div>
        <div className="divide-y divide-gray-100">
          {recentMigrations.map((m, i) => (
            <div key={i} className="px-4 py-3 hover:bg-gray-50 flex items-center gap-4">
              <span className="text-xs font-mono text-gray-400 w-12">{m.time}</span>
              <span className="text-xs font-bold text-blue-600 w-20">{m.client}</span>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{m.from}</span>
                <span className="text-gray-400">→</span>
                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{m.to}</span>
              </div>
              <span className="text-xs text-gray-500 flex-1">{m.reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
