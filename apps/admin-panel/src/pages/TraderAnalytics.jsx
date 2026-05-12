import React, { useState, useEffect } from 'react';
import { Search, TrendingDown, Zap, Activity, AlertOctagon, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { adminApi } from '../services/adminApi';

export default function TraderAnalytics() {
  const [behaviorData, setBehaviorData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTraderAnalytics();
      setBehaviorData(data.behaviorData || []);
      setPieData(data.pieData || []);
      setBarData(data.barData || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trader Behavior Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Identify patterns: frequent losers, scalpers, and over-leveraged accounts.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => alert('Exporting trader analytics data as CSV...')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export Data
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <AlertOctagon className="w-4 h-4 text-red-500" /> At-Risk Accounts
          </div>
          <div className="text-2xl font-bold text-gray-900">42</div>
          <div className="text-xs text-red-500 mt-1">Over 90% Margin Utilized</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <TrendingDown className="w-4 h-4 text-orange-500" /> Frequent Losers
          </div>
          <div className="text-2xl font-bold text-gray-900">128</div>
          <div className="text-xs text-gray-500 mt-1">Win rate &lt; 30%</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <Zap className="w-4 h-4 text-blue-500" /> High-Frequency
          </div>
          <div className="text-2xl font-bold text-gray-900">35</div>
          <div className="text-xs text-gray-500 mt-1">&gt; 100 trades / day</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <Activity className="w-4 h-4 text-green-500" /> Active Scalpers
          </div>
          <div className="text-2xl font-bold text-gray-900">85</div>
          <div className="text-xs text-gray-500 mt-1">Hold time &lt; 5 mins</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Charts */}
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Trader Segmentation</h3>
            <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                     {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-4 mt-2">
               {pieData.map(item => (
                  <div key={item.name} className="flex items-center gap-2 text-xs font-medium text-gray-600">
                     <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                     {item.name}
                  </div>
               ))}
            </div>
         </div>

         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4">Trade Volume by Time (Platform)</h3>
            <div className="h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={barData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                   <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                   <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                   <Tooltip cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                   <Bar dataKey="trades" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
           <h3 className="font-bold text-gray-900">Tagged Clients</h3>
          <div className="flex items-center gap-2 flex-1 min-w-[200px] max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by Client ID..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Client ID</th>
                <th className="py-3 px-4">Behavior Tag</th>
                <th className="py-3 px-4 text-right">Trades (30d)</th>
                <th className="py-3 px-4 text-center">Win Rate</th>
                <th className="py-3 px-4 text-right">Net PnL</th>
                <th className="py-3 px-4 text-center">Margin Util.</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                 <tr><td colSpan="7" className="py-8 text-center text-gray-500">Loading trader analytics...</td></tr>
              ) : behaviorData.length > 0 ? behaviorData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{item.client}</td>
                  <td className="py-3 px-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium 
                        ${item.type === 'High-Frequency' ? 'bg-blue-100 text-blue-700' : 
                          item.type === 'Frequent Loser' ? 'bg-red-100 text-red-700' :
                          item.type === 'Over-leveraged' ? 'bg-orange-100 text-orange-700' :
                          'bg-green-100 text-green-700'}`}>
                        {item.type}
                     </span>
                  </td>
                  <td className="py-3 px-4 text-right font-medium">{item.trades}</td>
                  <td className="py-3 px-4 text-center font-medium text-gray-700">{item.winRate}</td>
                  <td className={`py-3 px-4 text-right font-bold ${item.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                     {item.pnl >= 0 ? '+' : ''}{item.pnl}
                  </td>
                  <td className="py-3 px-4 text-center">
                     <span className={`font-bold ${parseInt(item.marginUtil) > 90 ? 'text-red-600' : 'text-gray-700'}`}>
                        {item.marginUtil}
                     </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                     <button onClick={() => alert(`Client: ${item.client}\nBehavior: ${item.type}\nTrades (30d): ${item.trades}\nWin Rate: ${item.winRate}\nPnL: ₹${item.pnl}\nMargin: ${item.marginUtil}`)} className="text-blue-600 hover:underline font-medium text-xs">View Details</button>
                  </td>
                </tr>
              )) : (
                 <tr><td colSpan="7" className="py-8 text-center text-gray-500">No trader data available.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
