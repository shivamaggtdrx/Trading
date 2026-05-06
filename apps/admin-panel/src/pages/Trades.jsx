import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Edit, ShieldAlert, Trash2, Ghost } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Trades() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState('modify'); // 'modify' or 'delete'
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrades();
  }, []);

  const fetchTrades = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTrades();
      setTrades(data.trades || []);
    } catch (err) {
      console.error('Failed to fetch trades:', err);
    } finally {
      setLoading(false);
    }
  };

  const confirmAction = (trade, type) => {
    setSelectedTrade(trade);
    setConfirmType(type);
    setShowConfirm(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Trade Ledger (Master)</h1>
        <button onClick={() => alert('Action triggered. Backend integration pending.')} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-9 px-4">
          Export Master Report
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Filters */}
        <div className="p-3 border-b border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50/50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search User ID or Trade ID..."
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white">
              <option value="">All Markets</option>
              <option value="NSE">NSE Equity</option>
              <option value="BSE">BSE Equity</option>
              <option value="OPTIONS">F&O / Options</option>
              <option value="MCX">Commodity (MCX)</option>
              <option value="COMEX">COMEX</option>
              <option value="CURRENCY">Currency</option>
              <option value="CRYPTO">Crypto</option>
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-2 font-semibold">Trade ID</th>
                <th className="px-4 py-2 font-semibold">Client ID</th>
                <th className="px-4 py-2 font-semibold">Symbol</th>
                <th className="px-4 py-2 font-semibold">Side</th>
                <th className="px-4 py-2 font-semibold text-right">Price</th>
                <th className="px-4 py-2 font-semibold text-right">Qty</th>
                <th className="px-4 py-2 font-semibold text-right">Total Value (INR)</th>
                <th className="px-4 py-2 font-semibold">Time</th>
                <th className="px-4 py-2 font-semibold text-right">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : trades.length > 0 ? trades.map((trade) => (
                <tr key={trade.id} className="hover:bg-blue-50/50 group">
                  <td className="px-4 py-2 font-medium text-gray-900 text-xs">{trade.id}</td>
                  <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer text-xs font-bold">
                    {trade.profiles?.client_id || trade.user_id}
                  </td>
                  <td className="px-4 py-2 font-bold text-gray-900">{trade.symbol}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      trade.side === 'buy' || trade.side === 'long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {trade.side === 'long' ? 'buy' : trade.side === 'short' ? 'sell' : trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-medium">₹{(trade.execution_price || trade.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-right font-bold">{trade.quantity || trade.amount}</td>
                  <td className="px-4 py-2 text-right font-bold text-gray-900">
                    ₹{((trade.execution_price || trade.price || 0) * (trade.quantity || trade.amount || 0)).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(trade.closed_at || trade.time).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => confirmAction(trade, 'modify')}
                        className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors" 
                        title="Modify Execution Price"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => confirmAction(trade, 'delete')}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors" 
                        title="Delete/Ghost Trade Record"
                      >
                        <Ghost className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="9" className="px-6 py-8 text-center text-gray-500">No trades found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && selectedTrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 border-t-4 border-red-600">
            <div className="flex items-center gap-2 mb-4 text-red-600">
              {confirmType === 'delete' ? <Ghost className="h-6 w-6" /> : <ShieldAlert className="h-6 w-6" />}
              <h3 className="text-xl font-bold text-gray-900">
                {confirmType === 'delete' ? 'Ghost Trade Record' : 'Modify Trade Price'}
              </h3>
            </div>
            
            <div className="bg-red-50 text-red-800 text-xs p-3 rounded border border-red-200 mb-4 font-medium">
              <strong>Super Admin Warning:</strong> 
              {confirmType === 'delete' 
                ? ' Deleting this trade will completely remove it from the client ledger and reverse any PNL impacts. The client will never see this trade occurred.' 
                : ' Modifying an executed trade will instantly recalculate client PNL and margins. This is recorded in the master audit log.'}
            </div>
            
            {confirmType === 'modify' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Override Execution Price (INR)</label>
                  <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm font-medium" defaultValue={selectedTrade.price} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Override Qty</label>
                  <input type="number" className="w-full border border-gray-300 rounded p-2 text-sm font-medium bg-gray-50" defaultValue={selectedTrade.amount} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mandatory Audit Note</label>
              <input type="text" className="w-full border border-gray-300 rounded p-2 text-sm focus:border-red-500" placeholder="Reason for admin intervention..." />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowConfirm(false)} className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md text-sm font-bold shadow-sm">
                CONFIRM {confirmType === 'delete' ? 'GHOSTING' : 'MODIFICATION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
