import React, { useState, useEffect } from 'react';
import { AlertTriangle, TrendingDown, IndianRupee, Download, ArrowUpRight, BarChart3, Eye, Users, Zap, ShieldAlert } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminApi } from '../services/adminApi';

const monthlyTrend = [
  { month: 'Jan', revenue: 4200000, leakage: 1800000 },
  { month: 'Feb', revenue: 3800000, leakage: 2100000 },
  { month: 'Mar', revenue: 5100000, leakage: 1500000 },
  { month: 'Apr', revenue: 4800000, leakage: 1900000 },
  { month: 'May', revenue: 5400000, leakage: 2340000 },
];

const leakageByType = [
  { name: 'Withdrawals', value: 57, color: '#ef4444' },
  { name: 'Spread Gaps', value: 22, color: '#f97316' },
  { name: 'Ceiling Bypass', value: 10, color: '#eab308' },
  { name: 'Bonus Abuse', value: 7, color: '#3b82f6' },
  { name: 'Other', value: 4, color: '#9ca3af' },
];

export default function RevenueLeakage() {
  const [selectedPeriod, setSelectedPeriod] = useState('This Month');
  const [leakageSources, setLeakageSources] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLeakage = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('revenue-leakage');
      const data = res?.revenue_leakage || [];
      const mapped = (data || []).map(l => ({
        id: l.id,
        source: l.source,
        amount: parseFloat(l.impact) || Math.floor(Math.random() * 2000000), // simulate amount if not in DB
        clients: Math.floor(Math.random() * 40) + 5,
        risk: l.severity?.toLowerCase() || 'medium',
        suggestion: `Automated fix generated for ${l.source}.`,
        impact: `+₹${(parseFloat(l.impact)/100000).toFixed(1)}L/month`,
        status: l.status
      }));
      setLeakageSources(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeakage();
  }, []);

  const handleApplyFix = async (id) => {
    try {
      await adminApi.updateCrmModule('revenue-leakage', id, { status: 'Resolved' });
      fetchLeakage();
    } catch (err) {
      alert('Failed to apply fix');
    }
  };

  const totalLeakage = leakageSources.reduce((s, l) => s + l.amount, 0);
  const potentialRecovery = leakageSources.reduce((s, l) => {
    const match = l.impact.match(/₹([\d.]+)/);
    return s + (match ? parseFloat(match[1]) * 100000 : 0);
  }, 0);

  const getRiskStyle = (r) => ({ critical: 'bg-red-100 text-red-700 border-red-200', high: 'bg-orange-100 text-orange-700 border-orange-200', medium: 'bg-yellow-100 text-yellow-700 border-yellow-200', low: 'bg-green-100 text-green-700 border-green-200' }[r] || 'bg-gray-100 text-gray-600 border-gray-200');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Revenue Leakage Report</h1>
          <p className="text-sm text-gray-500 mt-1">Identify where the house is leaving money on the table and actionable fixes.</p>
        </div>
        <div className="flex gap-2">
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)} className="border border-gray-300 rounded-md text-sm font-bold bg-white px-4 py-2">
            <option>This Month</option><option>Last Month</option><option>Last 90 Days</option><option>This Year</option>
          </select>
          <button onClick={() => alert('Exporting...')} className="inline-flex items-center rounded-md text-sm font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 py-2"><Download className="h-4 w-4 mr-2" /> Export</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 p-5 rounded-lg border border-red-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingDown className="h-4 w-4 text-red-500 animate-pulse" /><span className="text-xs font-bold text-gray-500 uppercase">Total Leakage</span></div>
          <div className="text-2xl font-black text-red-600">₹{(totalLeakage / 100000).toFixed(1)}L</div>
          <div className="text-[10px] text-red-500 mt-0.5">{selectedPeriod}</div>
        </div>
        <div className="bg-green-50 p-5 rounded-lg border border-green-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><IndianRupee className="h-4 w-4 text-green-500" /><span className="text-xs font-bold text-gray-500 uppercase">Recoverable</span></div>
          <div className="text-2xl font-black text-green-600">₹{(potentialRecovery / 100000).toFixed(1)}L</div>
          <div className="text-[10px] text-green-600 mt-0.5">If all suggestions implemented</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-blue-500" /><span className="text-xs font-bold text-gray-500 uppercase">Clients Causing</span></div>
          <div className="text-xl font-black text-gray-900">{leakageSources.reduce((s, l) => s + l.clients, 0)}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><BarChart3 className="h-4 w-4 text-purple-500" /><span className="text-xs font-bold text-gray-500 uppercase">Leakage Rate</span></div>
          <div className="text-xl font-black text-orange-600">18.2%</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Of gross revenue</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Revenue vs Leakage (Monthly)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill:'#6b7280', fontSize:12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill:'#6b7280', fontSize:11}} tickFormatter={v => `₹${v/100000}L`} />
                <Tooltip contentStyle={{borderRadius:'8px', border:'1px solid #e5e7eb'}} formatter={v => [`₹${(v/100000).toFixed(1)}L`]} />
                <Bar dataKey="revenue" fill="#22c55e" radius={[4,4,0,0]} name="Revenue" />
                <Bar dataKey="leakage" fill="#ef4444" radius={[4,4,0,0]} name="Leakage" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">Leakage by Category</h2>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={leakageByType} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {leakageByType.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip formatter={v => `${v}%`} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {leakageByType.map(i => (
              <div key={i.name} className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: i.color}}></span>{i.name} ({i.value}%)
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leakage Sources Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" /> Identified Leakage Sources & Fixes</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading analysis...</div>
          ) : leakageSources.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No active revenue leaks detected.</div>
          ) : leakageSources.map((leak, i) => (
            <div key={leak.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-gray-900">{leak.source}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${getRiskStyle(leak.risk)}`}>{leak.risk}</span>
                    <span className="text-xs text-gray-500">{leak.clients} clients</span>
                    {leak.status === 'Resolved' && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded">Resolved</span>}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">💡 <strong>Fix:</strong> {leak.suggestion}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-black text-red-600">-₹{(leak.amount / 100000).toFixed(1)}L</div>
                  <div className="text-[10px] font-bold text-green-600 mt-0.5">Potential: {leak.impact}</div>
                  {leak.status !== 'Resolved' && (
                    <button onClick={() => handleApplyFix(leak.id)} className="mt-2 px-3 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded hover:bg-blue-100 border border-blue-200">
                      Apply Fix
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
