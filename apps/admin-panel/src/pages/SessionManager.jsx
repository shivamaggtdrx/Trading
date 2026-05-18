import React, { useState, useEffect } from 'react';
import { Search, Monitor, LogOut, Clock, Shield, Smartphone, Globe, Settings, Loader2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function SessionManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('sessions');
      setSessions(res.sessions || []);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const adminSessions = sessions.filter(s => s.type === 'Admin');
  const clientSessions = sessions.filter(s => s.type === 'Client');
  const uniqueIps = new Set(sessions.map(s => s.ip)).size;

  const handleTerminateAll = async () => {
    if (!window.confirm('Terminate ALL client sessions? Users will be instantly logged out.')) return;
    try {
      // Future: Real API call to terminate all
      const clients = sessions.filter(s => s.type === 'Client');
      for (const c of clients) {
        await adminApi.deleteCrmModule('sessions', c.id);
      }
      alert('Client sessions terminated');
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert('Failed to terminate sessions');
    }
  };

  const handleTerminate = async (id) => {
    if (!window.confirm('Terminate this session?')) return;
    try {
      await adminApi.deleteCrmModule('sessions', id);
      fetchSessions();
    } catch (err) {
      console.error(err);
      alert('Failed to terminate session');
    }
  };

  const filteredClientSessions = clientSessions.filter(s => 
    s.user_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.ip?.includes(searchQuery)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Manager</h1>
          <p className="text-sm text-gray-500 mt-1">View all active sessions, force logout remotely, and configure idle timeouts.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchSessions} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">Refresh</button>
          <button onClick={handleTerminateAll} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm">
            <LogOut className="w-4 h-4" /> Terminate All Client Sessions
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Monitor className="w-4 h-4 text-blue-500" /> Admin Sessions</div>
          <div className="text-2xl font-bold text-gray-900">{adminSessions.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Smartphone className="w-4 h-4 text-green-500" /> Client Sessions</div>
          <div className="text-2xl font-bold text-gray-900">{clientSessions.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Clock className="w-4 h-4 text-orange-500" /> Idle Timeout</div>
          <div className="text-2xl font-bold text-gray-900">30 min</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Globe className="w-4 h-4 text-purple-500" /> Unique IPs</div>
          <div className="text-2xl font-bold text-gray-900">{uniqueIps}</div>
        </div>
      </div>

      {/* Timeout Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Settings className="w-5 h-5 text-blue-600" /></div>
            <div>
              <h3 className="font-bold text-gray-900">Idle Timeout Configuration</h3>
              <p className="text-sm text-gray-500">Auto-logout sessions after inactivity period.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Admin:</label>
              <select className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white">
                <option>15 min</option><option selected>30 min</option><option>60 min</option><option>120 min</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Client:</label>
              <select className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white">
                <option>5 min</option><option selected>15 min</option><option>30 min</option><option>60 min</option>
              </select>
            </div>
            <button onClick={() => alert('Settings saved')} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 flex justify-center text-gray-500 bg-white rounded-xl border border-gray-200"><Loader2 className="w-8 h-8 animate-spin mr-3" /> Loading sessions...</div>
      ) : (
        <>
          {/* Admin Sessions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="font-bold text-gray-900">Admin Sessions</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Admin</th>
                    <th className="py-3 px-4">Device</th>
                    <th className="py-3 px-4">IP / Location</th>
                    <th className="py-3 px-4">Started</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {adminSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4"><div className="font-medium text-gray-900">{s.user_name}</div><div className="text-xs text-gray-400 capitalize">{s.role}</div></td>
                      <td className="py-3 px-4 text-gray-600">{s.device}</td>
                      <td className="py-3 px-4"><div className="font-mono text-xs text-gray-500">{s.ip}</div><div className="text-xs text-gray-400">{s.location}</div></td>
                      <td className="py-3 px-4 text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(s.last_active).toLocaleString()}</td>
                      <td className="py-3 px-4"><span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full"></span><span className="text-xs font-medium text-green-700">{s.status}</span></span></td>
                      <td className="py-3 px-4 text-right"><button onClick={() => handleTerminate(s.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 text-xs font-medium">Force Logout</button></td>
                    </tr>
                  ))}
                  {adminSessions.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-gray-500">No active admin sessions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Client Sessions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-green-600" />
                <h3 className="font-bold text-gray-900">Client Sessions</h3>
              </div>
              <div className="relative max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search clients..." className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Device</th>
                    <th className="py-3 px-4">IP / Location</th>
                    <th className="py-3 px-4">Started</th>
                    <th className="py-3 px-4">Last Active</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredClientSessions.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">{s.user_name}</td>
                      <td className="py-3 px-4 text-gray-600">{s.device}</td>
                      <td className="py-3 px-4"><div className="font-mono text-xs text-gray-500">{s.ip}</div><div className="text-xs text-gray-400">{s.location}</div></td>
                      <td className="py-3 px-4 text-gray-500">{new Date(s.created_at).toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-500">{new Date(s.last_active).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`flex items-center gap-1.5`}>
                          <span className={`w-2 h-2 rounded-full ${s.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                          <span className={`text-xs font-medium ${s.status === 'Active' ? 'text-green-700' : 'text-yellow-700'}`}>{s.status}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right"><button onClick={() => handleTerminate(s.id)} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 text-xs font-medium">Force Logout</button></td>
                    </tr>
                  ))}
                  {filteredClientSessions.length === 0 && (
                    <tr><td colSpan={7} className="p-4 text-center text-gray-500">No active client sessions</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
