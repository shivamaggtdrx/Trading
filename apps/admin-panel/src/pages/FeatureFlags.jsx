import React, { useState } from 'react';
import { Search, ToggleLeft, ToggleRight, Server, Save } from 'lucide-react';

export default function FeatureFlags() {
  const [flags, setFlags] = useState([
    { id: 'fno_trading', name: 'F&O Trading', desc: 'Enable Futures & Options trading segment globally.', status: true, env: 'Production' },
    { id: 'mcx_trading', name: 'MCX Trading', desc: 'Enable Commodities trading segment globally.', status: true, env: 'Production' },
    { id: 'new_dashboard', name: 'New Dashboard UI', desc: 'Roll out the v2 dashboard UI to all clients.', status: false, env: 'Production' },
    { id: 'crypto_deposits', name: 'Crypto Deposits', desc: 'Enable USDT deposits via payment gateway.', status: false, env: 'Beta' },
    { id: 'auto_square_off', name: 'Auto Square-Off', desc: 'Master toggle for automated intraday square-off at 3:15 PM.', status: true, env: 'Production' },
    { id: 'referral_system', name: 'Referral System', desc: 'Enable client-side referral links and payout generation.', status: true, env: 'Production' },
  ]);

  const toggleFlag = (id) => {
    setFlags(flags.map(f => f.id === id ? { ...f, status: !f.status } : f));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-sm text-gray-500 mt-1">Toggle platform features on/off instantly without deploying new code.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { alert('Feature flag configuration saved successfully. Changes are now live across all clients.'); }} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
        <Server className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div>
           <h3 className="text-sm font-bold text-orange-800">Live Environment Warning</h3>
           <p className="text-sm text-orange-700 mt-1">Changes made here take effect immediately across all connected client applications and master nodes.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search flags..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
               <option>All Environments</option>
               <option>Production</option>
               <option>Beta / Testing</option>
             </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Flag Key</th>
                <th className="py-3 px-4">Feature Name & Description</th>
                <th className="py-3 px-4">Environment</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {flags.map((item) => (
                <tr key={item.id} className={`transition-colors ${!item.status ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{item.id}</td>
                  <td className="py-3 px-4">
                     <div className="font-bold text-gray-900">{item.name}</div>
                     <div className="text-gray-500 text-xs mt-0.5">{item.desc}</div>
                  </td>
                  <td className="py-3 px-4">
                     <span className={`px-2 py-1 rounded text-xs font-medium ${item.env === 'Production' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                        {item.env}
                     </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                     <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.status ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.status ? 'ENABLED' : 'DISABLED'}
                     </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                     <button onClick={() => toggleFlag(item.id)} className={`transition-colors ${item.status ? 'text-green-500' : 'text-gray-400 hover:text-gray-500'}`}>
                        {item.status ? <ToggleRight className="w-8 h-8 inline" /> : <ToggleLeft className="w-8 h-8 inline" />}
                     </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
