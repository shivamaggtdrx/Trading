import { useState, useEffect } from 'react';
import { Search, XCircle, Edit, ShieldAlert } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Orders() {
  const [activeTab, setActiveTab] = useState('open');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getOrders(activeTab);
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirm = (action, orderId) => {
    setConfirmAction({ action, orderId });
    setShowConfirm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Order Management</h1>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-4 py-3 gap-4">
          <nav className="flex space-x-2" aria-label="Tabs">
            {['open', 'completed', 'cancelled'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize px-3 py-1.5 font-medium text-sm rounded-md transition-colors ${
                  activeTab === tab 
                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200 ring-1 ring-black ring-opacity-5' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
          
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search Orders or Users..."
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-2 font-semibold">Order ID</th>
                <th className="px-4 py-2 font-semibold">User ID</th>
                <th className="px-4 py-2 font-semibold">Symbol / Type</th>
                <th className="px-4 py-2 font-semibold">Side</th>
                <th className="px-4 py-2 font-semibold text-right">Target Price (INR)</th>
                <th className="px-4 py-2 font-semibold text-right">Amount</th>
                <th className="px-4 py-2 font-semibold">Time</th>
                <th className="px-4 py-2 text-right font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : orders.length > 0 ? orders.map((order) => (
                <tr key={order.id} className="hover:bg-blue-50/50 group">
                  <td className="px-4 py-2 font-medium text-gray-900 text-xs">{order.id}</td>
                  <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer text-xs font-medium">
                    {order.profiles?.client_id || order.user_id}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-bold text-gray-900">{order.symbol}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-medium">{(order.order_type || order.type || '').replace('_', ' ')}</div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      order.side === 'buy' || order.side === 'long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {order.side === 'long' ? 'buy' : order.side === 'short' ? 'sell' : order.side}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">₹{(order.target_price || order.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-right font-medium">{order.quantity || order.amount}</td>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(order.created_at || order.time).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    {order.status === 'open' ? (
                      <div className="flex items-center justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => confirm('Modify', order.id)}
                          className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors" title="Modify Order"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => confirm('Cancel', order.id)}
                          className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors" title="Force Cancel"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-xs italic">Read-only</span>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    No {activeTab} orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              <ShieldAlert className="h-6 w-6" />
              <h3 className="text-lg font-bold text-gray-900">Admin Action</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              You are about to <strong>{confirmAction.action}</strong> order <strong>{confirmAction.orderId}</strong>.
            </p>
            {confirmAction.action === 'Modify' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Target Price (INR)</label>
                  <input type="number" className="w-full border border-gray-300 rounded p-1.5 text-sm" defaultValue={150} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Amount</label>
                  <input type="number" className="w-full border border-gray-300 rounded p-1.5 text-sm" defaultValue={500} />
                </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Audit Note</label>
              <input type="text" className="w-full border border-gray-300 rounded p-1.5 text-sm" placeholder="Reason for intervention..." />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowConfirm(false)} className={`px-4 py-2 text-white rounded-md text-sm font-medium ${confirmAction.action === 'Modify' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'}`}>
                Execute {confirmAction.action}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
