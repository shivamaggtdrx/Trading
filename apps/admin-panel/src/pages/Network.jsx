import { useState, useEffect } from 'react';
import { Users, TrendingUp, DollarSign, Search, ShieldCheck, ChevronRight } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Network() {
  const [masters, setMasters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getNetworkNodes()
      .then(res => {
        setMasters(res.nodes || res.data || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Master / Sub-Broker Network</h1>
          <p className="text-sm text-gray-500 mt-1">Manage B2B partners, credit limits, and weekly settlements.</p>
        </div>
        <button onClick={() => alert('Add Master Account coming soon')} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
          <Users className="h-4 w-4 mr-2" />
          Add Master Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Total Masters</h3>
            <div className="text-2xl font-bold text-gray-900">{masters.length}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Net Master M2M</h3>
            <div className="text-2xl font-bold text-green-600">+₹0</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <DollarSign className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Weekly Settlement Pending</h3>
            <div className="text-2xl font-bold text-gray-900">₹0</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Active Master Nodes</h2>
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search Master ID or Name..."
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Master ID</th>
                <th className="px-6 py-3 font-semibold">Entity Name</th>
                <th className="px-6 py-3 font-semibold text-center">Revenue Share</th>
                <th className="px-6 py-3 font-semibold text-right">Credit Limit (INR)</th>
                <th className="px-6 py-3 font-semibold text-right">Net M2M (INR)</th>
                <th className="px-6 py-3 font-semibold text-right">Brokerage Generated</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {masters.length === 0 ? (
                <tr><td colSpan="8" className="p-6 text-center text-gray-500">No network nodes found.</td></tr>
              ) : masters.map((master) => (
                <tr key={master.id} className="hover:bg-blue-50/50 group">
                  <td className="px-6 py-4 font-bold text-gray-900">{master.id.slice(0,8)}</td>
                  <td className="px-6 py-4 font-bold text-blue-600 hover:underline cursor-pointer">{master.name}</td>
                  <td className="px-6 py-4 text-center font-bold text-gray-700 bg-gray-50/50">{master.revenue_share_pct || 0}%</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">₹0</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-400">₹0</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">₹0</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-green-100 text-green-700">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => alert('Settlement not implemented')} className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors inline-flex items-center">
                      Settle Account <ChevronRight className="h-3 w-3 ml-1" />
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
