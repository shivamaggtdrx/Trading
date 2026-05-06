import { useState } from 'react';
import { Search, Filter, ShieldAlert } from 'lucide-react';

const adminLogs = [
  { id: 'LOG-005', admin: 'Shivam', role: 'Super Admin', action: 'Modified Trade', details: 'Changed TRD-5921 price from 150.00 to 150.50', ip: '192.168.1.1', time: '2026-05-04 10:48:00' },
  { id: 'LOG-004', admin: 'finance_lead', role: 'Finance', action: 'Manual Adjustment', details: 'Added ₹5,00,000 to TDX-82491. Note: Wire transfer cleared.', ip: '192.168.1.5', time: '2026-05-04 10:45:00' },
  { id: 'LOG-003', admin: 'support_agent', role: 'Support', action: 'Blocked User', details: 'Blocked TDX-10932. Note: Fraudulent activity detected.', ip: '10.0.0.5', time: '2026-05-04 09:22:15' },
  { id: 'LOG-002', admin: 'Shivam', role: 'Super Admin', action: 'System Config', details: 'Paused trading for XAUUSD instrument.', ip: '192.168.1.1', time: '2026-05-03 14:10:00' },
];

const userLogs = [
  { id: 'ULOG-992', user: 'TDX-82491', action: 'Failed login attempt (Invalid password)', ip: '203.0.113.42', time: '2026-05-04 10:40:00' },
  { id: 'ULOG-991', user: 'TDX-10966', action: 'Password reset requested', ip: '198.51.100.12', time: '2026-05-04 08:15:00' },
  { id: 'ULOG-990', user: 'TDX-10944', action: 'New IP login detected', ip: '45.22.11.10', time: '2026-05-03 22:05:00' },
];

export default function Logs() {
  const [activeTab, setActiveTab] = useState('admin');

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
                  <th className="px-4 py-2 font-semibold">Administrator</th>
                  <th className="px-4 py-2 font-semibold">Role</th>
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
              {activeTab === 'admin' ? adminLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/50">
                  <td className="px-4 py-2 font-medium text-gray-900 text-xs">{log.id}</td>
                  <td className="px-4 py-2 font-medium text-blue-600">{log.admin}</td>
                  <td className="px-4 py-2 text-xs">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${
                      log.role === 'Super Admin' ? 'bg-purple-100 text-purple-700' :
                      log.role === 'Finance' ? 'bg-green-100 text-green-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {log.role}
                    </span>
                  </td>
                  <td className="px-4 py-2 font-medium text-gray-800">{log.action}</td>
                  <td className="px-4 py-2 text-gray-600 text-xs whitespace-normal max-w-md">{log.details}</td>
                  <td className="px-4 py-2 text-gray-500 font-mono text-[10px] text-right">{log.ip}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs text-right">{log.time}</td>
                </tr>
              )) : userLogs.map((log) => (
                <tr key={log.id} className="hover:bg-blue-50/50">
                  <td className="px-4 py-2 font-medium text-gray-900 text-xs">{log.id}</td>
                  <td className="px-4 py-2 font-medium text-blue-600">{log.user}</td>
                  <td className="px-4 py-2 text-gray-700">{log.action}</td>
                  <td className="px-4 py-2 text-gray-500 font-mono text-[10px] text-right">{log.ip}</td>
                  <td className="px-4 py-2 text-gray-500 text-xs text-right">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
