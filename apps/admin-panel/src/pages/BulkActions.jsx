import React, { useState } from 'react';
import { Users, Upload, CheckCircle, Ban, ArrowRightLeft, MessageSquare, RefreshCw } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function BulkActions() {
  const [actionType, setActionType] = useState('block');
  const [userIds, setUserIds] = useState('');
  const [amount, setAmount] = useState('');
  const [narration, setNarration] = useState('');
  const [loading, setLoading] = useState(false);

  const actions = [
    { id: 'block', label: 'Block Accounts', icon: Ban, color: 'red' },
    { id: 'unblock', label: 'Unblock Accounts', icon: CheckCircle, color: 'green' },
    { id: 'credit', label: 'Credit Wallet', icon: ArrowRightLeft, color: 'blue' },
    { id: 'notify', label: 'Send Notification', icon: MessageSquare, color: 'purple' },
  ];

  const parsedIds = userIds.split(',').map(id => id.trim()).filter(id => id.length > 0);
  const selectedCount = parsedIds.length;

  const handleExecute = async () => {
    if (selectedCount === 0) return;
    
    let confirmMsg = `Are you sure you want to ${actionType} ${selectedCount} user(s)?\n\nTarget IDs: ${parsedIds.slice(0, 3).join(', ')}${parsedIds.length > 3 ? '...' : ''}`;
    
    if (actionType === 'credit') {
       if (!amount) {
         alert('Please enter an amount to credit.');
         return;
       }
       confirmMsg += `\n\nAmount: ₹${amount}\nNarration: ${narration || 'None'}`;
    }

    if (window.confirm(confirmMsg)) {
      try {
        setLoading(true);
        const res = await adminApi.executeBulkAction({
          action: actionType,
          target: parsedIds.join(','),
          count: selectedCount,
          amount: actionType === 'credit' ? amount : undefined,
          narration: actionType === 'credit' ? narration : undefined
        });
        alert(res.message || `Bulk action "${actionType}" executed successfully for ${selectedCount} users.`);
        setUserIds('');
        setAmount('');
        setNarration('');
      } catch (err) {
        alert('Failed to execute bulk action');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk User Actions</h1>
        <p className="text-sm text-gray-500 mt-1">Perform actions on multiple users simultaneously via CSV upload or ID list.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 max-w-4xl relative">
        {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center rounded-lg z-10"><RefreshCw className="h-8 w-8 text-blue-500 animate-spin" /></div>}
        <h2 className="text-sm font-bold text-gray-900 mb-4">1. Select Action Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {actions.map(act => {
            const Icon = act.icon;
            const isSelected = actionType === act.id;
            return (
              <button 
                key={act.id} 
                onClick={() => setActionType(act.id)}
                className={`p-4 rounded-lg border text-center transition-all ${
                  isSelected 
                    ? `border-${act.color}-500 bg-${act.color}-50 ring-1 ring-${act.color}-500` 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Icon className={`h-6 w-6 mx-auto mb-2 ${isSelected ? `text-${act.color}-600` : 'text-gray-400'}`} />
                <span className={`text-sm font-bold ${isSelected ? `text-${act.color}-900` : 'text-gray-700'}`}>{act.label}</span>
              </button>
            );
          })}
        </div>

        <h2 className="text-sm font-bold text-gray-900 mb-4">2. Target Users</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Comma Separated User IDs</label>
            <textarea value={userIds} onChange={(e) => setUserIds(e.target.value)} rows="4" placeholder="TDX-82491, TDX-10921..." className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 text-sm font-mono"></textarea>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-2">Or Upload CSV File</label>
            <div onClick={() => alert('CSV upload simulation: Populating user IDs.') || setUserIds('TDX-9001, TDX-9002, TDX-9003')} className="border-2 border-dashed border-gray-300 rounded-lg h-24 flex flex-col items-center justify-center text-gray-500 hover:bg-gray-50 hover:border-blue-400 cursor-pointer transition-colors">
              <Upload className="h-6 w-6 mb-1" />
              <span className="text-xs font-bold">Click or drag CSV here</span>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Required columns: `user_id`</p>
          </div>
        </div>

        {actionType === 'credit' && (
          <div className="mb-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h2 className="text-sm font-bold text-gray-900 mb-4">3. Action Payload</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Amount (₹)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Narration / Remark</label>
                <input type="text" value={narration} onChange={(e) => setNarration(e.target.value)} placeholder="e.g. Bonus Credit" className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500" />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 pt-6">
          <div className="text-sm text-gray-600">
            <span className="font-bold text-gray-900">{selectedCount}</span> users selected.
          </div>
          <button 
             onClick={handleExecute}
             disabled={selectedCount === 0 || loading}
             className="bg-blue-600 text-white font-bold px-8 py-2.5 rounded-md hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all">
            {loading ? 'Executing...' : 'Review & Execute Bulk Action'}
          </button>
        </div>
      </div>
    </div>
  );
}
