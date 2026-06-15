import { useState, useEffect } from 'react';
import { ShieldAlert, Save, Search, UserCheck, Trash2, Shield, Loader2, Info } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function TradingLimits() {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [limits, setLimits] = useState({
    daily_order_limit: '',
    max_position_size: '',
    max_open_positions: '',
    notes: ''
  });
  const [hasLimits, setHasLimits] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load a few users initially to populate the list
  useEffect(() => {
    searchUsers('');
  }, []);

  const searchUsers = async (query) => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers(1, 10, query);
      setUsers(res.users || []);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = async (user) => {
    setSelectedUser(user);
    setSearchQuery(user.client_id || user.email);
    setUsers([]); // Close dropdown
    
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });
      const res = await adminApi.getUserTradingLimits(user.id);
      
      if (res && res.limits) {
        setLimits({
          daily_order_limit: res.limits.daily_order_limit ?? '',
          max_position_size: res.limits.max_position_size ?? '',
          max_open_positions: res.limits.max_open_positions ?? '',
          notes: res.limits.notes ?? ''
        });
        setHasLimits(true);
      } else {
        setLimits({
          daily_order_limit: '',
          max_position_size: '',
          max_open_positions: '',
          notes: ''
        });
        setHasLimits(false);
      }
    } catch (err) {
      console.error('Failed to fetch user limits:', err);
      setMessage({ type: 'error', text: 'Failed to load limits for user.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      const payload = {
        daily_order_limit: limits.daily_order_limit === '' ? null : parseInt(limits.daily_order_limit),
        max_position_size: limits.max_position_size === '' ? null : parseInt(limits.max_position_size),
        max_open_positions: limits.max_open_positions === '' ? null : parseInt(limits.max_open_positions),
        notes: limits.notes
      };

      const res = await adminApi.setUserTradingLimits(selectedUser.id, payload);
      
      setMessage({ type: 'success', text: res.message || 'Trading limits saved successfully!' });
      setHasLimits(true);
    } catch (err) {
      console.error('Failed to save limits:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to save limits.' });
    } finally {
      setSaving(false);
    }
  };

  const handleClear = async () => {
    if (!selectedUser) return;
    if (!confirm('Are you sure you want to clear all custom limits for this user?')) return;

    try {
      setSaving(true);
      setMessage({ type: '', text: '' });
      
      await adminApi.deleteUserTradingLimits(selectedUser.id);
      
      setLimits({
        daily_order_limit: '',
        max_position_size: '',
        max_open_positions: '',
        notes: ''
      });
      setHasLimits(false);
      setMessage({ type: 'success', text: 'All limits cleared successfully.' });
    } catch (err) {
      console.error('Failed to clear limits:', err);
      setMessage({ type: 'error', text: err.message || 'Failed to clear limits.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Trading Limits</h1>
          <p className="text-sm text-gray-500 mt-1">Set and enforce per-user daily order caps, trade size limits, and maximum open positions.</p>
        </div>
      </div>

      {message.text && (
        <div className={`p-4 rounded-md border text-sm font-medium ${
          message.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      {/* User Search Bar */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 relative">
        <label className="block text-sm font-bold text-gray-700 mb-2">Search and Select Client</label>
        <div className="flex gap-2">
          <div className="relative max-w-md w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                searchUsers(e.target.value);
              }}
              placeholder="Search by Client ID or Email..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
            />
            {users.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100">
                {users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleSelectUser(user)}
                    className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm font-medium flex items-center justify-between"
                  >
                    <span>{user.client_id || user.email} ({user.email})</span>
                    <span className="text-xs text-gray-400 capitalize">{user.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {loading && !selectedUser ? (
          <div className="mt-4 flex items-center text-gray-500 p-2"><Loader2 className="w-5 h-5 animate-spin mr-2"/> Loading...</div>
        ) : selectedUser ? (
          <div className="mt-4 flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
              <UserCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{selectedUser.client_id || 'Client Selected'}</h2>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${
                hasLimits ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}>
                {hasLimits ? 'Custom Limits Active' : 'Using Global Defaults'}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-4 text-sm text-gray-500 p-2 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-gray-400" /> Search and select a user to configure custom trading limits.
          </div>
        )}
      </div>

      {selectedUser && (
        <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="md:col-span-2 space-y-6">
            
            {/* Limit Fields */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                <h3 className="font-bold text-gray-900">Trading Limits Configuration</h3>
              </div>
              <div className="p-6 space-y-6">
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Daily Order Count Limit</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="No limit"
                    value={limits.daily_order_limit}
                    onChange={(e) => setLimits(prev => ({ ...prev, daily_order_limit: e.target.value }))}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 font-bold" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of orders (market/limit) this user can place per calendar day. Resets at midnight. Leave empty for no limit.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Position Size Cap (Qty per Order)</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="No limit"
                    value={limits.max_position_size}
                    onChange={(e) => setLimits(prev => ({ ...prev, max_position_size: e.target.value }))}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 font-bold" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum quantity allowed for any single order. Prevents oversized fat-finger trades. Leave empty for no limit.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Max Concurrent Open Positions</label>
                  <input 
                    type="number" 
                    min="1"
                    placeholder="No limit"
                    value={limits.max_open_positions}
                    onChange={(e) => setLimits(prev => ({ ...prev, max_open_positions: e.target.value }))}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 font-bold" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum number of concurrent open positions this trader can hold at one time. Leave empty for no limit.</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Administrative Notes</label>
                  <textarea 
                    rows="3"
                    placeholder="Reason for limits, risk assessment notes..."
                    value={limits.notes}
                    onChange={(e) => setLimits(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 font-medium" 
                  />
                </div>

              </div>
            </div>

            <div className="flex gap-4">
              <button 
                type="submit" 
                disabled={saving} 
                className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 shadow-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Limits
              </button>

              {hasLimits && (
                <button 
                  type="button" 
                  onClick={handleClear}
                  disabled={saving} 
                  className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 h-10 px-6 py-2 shadow-sm disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Limits
                </button>
              )}
            </div>

          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 space-y-4">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" /> Risk Enforcement Info
              </div>
              <p className="text-xs text-gray-600 leading-relaxed">
                Trading limits are checked in real-time by the risk validation engine prior to execution.
              </p>
              <p className="text-xs text-gray-600 leading-relaxed">
                Any modifications made here will immediately invalidate the user's cached limits in Redis, taking effect on the very next order placement.
              </p>
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-400 font-medium">Logged Admin IP: 127.0.0.1</span>
              </div>
            </div>
          </div>

        </form>
      )}
    </div>
  );
}
