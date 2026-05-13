import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, Loader2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Logs() {
  const [activeTab, setActiveTab] = useState('admin');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getAuditLogs();
        setLogs(data.logs || []);
      } catch (err) {
        console.error('Failed to fetch logs', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const adminLogs = logs.filter(log => log.target_type !== 'user_auth');
  const userLogs = logs.filter(log => log.target_type === 'user_auth');

  const filteredLogs = (activeTab === 'admin' ? adminLogs : userLogs).filter(log => 
    JSON.stringify(log).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">System Logs & Audit</h1>
      </div>

      {activeTab === 'admin' && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Advanced Audit Logging Enabled</h3>
            <p className="text-xs text-red-700 mt-1">
              All administrative actions (modifications, adjustments, system changes) are permanently recorded and cannot be altered or deleted.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Tabs & Filters */}
        <div className="border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-4 py-3 gap-4">
          <nav className="flex space-x-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('admin')}
              className={`px-3 py-1.5 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'admin' 
                  ? 'bg-white shadow-sm text-blue-700 border border-gray-200' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Admin Audit Log
            </button>
            <button
              onClick={() => setActiveTab('user')}
              className={`px-3 py-1.5 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'user' 
                  ? 'bg-white shadow-sm text-blue-700 border border-gray-200' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              User Security Logs
            </button>
          </nav>
          
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              {activeTab === 'admin' ? (
                <tr>
                  <th className="px-4 py-2 font-semibold">Log ID</th>
                  <th className="px-4 py-2 font-semibold">Action Type</th>
                  <th className="px-4 py-2 font-semibold">Detailed Changes</th>
                  <th className="px-4 py-2 font-semibold text-right">IP Address</th>
                  <th className="px-4 py-2 font-semibold text-right">Time</th>
                </tr>
              ) : (
                <tr>
                  <th className="px-4 py-2 font-semibold">Log ID</th>
                  <th className="px-4 py-2 font-semibold">User</th>
                  <th className="px-4 py-2 font-semibold">Action Description</th>
                  <th className="px-4 py-2 font-semibold text-right">IP Address</th>
                  <th className="px-4 py-2 font-semibold text-right">Time</th>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto h-6 w-6 mb-2" /> Loading logs...</td></tr>
              ) : filteredLogs.length === 0 ? (
                <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No logs found.</td></tr>
              ) : activeTab === 'admin' ? filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/50">
                  <td className="px-4 py-2 font-medium text-gray-900 text-xs">LOG-{log.id.substring(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-2 font-medium text-gray-800">{log.action.replace(/_/g, ' ').toUpperCase()}</td>
                  <td className="px-4 py-2 text-gray-600 text-xs whitespace-normal max-w-md">{log.description}</td>
                  <td className="px-4 py-2 text-gray-500 font-mono text-[10px] text-right">{log.ip_address || '—'}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs text-right">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              )) : filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/50">
                  <td className="px-4 py-2 font-medium text-gray-900 text-xs">ULOG-{log.id.substring(0, 8).toUpperCase()}</td>
                  <td className="px-4 py-2 font-medium text-blue-600">{log.profiles?.full_name || log.target_id}</td>
                  <td className="px-4 py-2 text-gray-700">{log.description}</td>
                  <td className="px-4 py-2 text-gray-500 font-mono text-[10px] text-right">{log.ip_address || '—'}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs text-right">{new Date(log.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
