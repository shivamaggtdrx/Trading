import React, { useState, useEffect } from 'react';
import { Shield, Search, MapPin, Monitor, Globe, Ban, CheckCircle, Plus, X, Loader2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function IPWhitelist() {
  const [showAddRule, setShowAddRule] = useState(false);
  const [logins, setLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newRule, setNewRule] = useState({ ip_address: '', action: 'allow', note: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const fetchWhitelist = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('ip-whitelist');
      setLogins(res.ip_whitelist || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAllow = async (id) => {
    try {
      await adminApi.updateCrmModule('ip-whitelist', id, { action: 'allow' });
      fetchWhitelist();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const handleBlock = async (id, ip) => {
    if (window.confirm(`Block IP ${ip}? This client will be unable to login from this address.`)) {
      try {
        await adminApi.updateCrmModule('ip-whitelist', id, { action: 'block' });
        fetchWhitelist();
      } catch (err) {
        alert('Failed to block IP');
      }
    }
  };

  const handleAddRule = async () => {
    if (!newRule.ip_address) return alert('IP Address is required');
    try {
      setSaving(true);
      await adminApi.createCrmModule('ip-whitelist', {
        ip_address: newRule.ip_address,
        action: newRule.action,
        note: newRule.note,
        client_id: 'SYSTEM'
      });
      setShowAddRule(false);
      setNewRule({ ip_address: '', action: 'allow', note: '' });
      fetchWhitelist();
    } catch (err) {
      alert('Failed to add IP rule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IP & Device Whitelisting</h1>
          <p className="text-sm text-gray-500 mt-1">Track client logins, set geo-restrictions, and monitor suspicious activity.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddRule(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add IP Rule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Globe className="w-5 h-5" /></div>
               <div>
                  <div className="text-sm text-gray-500 font-medium">Total Rules</div>
                  <div className="text-xl font-bold">{logins.length}</div>
               </div>
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Monitor className="w-5 h-5" /></div>
               <div>
                  <div className="text-sm text-gray-500 font-medium">Flagged Logins</div>
                  <div className="text-xl font-bold">{logins.filter(l => l.action === 'flagged').length}</div>
               </div>
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle className="w-5 h-5" /></div>
               <div>
                  <div className="text-sm text-gray-500 font-medium">Blocked IPs</div>
                  <div className="text-xl font-bold">{logins.filter(l => l.action === 'block').length}</div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by IP, Client ID..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Client ID</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Note</th>
                <th className="py-3 px-4">Added On</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="p-6 text-center text-gray-500">Loading rules...</td></tr>
              ) : logins.length === 0 ? (
                <tr><td colSpan="6" className="p-6 text-center text-gray-500">No IP rules configured.</td></tr>
              ) : logins.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.action === 'block' ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4 font-medium text-gray-900">{item.client_id || 'System'}</td>
                  <td className="py-3 px-4 font-mono text-xs font-bold">{item.ip_address}</td>
                  <td className="py-3 px-4 text-gray-600">{item.note || '-'}</td>
                  <td className="py-3 px-4 text-gray-500">{new Date(item.created_at).toLocaleString()}</td>
                  <td className="py-3 px-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase tracking-wide ${
                       item.action === 'allow' ? 'bg-green-100 text-green-700' :
                       item.action === 'block' ? 'bg-red-100 text-red-700' :
                       'bg-orange-100 text-orange-700'
                     }`}>
                        {item.action || 'Unknown'}
                     </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                     {item.action === 'flagged' && (
                        <>
                           <button onClick={() => handleAllow(item.id)} className="text-green-600 hover:underline font-medium text-xs">Allow</button>
                           <button onClick={() => handleBlock(item.id, item.ip_address)} className="text-red-600 hover:underline font-medium text-xs">Block</button>
                        </>
                     )}
                     {item.action === 'allow' && (
                        <button onClick={() => handleBlock(item.id, item.ip_address)} className="text-red-600 hover:underline font-medium text-xs">Block IP</button>
                     )}
                     {item.action === 'block' && (
                        <button onClick={() => handleAllow(item.id)} className="text-blue-600 hover:underline font-medium text-xs">Unblock</button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add IP Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add IP Rule</h2>
              <button onClick={() => setShowAddRule(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address</label>
                <input 
                  type="text" 
                  placeholder="e.g. 103.45.67.12" 
                  value={newRule.ip_address}
                  onChange={e => setNewRule({...newRule, ip_address: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select 
                  value={newRule.action}
                  onChange={e => setNewRule({...newRule, action: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="allow">Allow (Whitelist)</option>
                  <option value="block">Block (Blacklist)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input 
                  type="text" 
                  placeholder="e.g. Office VPN" 
                  value={newRule.note}
                  onChange={e => setNewRule({...newRule, note: e.target.value})}
                  className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" 
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setShowAddRule(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleAddRule} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add Rule'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
