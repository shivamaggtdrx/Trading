import React, { useState, useEffect } from 'react';
import { Key, Copy, CheckCircle, Search, ShieldAlert, Activity } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function APIKeys() {
  const [copied, setCopied] = useState(null);
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchKeys = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('api-keys');
      setApiKeys(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleRevoke = async (id) => {
    if (window.confirm('Revoke this API Key?')) {
      try {
        await adminApi.updateCrmModule('api-keys', id, { status: 'Revoked' });
        fetchKeys();
      } catch (err) {
        alert('Failed to revoke API key');
      }
    }
  };

  const handleGenerate = async () => {
    const name = window.prompt('Enter application name for new API key:');
    if (!name) return;
    try {
      await adminApi.updateCrmModule('api-keys', 'new', {
        name,
        user_id: 'System',
        key: `pk_live_${Math.random().toString(36).substring(2, 10)}`,
        req_per_sec: 10,
        status: 'Active'
      });
      fetchKeys();
    } catch (err) {
      alert('Failed to generate API key');
    }
  };

  const filteredKeys = apiKeys.filter(api => 
    api.name?.toLowerCase().includes(search.toLowerCase()) || 
    api.key?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API & Algorithmic Trading</h1>
          <p className="text-sm text-gray-500 mt-1">Manage FIX/REST API connections, rate limits, and webhook integrations.</p>
        </div>
        <button onClick={handleGenerate} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
          <Key className="h-4 w-4 mr-2" />
          Generate New API Key
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500">API Traffic (24h)</h3>
            <div className="text-2xl font-black text-gray-900">12.4M Req</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Key className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500">Active Keys</h3>
            <div className="text-2xl font-black text-gray-900">{apiKeys.filter(k => k.status === 'Active').length}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-red-50 text-red-600 rounded-lg">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500">Rate Limit Hits (24h)</h3>
            <div className="text-2xl font-black text-red-600">8,902</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Manage API Keys</h2>
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search API Name or Key..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">App Name</th>
                <th className="px-6 py-3 font-semibold">Owner</th>
                <th className="px-6 py-3 font-semibold">API Key Token</th>
                <th className="px-6 py-3 font-semibold text-center">Rate Limit (Req/s)</th>
                <th className="px-6 py-3 font-semibold">Last Used</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">Loading API keys...</td></tr>
              ) : filteredKeys.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-8 text-gray-500">No API keys found.</td></tr>
              ) : filteredKeys.map((api) => (
                <tr key={api.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4 font-bold text-gray-900">{api.name}</td>
                  <td className="px-6 py-4 text-blue-600 hover:underline cursor-pointer font-bold">{api.user_id}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-600">{api.key}</code>
                      <button 
                        onClick={() => copyToClipboard(api.key)}
                        className="text-gray-400 hover:text-blue-600 transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied === api.key ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-gray-700 bg-gray-50/50">{api.req_per_sec || api.reqPerSec}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{api.last_used ? new Date(api.last_used).toLocaleString() : 'Never'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      api.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {api.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {api.status === 'Active' ? (
                      <button onClick={() => handleRevoke(api.id)} className="text-red-600 hover:text-red-800 font-bold text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors">
                        Revoke Key
                      </button>
                    ) : (
                      <span className="text-gray-400 text-xs font-bold">Revoked</span>
                    )}
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
