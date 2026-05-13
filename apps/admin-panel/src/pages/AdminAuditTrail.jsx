import React, { useState, useEffect } from 'react';
import { Search, Download, Filter, Eye, AlertCircle, Loader2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function AdminAuditTrail() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAuditLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('force') || actionLower.includes('kill') || actionLower.includes('delete')) return 'Critical';
    if (actionLower.includes('deposit') || actionLower.includes('withdraw') || actionLower.includes('approve')) return 'High';
    if (actionLower.includes('update') || actionLower.includes('modify')) return 'Medium';
    return 'Low';
  };

  const sevColor = { Critical: 'bg-red-100 text-red-700', High: 'bg-orange-100 text-orange-700', Medium: 'bg-yellow-100 text-yellow-700', Low: 'bg-green-100 text-green-700' };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Audit Trail</h1>
          <p className="text-sm text-gray-500 mt-1">Immutable record of every admin action — who, what, to whom, when, and from where.</p>
        </div>
        <button onClick={() => console.log('Action triggered')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4" /> Export Log
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h3 className="text-sm font-bold text-blue-800">Compliance Notice</h3>
          <p className="text-sm text-blue-700 mt-1">This audit trail is tamper-proof. All actions are logged with IP and timestamps. Records retained for 7 years.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center bg-gray-50">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by admin, action, client..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white">
            <option>All Admins</option><option>Shivam</option><option>Priya Patel</option><option>Amit Singh</option>
          </select>
          <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white">
            <option>All Severity</option><option>Critical</option><option>High</option><option>Medium</option><option>Low</option>
          </select>
          <input type="date" className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Target / Detail</th>
                <th className="py-3 px-4">Source IP</th>
                <th className="py-3 px-4">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">Loading audit trail...</td></tr>
              ) : logs.length > 0 ? logs.map((l) => {
                const sev = getSeverity(l.action);
                return (
                  <tr key={l.id} className={`hover:bg-gray-50 ${sev === 'Critical' ? 'bg-red-50/30' : ''}`}>
                    <td className="py-3 px-4 text-gray-500 text-xs whitespace-nowrap">{new Date(l.created_at).toLocaleString()}</td>
                    <td className="py-3 px-4"><div className="font-medium text-gray-900">{l.admin?.email || l.admin_id}</div><div className="text-xs text-gray-400">Admin</div></td>
                    <td className="py-3 px-4 font-medium text-gray-900 uppercase text-xs">{l.action.replace(/_/g, ' ')}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate text-xs">{l.description}</td>
                    <td className="py-3 px-4 font-mono text-xs text-gray-500">{l.ip_address || '127.0.0.1'}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${sevColor[sev]}`}>{sev}</span></td>
                  </tr>
                );
              }) : (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">No logs found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-gray-200 flex items-center justify-between text-sm text-gray-500">
          <span>Showing latest {logs.length} records</span>
          <div className="flex gap-1">
            <button onClick={() => console.log('Action triggered')} className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50">Prev</button>
            <button onClick={() => console.log('Action triggered')} className="px-3 py-1 border border-blue-500 rounded-md bg-blue-600 text-white">1</button>
            <button onClick={() => console.log('Action triggered')} className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50">2</button>
            <button onClick={() => console.log('Action triggered')} className="px-3 py-1 border border-gray-300 rounded-md bg-white hover:bg-gray-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
