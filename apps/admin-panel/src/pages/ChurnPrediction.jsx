import React, { useState } from 'react';
import { Search, AlertCircle, Calendar, Mail, MessageSquare, TrendingDown, Clock, ArrowRightLeft } from 'lucide-react';

export default function ChurnPrediction() {
  const [clients] = useState([
    { id: 'TDX-1192', name: 'Rahul Sharma', lastActive: '45 days ago', risk: 85, balance: '₹4,500', trades: 0, status: 'Dormant' },
    { id: 'TDX-2041', name: 'Sneha Patel', lastActive: '28 days ago', risk: 60, balance: '₹12,000', trades: 2, status: 'At Risk' },
    { id: 'TDX-0881', name: 'Vikram Singh', lastActive: '60 days ago', risk: 95, balance: '₹150', trades: 0, status: 'Churned' },
    { id: 'TDX-3309', name: 'Neha Gupta', lastActive: '14 days ago', risk: 30, balance: '₹45,000', trades: 1, status: 'Slipping' },
  ]);

  const handleAction = (action, client) => {
    alert(`${action} triggered for ${client.name} (${client.id}).`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Churn Prediction & Dormant Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">Identify clients with dropping engagement and trigger automated re-engagement campaigns.</p>
        </div>
        <button onClick={() => alert('Opening campaign automation rules...')} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
          Auto-Campaign Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Clock className="w-4 h-4 text-orange-500" /> At Risk (30d+)</div>
          <div className="text-2xl font-bold text-gray-900">142</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><TrendingDown className="w-4 h-4 text-red-500" /> Dormant (60d+)</div>
          <div className="text-2xl font-bold text-red-600">89</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><ArrowRightLeft className="w-4 h-4 text-green-500" /> Recovered This Month</div>
          <div className="text-2xl font-bold text-green-600">34</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><AlertCircle className="w-4 h-4 text-blue-500" /> Total Churn Risk</div>
          <div className="text-2xl font-bold text-gray-900">₹4.2M <span className="text-sm font-normal text-gray-500">AUM</span></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search dormant clients..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Risk Levels</option>
            <option>High Risk (&gt;80%)</option>
            <option>Medium Risk (50-80%)</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Client Info</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">30d Trades</th>
                <th className="py-3 px-4">Wallet Balance</th>
                <th className="py-3 px-4">Churn Risk</th>
                <th className="py-3 px-4 text-right">Engagement Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clients.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">
                     <div className="font-bold text-gray-900">{item.name}</div>
                     <div className="text-xs text-gray-500">{item.id}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600"><Calendar className="w-3 h-3 inline mr-1" />{item.lastActive}</td>
                  <td className="py-3 px-4 font-medium text-gray-700">{item.trades}</td>
                  <td className="py-3 px-4 font-medium">{item.balance}</td>
                  <td className="py-3 px-4">
                     <div className="flex items-center gap-2">
                        <div className="w-full bg-gray-200 rounded-full h-1.5 max-w-[60px]">
                           <div className={`h-1.5 rounded-full ${item.risk > 80 ? 'bg-red-500' : item.risk > 50 ? 'bg-orange-500' : 'bg-yellow-500'}`} style={{ width: `${item.risk}%` }}></div>
                        </div>
                        <span className={`text-xs font-bold ${item.risk > 80 ? 'text-red-600' : item.risk > 50 ? 'text-orange-600' : 'text-yellow-600'}`}>{item.risk}%</span>
                     </div>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                     <button onClick={() => handleAction('Re-engagement Email', item)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Send Email"><Mail className="w-4 h-4" /></button>
                     <button onClick={() => handleAction('Push Notification', item)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Send Push Notification"><MessageSquare className="w-4 h-4" /></button>
                     <button onClick={() => handleAction('Bonus Credit', item)} className="text-xs font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 px-2 py-1 rounded border border-purple-200 ml-2">Add Bonus</button>
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
