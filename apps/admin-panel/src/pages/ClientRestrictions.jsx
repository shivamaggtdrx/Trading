import { useState } from 'react';
import { ShieldBan, Lock, Search, Save, UserX, ToggleLeft, ToggleRight, AlertTriangle } from 'lucide-react';

export default function ClientRestrictions() {
  const [searchQuery, setSearchQuery] = useState('TDX-84110');
  
  // Dummy state for restrictions
  const [restrictions, setRestrictions] = useState({
    login: true,
    trading: true,
    withdrawals: true,
    mcx: false,
    options: true,
    leverageMultiplier: 0.5, // 0.5x of global
    maxOrderValue: 500000
  });

  const toggle = (key) => setRestrictions(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Restrictions</h1>
          <p className="text-sm text-gray-500 mt-1">Apply specific blocks, segment bans, or custom limits to individual accounts.</p>
        </div>
        <button onClick={() => alert('Action triggered. Backend integration pending.')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 shadow-sm">
          <Save className="h-4 w-4 mr-2" />
          Save Client Config
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">Search Client ID</label>
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-blue-500 ring-1 ring-blue-500 rounded-md text-base font-bold bg-blue-50 focus:outline-none"
          />
        </div>
        
        <div className="mt-4 flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
            <UserX className="h-6 w-6 text-gray-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Flagged Trader</h2>
            <p className="text-sm text-gray-500">TDX-84110 • Active since: 2025-10-12</p>
          </div>
          <div className="ml-auto">
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded text-xs font-bold uppercase border border-orange-200">Under Review</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Lock className="h-5 w-5 text-gray-600" />
            <h3 className="font-bold text-gray-900">Account Level Access</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="text-sm font-bold text-gray-900">Login Access</div>
                <div className="text-xs text-gray-500">Allow user to log into the terminal</div>
              </div>
              <button onClick={() => toggle('login')}>
                {restrictions.login ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}
              </button>
            </div>
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="text-sm font-bold text-gray-900">Trading Access</div>
                <div className="text-xs text-gray-500">Allow placing new orders</div>
              </div>
              <button onClick={() => toggle('trading')}>
                {restrictions.trading ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-900">Withdrawals</div>
                <div className="text-xs text-gray-500">Allow requesting payouts</div>
              </div>
              <button onClick={() => toggle('withdrawals')}>
                {restrictions.withdrawals ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <ShieldBan className="h-5 w-5 text-red-500" />
            <h3 className="font-bold text-gray-900">Segment Blocks</h3>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <div className="text-sm font-bold text-gray-900">F&O Options Trading</div>
                <div className="text-xs text-gray-500">Enable/disable option buying/selling</div>
              </div>
              <button onClick={() => toggle('options')}>
                {restrictions.options ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-bold text-gray-900 text-red-600">MCX Commodities</div>
                <div className="text-xs text-gray-500">Blocked for this user</div>
              </div>
              <button onClick={() => toggle('mcx')}>
                {restrictions.mcx ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-gray-300" />}
              </button>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <h3 className="font-bold text-gray-900">Custom Risk Overrides</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Leverage Multiplier</label>
              <div className="flex items-center gap-2">
                <input 
                  type="number" 
                  step="0.1"
                  value={restrictions.leverageMultiplier}
                  onChange={(e) => setRestrictions(prev => ({...prev, leverageMultiplier: parseFloat(e.target.value)}))}
                  className="w-24 px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 font-bold" 
                />
                <span className="text-sm text-gray-500 font-medium">x of Global Segment Margin</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">E.g., 0.5 means client gets half the normal leverage.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Max Single Order Value (₹)</label>
              <input 
                type="number" 
                value={restrictions.maxOrderValue}
                onChange={(e) => setRestrictions(prev => ({...prev, maxOrderValue: parseInt(e.target.value)}))}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 font-bold" 
              />
              <p className="text-xs text-gray-500 mt-1">Block orders exceeding this notional value.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
