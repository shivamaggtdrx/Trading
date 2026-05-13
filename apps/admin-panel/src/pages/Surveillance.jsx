import { useState, useEffect } from 'react';
import { Search, ShieldAlert, Crosshair, TrendingDown, Clock, Settings, RefreshCw, Loader2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Surveillance() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAlerts();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id) => {
    try {
      await adminApi.resolveAlert(id);
      fetchAlerts();
    } catch (err) {
      alert('Failed to resolve alert');
    }
  };

  const filteredAlerts = alerts.filter(a => activeTab === 'all' || a.status === activeTab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Advanced Risk Surveillance</h1>
          <p className="text-sm text-gray-500 mt-1">Auto-detection of price manipulation and scalping</p>
        </div>
        <button onClick={() => console.log('Action triggered')} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
          <Settings className="h-4 w-4 mr-2" />
          Surveillance Settings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm flex items-center">
          <ShieldAlert className="h-8 w-8 text-red-600 mr-3" />
          <div>
            <div className="text-xs font-bold text-red-800 uppercase tracking-wide">Critical Alerts</div>
            <div className="text-2xl font-black text-red-700">12</div>
          </div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 shadow-sm flex items-center">
          <Crosshair className="h-8 w-8 text-orange-600 mr-3" />
          <div>
            <div className="text-xs font-bold text-orange-800 uppercase tracking-wide">Scalping Attempts</div>
            <div className="text-2xl font-black text-orange-700">45</div>
          </div>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow-sm flex items-center">
          <TrendingDown className="h-8 w-8 text-yellow-600 mr-3" />
          <div>
            <div className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Latency Arbs</div>
            <div className="text-2xl font-black text-yellow-700">8</div>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm flex items-center">
          <RefreshCw className="h-8 w-8 text-blue-600 mr-3" />
          <div>
            <div className="text-xs font-bold text-blue-800 uppercase tracking-wide">System Scans</div>
            <div className="text-2xl font-black text-blue-700">100k/s</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Tabs & Filters */}
        <div className="border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-4 py-3 gap-4">
          <nav className="flex space-x-2" aria-label="Tabs">
            {['active', 'resolved', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize px-3 py-1.5 font-medium text-sm rounded-md transition-colors ${
                  activeTab === tab 
                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab} Alerts
              </button>
            ))}
          </nav>
          
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search User or Script..."
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Alert ID</th>
                <th className="px-4 py-3 font-semibold">Severity</th>
                <th className="px-4 py-3 font-semibold">User</th>
                <th className="px-4 py-3 font-semibold">Type</th>
                <th className="px-4 py-3 font-semibold">Description</th>
                <th className="px-4 py-3 font-semibold">Script</th>
                <th className="px-4 py-3 font-semibold text-right">Time</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">Loading surveillance data...</td></tr>
              ) : filteredAlerts.length > 0 ? filteredAlerts.map((alert) => (
                <tr key={alert.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900 text-xs truncate max-w-[80px]" title={alert.id}>{alert.id.split('-')[0]}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      alert.severity === 'Critical' ? 'bg-red-100 text-red-800 border border-red-200' :
                      alert.severity === 'High' ? 'bg-orange-100 text-orange-800 border border-orange-200' :
                      'bg-yellow-100 text-yellow-800 border border-yellow-200'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-blue-600 hover:underline cursor-pointer">{alert.profiles?.client_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{alert.type}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs max-w-xs truncate" title={alert.description}>{alert.description}</td>
                  <td className="px-4 py-3 font-bold text-gray-700">{alert.script}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs text-right"><Clock className="inline-block h-3 w-3 mr-1"/>{new Date(alert.created_at).toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    {alert.status === 'active' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => console.log('Action triggered')} className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700">Block User</button>
                        <button onClick={() => handleResolve(alert.id)} className="px-2 py-1 border border-gray-300 text-gray-700 text-xs font-bold rounded hover:bg-gray-50">Dismiss</button>
                      </div>
                    ) : (
                      <span className="text-green-600 font-bold text-xs">Resolved</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No alerts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
