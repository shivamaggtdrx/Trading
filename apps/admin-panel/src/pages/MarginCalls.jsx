import { useState, useEffect } from 'react';
import { AlertTriangle, Phone, Mail, Ban, TrendingDown, Clock, Search, ShieldAlert, CheckCircle } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function MarginCalls() {
  const [activeTab, setActiveTab] = useState('all');
  const [marginCalls, setMarginCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMarginCalls = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getMarginCalls();
      setMarginCalls(data.marginCalls || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarginCalls();
  }, []);

  const filtered = activeTab === 'all' ? marginCalls : marginCalls.filter(m => m.status === activeTab);
  
  const getUsageColor = (usage) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 80) return 'bg-orange-500';
    return 'bg-yellow-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Margin Call Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Monitor accounts near liquidation and manage automated warnings.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => alert('Action triggered. Backend integration pending.')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 shadow-sm">
            <Ban className="h-4 w-4 mr-2" />
            Liquidate Critical Accounts
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-red-600 animate-pulse" />
            <h3 className="text-sm font-bold text-red-800">Critical Zone (&gt;90%)</h3>
          </div>
          <div className="text-3xl font-black text-red-700">{marginCalls.filter(m => m.usage >= 90).length}</div>
          <p className="text-xs text-red-600 mt-2 font-medium">Eligible for auto-liquidation</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
            <h3 className="text-sm font-bold text-orange-800">Warning Zone (80-90%)</h3>
          </div>
          <div className="text-3xl font-black text-orange-700">{marginCalls.filter(m => m.usage >= 80 && m.usage < 90).length}</div>
          <p className="text-xs text-orange-600 mt-2 font-medium">Receiving automated SMS/Emails</p>
        </div>
        <div className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h3 className="text-sm font-bold text-gray-800">Escalation Activity</h3>
          </div>
          <div className="text-3xl font-black text-gray-900">12</div>
          <p className="text-xs text-gray-500 mt-2 font-medium">Warnings sent today</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-4 py-3 gap-4">
          <nav className="flex space-x-2">
            {['all', 'critical', 'warning', 'monitoring'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`capitalize px-3 py-1.5 font-medium text-sm rounded-md transition-colors ${
                  activeTab === tab ? 'bg-white shadow-sm text-blue-700 border border-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}>
                {tab}
              </button>
            ))}
          </nav>
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input type="text" placeholder="Search client ID or name..." className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 bg-white" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold text-center">Margin Usage</th>
                <th className="px-4 py-3 font-semibold text-right">Exposure</th>
                <th className="px-4 py-3 font-semibold text-right">Available Margin</th>
                <th className="px-4 py-3 font-semibold">Last Notified</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Manual Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500">Loading margin calls...</td></tr>
              ) : filtered.length > 0 ? filtered.map(mc => (
                <tr key={mc.id} className={`hover:bg-gray-50 ${mc.status === 'critical' ? 'bg-red-50/20' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{mc.name}</div>
                    <div className="text-[10px] text-blue-600 font-medium">{mc.client}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getUsageColor(mc.usage)}`} style={{ width: `${mc.usage}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${mc.usage >= 90 ? 'text-red-600' : mc.usage >= 80 ? 'text-orange-600' : 'text-yellow-600'}`}>
                        {mc.usage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">₹{mc.exposure.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-600">₹{mc.margin.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Clock className="h-3 w-3" /> {mc.notified}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      mc.status === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                      mc.status === 'warning' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                      'bg-yellow-100 text-yellow-700 border-yellow-200'
                    }`}>
                      {mc.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => alert('Action triggered. Backend integration pending.')} className="px-2.5 py-1 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 text-[10px] font-bold rounded shadow-sm inline-flex items-center gap-1">
                        <Mail className="h-3 w-3" /> Warn
                      </button>
                      <button onClick={() => alert('Action triggered. Backend integration pending.')} className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 text-[10px] font-bold rounded shadow-sm inline-flex items-center gap-1">
                        <TrendingDown className="h-3 w-3" /> Square Off
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500">No margin calls found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
