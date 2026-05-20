import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Calendar, Mail, MessageSquare, TrendingDown, Clock, ArrowRightLeft } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function ChurnPrediction() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getChurnPrediction()
      .then(res => setClients(res.clients || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleAction = (action, client) => {
    alert(`${action} triggered for ${client.name} (${client.id}).`);
  };

  const atRiskCount = clients.filter(c => c.daysInactive > 14 && c.daysInactive <= 60).length;
  const dormantCount = clients.filter(c => c.daysInactive > 60).length;
  const totalAUMRisk = clients.filter(c => c.daysInactive > 14).reduce((sum, c) => sum + c.balance, 0);

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
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Clock className="w-4 h-4 text-orange-500" /> At Risk (&gt;14d)</div>
          <div className="text-2xl font-bold text-gray-900">{atRiskCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><TrendingDown className="w-4 h-4 text-red-500" /> Dormant (60d+)</div>
          <div className="text-2xl font-bold text-red-600">{dormantCount}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><ArrowRightLeft className="w-4 h-4 text-green-500" /> Recovered This Month</div>
          <div className="text-2xl font-bold text-green-600">0</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><AlertCircle className="w-4 h-4 text-blue-500" /> Total Churn Risk</div>
          <div className="text-2xl font-bold text-gray-900">₹{totalAUMRisk.toLocaleString('en-IN')} <span className="text-sm font-normal text-gray-500">AUM</span></div>
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
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">Wallet Balance</th>
                <th className="py-3 px-4">Churn Risk</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">Calculating churn risk...</td></tr>
              ) : clients.length === 0 ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">No active clients found.</td></tr>
              ) : clients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                     <div className="font-medium text-gray-900">{client.name}</div>
                     <div className="text-xs text-gray-500 font-mono">{client.id}</div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{client.lastActive}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">₹{client.balance.toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4">
                     <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                           <div 
                             className={`h-full ${client.risk > 80 ? 'bg-red-500' : client.risk > 50 ? 'bg-orange-500' : 'bg-green-500'}`} 
                             style={{width: `${client.risk}%`}}
                           ></div>
                        </div>
                        <span className="text-xs font-bold text-gray-700">{client.risk}%</span>
                     </div>
                  </td>
                  <td className="py-3 px-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase ${
                        client.status === 'Dormant' ? 'bg-red-100 text-red-700' :
                        client.status === 'At Risk' ? 'bg-orange-100 text-orange-700' :
                        client.status === 'Slipping' ? 'bg-yellow-100 text-yellow-700' :
                        client.status === 'Churned' ? 'bg-gray-200 text-gray-600' :
                        'bg-green-100 text-green-700'
                     }`}>
                        {client.status}
                     </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-3">
                     <button onClick={() => handleAction('Email Campaign', client)} className="text-blue-600 hover:text-blue-800" title="Send Email">
                        <Mail className="w-4 h-4 inline" />
                     </button>
                     <button onClick={() => handleAction('SMS Alert', client)} className="text-green-600 hover:text-green-800" title="Send SMS">
                        <MessageSquare className="w-4 h-4 inline" />
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
