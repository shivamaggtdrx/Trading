import React, { useState, useEffect } from 'react';
import { Sliders, Save, Users, TrendingUp, IndianRupee, Zap, AlertTriangle, RefreshCw } from 'lucide-react';
import { adminApi } from '../services/adminApi';

const slippageRules = [
  { range: '< ₹50,000', delay: '0-100ms', slippage: 'Minimal (0-0.01%)', favorHouse: '60%', description: 'Retain new users with fair execution' },
  { range: '₹50K - ₹2L', delay: '100-300ms', slippage: 'Moderate (0.02-0.05%)', favorHouse: '75%', description: 'Standard execution with house edge' },
  { range: '₹2L - ₹10L', delay: '300-800ms', slippage: 'Aggressive (0.05-0.15%)', favorHouse: '85%', description: 'Large orders = larger house take' },
  { range: '> ₹10L', delay: '500-1500ms', slippage: 'Maximum (0.10-0.30%)', favorHouse: '90%', description: 'Whale orders — max requote window' },
];

const revenueImpact = [
  { metric: 'Spread Revenue (Today)', value: '₹2,45,000', change: '+18%', positive: true },
  { metric: 'Slippage Revenue (Today)', value: '₹1,82,000', change: '+24%', positive: true },
  { metric: 'Requote Rate', value: '12.4%', change: '-2%', positive: true },
  { metric: 'Client Complaints', value: '3', change: '+1', positive: false },
];

export default function SmartSpread() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTier, setEditingTier] = useState(null);
  const [newsMultiplier, setNewsMultiplier] = useState(3);
  const [volatilityAutoWiden, setVolatilityAutoWiden] = useState(true);

  const fetchProfiles = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('smart-spreads');
      const data = res?.spreads || res?.smart_spreads || [];
      const mapped = (data || []).map(p => ({
        id: p.id,
        tier: p.profile_name,
        criteria: p.status,
        clients: p.active_clients,
        equitySpread: parseFloat(p.base_spread) || 0.05,
        foSpread: parseFloat(p.base_spread) * 1.5 || 0.08,
        forexSpread: parseFloat(p.base_spread) * 10 || 1.2,
        metalSpread: parseFloat(p.base_spread) * 5 || 0.3,
        color: p.profile_name.includes('VIP') ? 'blue' : 'gray'
      }));
      setProfiles(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const getTierColor = (color) => ({
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
  }[color] || 'bg-gray-100 text-gray-600 border-gray-200');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Smart Spread & Slippage Engine</h1>
          <p className="text-sm text-gray-500 mt-1">Per-client dynamic spreads based on tier profiling. Maximize revenue per trade.</p>
        </div>
        <button onClick={() => alert('Saved all rules')} className="inline-flex items-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 shadow-sm"><Save className="h-4 w-4 mr-2" /> Save All Rules</button>
      </div>

      {/* Revenue Impact */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {revenueImpact.map(item => (
          <div key={item.metric} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
            <div className="text-xs font-bold text-gray-500 uppercase mb-1">{item.metric}</div>
            <div className="text-xl font-black text-gray-900">{item.value}</div>
            <div className={`text-xs font-bold mt-1 ${item.positive ? 'text-green-600' : 'text-red-600'}`}>{item.change} vs yesterday</div>
          </div>
        ))}
      </div>

      {/* Tier-Based Spread Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Sliders className="h-4 w-4 text-blue-600" /> Per-Tier Spread Configuration</h2>
          <span className="text-[10px] text-gray-500 font-medium">Spreads in % of instrument price</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Profile Name</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold text-center">Active Clients</th>
                <th className="px-4 py-3 font-semibold text-center">Equity (%)</th>
                <th className="px-4 py-3 font-semibold text-center">F&O (%)</th>
                <th className="px-4 py-3 font-semibold text-center">Forex (pips)</th>
                <th className="px-4 py-3 font-semibold text-center">Metals (%)</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-500">Loading spread profiles...</td></tr>
              ) : profiles.length === 0 ? (
                <tr><td colSpan="8" className="p-8 text-center text-gray-500">No spread profiles found.</td></tr>
              ) : profiles.map((p, i) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2.5 py-1 rounded border ${getTierColor(p.color)}`}>{p.tier}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-600 font-medium">{p.criteria}</td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">{p.clients}</td>
                  <td className="px-4 py-3 text-center">
                    {editingTier === i ? <input type="number" step="0.01" defaultValue={p.equitySpread} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold" /> : <span className="font-bold text-gray-700">{p.equitySpread}%</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingTier === i ? <input type="number" step="0.01" defaultValue={p.foSpread} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold" /> : <span className="font-bold text-gray-700">{p.foSpread}%</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingTier === i ? <input type="number" step="0.1" defaultValue={p.forexSpread} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold" /> : <span className="font-bold text-gray-700">{p.forexSpread}</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {editingTier === i ? <input type="number" step="0.01" defaultValue={p.metalSpread} className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm font-bold" /> : <span className="font-bold text-gray-700">{p.metalSpread}%</span>}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setEditingTier(editingTier === i ? null : i)} className={`px-2 py-1 text-[10px] font-bold rounded border ${editingTier === i ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {editingTier === i ? 'Save' : 'Edit'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slippage Rules */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Zap className="h-4 w-4 text-purple-600" /> Dynamic Slippage by Order Size</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Order Value Range</th>
                <th className="px-4 py-3 font-semibold text-center">Execution Delay</th>
                <th className="px-4 py-3 font-semibold text-center">Slippage Range</th>
                <th className="px-4 py-3 font-semibold text-center">House Favor %</th>
                <th className="px-4 py-3 font-semibold">Strategy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {slippageRules.map(rule => (
                <tr key={rule.range} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900">{rule.range}</td>
                  <td className="px-4 py-3 text-center"><span className="text-xs font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded">{rule.delay}</span></td>
                  <td className="px-4 py-3 text-center"><span className="text-xs font-bold text-gray-700">{rule.slippage}</span></td>
                  <td className="px-4 py-3 text-center"><span className={`text-xs font-black ${parseInt(rule.favorHouse) >= 85 ? 'text-red-600' : parseInt(rule.favorHouse) >= 75 ? 'text-orange-600' : 'text-green-600'}`}>{rule.favorHouse}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-500">{rule.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event-Based Spread Widening */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-orange-600" /> Event-Based Auto-Widening</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">News Event Spread Multiplier</label>
            <div className="flex items-center gap-3">
              <input type="range" min="1" max="10" value={newsMultiplier} onChange={e => setNewsMultiplier(+e.target.value)} className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-orange-600" />
              <span className="text-lg font-black text-orange-600 w-12 text-right">{newsMultiplier}x</span>
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Multiply base spreads by this factor during RBI announcements, GDP data, etc.</p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Auto-Widen on Volatility Spike</h3>
                <p className="text-xs text-gray-500">Automatically increase spreads when 5-min volatility exceeds 2x average</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" checked={volatilityAutoWiden} onChange={() => setVolatilityAutoWiden(!volatilityAutoWiden)} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
              </label>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
              <p className="text-xs text-orange-700"><strong>Revenue Opportunity:</strong> Enabling this during high-impact events (Union Budget, RBI MPC) has historically generated 3-5x daily spread revenue.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
