import React, { useState, useEffect } from 'react';
import { Search, ToggleLeft, ToggleRight, Server, Save, Loader2, Plus } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function FeatureFlags() {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [newFlag, setNewFlag] = useState('');

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('feature-flags');
      setFlags(res.feature_flags || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const toggleFlag = async (id, currentStatus) => {
    try {
      const newStatus = !currentStatus;
      await adminApi.updateCrmModule('feature-flags', id, { is_enabled: newStatus });
      setFlags(flags.map(f => f.id === id ? { ...f, is_enabled: newStatus } : f));
    } catch (err) {
      console.error('Failed to toggle flag:', err);
      alert('Failed to toggle feature flag');
    }
  };

  const handleCreateFlag = async () => {
    if (!newFlag) return;
    try {
      const res = await adminApi.createCrmModule('feature-flags', {
        flag_name: newFlag,
        description: 'New feature flag',
        is_enabled: false
      });
      if (res.data) {
        setFlags([res.data, ...flags]);
      }
      setNewFlag('');
    } catch (err) {
      console.error('Failed to create flag:', err);
      alert('Failed to create flag. Ensure the name is unique.');
    }
  };

  const filteredFlags = flags.filter(f => f.flag_name?.toLowerCase().includes(searchQuery.toLowerCase()) || f.description?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
          <p className="text-sm text-gray-500 mt-1">Toggle platform features on/off instantly without deploying new code.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => fetchFlags()} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
            Refresh
          </button>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
        <Server className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div>
           <h3 className="text-sm font-bold text-orange-800">Live Environment Warning</h3>
           <p className="text-sm text-orange-700 mt-1">Changes made here take effect immediately across all connected client applications and master nodes.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search flags..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <input type="text" value={newFlag} onChange={e => setNewFlag(e.target.value)} placeholder="New flag name" className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
             <button onClick={handleCreateFlag} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
               <Plus className="w-4 h-4" /> Add Flag
             </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 flex justify-center text-gray-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading flags...</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Flag Key</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredFlags.map((item) => (
                  <tr key={item.id} className={`transition-colors ${!item.is_enabled ? 'bg-gray-50' : 'hover:bg-gray-50'}`}>
                    <td className="py-3 px-4 font-mono text-xs font-bold text-gray-900">{item.flag_name}</td>
                    <td className="py-3 px-4">
                       <div className="text-gray-500 text-xs mt-0.5">{item.description}</div>
                    </td>
                    <td className="py-3 px-4 text-center">
                       <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${item.is_enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {item.is_enabled ? 'ENABLED' : 'DISABLED'}
                       </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                       <button onClick={() => toggleFlag(item.id, item.is_enabled)} className={`transition-colors ${item.is_enabled ? 'text-green-500' : 'text-gray-400 hover:text-gray-500'}`}>
                          {item.is_enabled ? <ToggleRight className="w-8 h-8 inline" /> : <ToggleLeft className="w-8 h-8 inline" />}
                       </button>
                    </td>
                  </tr>
                ))}
                {filteredFlags.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-gray-500">No feature flags found.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
