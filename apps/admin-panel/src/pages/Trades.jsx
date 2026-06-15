import { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Edit, ShieldAlert, Ghost } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Trades() {
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmType, setConfirmType] = useState('modify'); // 'modify' or 'delete'
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [marketFilter, setMarketFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Intervention Edit States
  const [editEntryPrice, setEditEntryPrice] = useState('');
  const [editExitPrice, setEditExitPrice] = useState('');
  const [editQty, setEditQty] = useState('');
  const [auditNote, setAuditNote] = useState('');

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
    setEditEntryPrice(trade.entry_price || 0);
    setEditExitPrice(trade.exit_price || 0);
    setEditQty(trade.quantity || 0);
    setAuditNote('');
    setShowConfirm(true);
  };

  const handleExecuteAction = async () => {
    if (!auditNote) return alert('Mandatory audit note is required');
    try {
      if (confirmType === 'modify') {
        const ent = parseFloat(editEntryPrice);
        const ext = parseFloat(editExitPrice);
        const qty = parseFloat(editQty);
        if (isNaN(ent) || ent <= 0 || isNaN(ext) || ext <= 0 || isNaN(qty) || qty <= 0) {
          return alert('Invalid prices or quantity');
        }
        await adminApi.modifyTrade(selectedTrade.id, {
          entry_price: ent,
          exit_price: ext,
          quantity: qty,
          note: auditNote
        });
        alert('Trade record updated successfully');
      } else if (confirmType === 'delete') {
        await adminApi.deleteTrade(selectedTrade.id, auditNote);
        alert('Trade record deleted and P&L reversed successfully');
      }
      setShowConfirm(false);
      fetchTrades();
    } catch (err) {
      alert(err.message || 'Action failed');
    }
  };

  const handleExport = () => {
    if (filteredTrades.length === 0) return alert('No trades to export.');
    const headers = [
      'Trade ID', 'Client ID', 'Symbol', 'Side', 
      'Entry Price', 'Exit Price', 'Quantity', 
      'Gross PNL', 'Charges', 'Net PNL', 'Closed At'
    ];
    const rows = filteredTrades.map(trade => [
      trade.id || '',
      trade.profiles?.client_id || trade.user_id || '',
      trade.symbol || '',
      trade.side || '',
      trade.entry_price || 0,
      trade.exit_price || 0,
      trade.quantity || 0,
      trade.gross_pnl || 0,
      trade.charges || 0,
      trade.net_pnl || 0,
      trade.closed_at ? new Date(trade.closed_at).toLocaleString() : ''
    ]);

    const csvRows = [headers.join(',')];
    for (const row of rows) {
      const escapedRow = row.map(val => {
        const str = String(val);
        return `"${str.replace(/"/g, '""')}"`;
      });
      csvRows.push(escapedRow.join(','));
    }

    const csvData = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvData);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `trades_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Client-side filtering logic
  const filteredTrades = trades.filter(trade => {
    // 1. Search text (Symbol, Client ID, User ID, Trade ID)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const tradeId = String(trade.id || '').toLowerCase();
      const userId = String(trade.user_id || '').toLowerCase();
      const clientId = String(trade.profiles?.client_id || '').toLowerCase();
      const symbol = String(trade.symbol || '').toLowerCase();
      if (!tradeId.includes(term) && !userId.includes(term) && !clientId.includes(term) && !symbol.includes(term)) {
        return false;
      }
    }
    
    // 2. Market segment
    if (marketFilter) {
      const segment = trade.instruments?.segment || '';
      if (segment !== marketFilter) return false;
    }
    
    // 3. Date
    if (dateFilter) {
      const closedAt = trade.closed_at || trade.time || '';
      if (!closedAt || !closedAt.startsWith(dateFilter)) return false;
    }
    
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Trade Ledger (Master)</h1>
        <button onClick={handleExport} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-9 px-4">
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
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search User ID or Trade ID..."
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
          
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-4 w-4 text-gray-400" />
            </div>
            <select 
              value={marketFilter}
              onChange={(e) => setMarketFilter(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="">All Markets</option>
              <option value="nse_equity">NSE Equity</option>
              <option value="bse_equity">BSE Equity</option>
              <option value="fo_futures">F&O Futures</option>
              <option value="fo_options">F&O Options</option>
              <option value="mcx">Commodity (MCX)</option>
              <option value="forex">Forex</option>
              <option value="crypto">Crypto</option>
            </select>
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 text-gray-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-2 font-semibold">Trade ID</th>
                <th className="px-4 py-2 font-semibold">Client ID</th>
                <th className="px-4 py-2 font-semibold">Symbol / Segment</th>
                <th className="px-4 py-2 font-semibold">Side</th>
                <th className="px-4 py-2 font-semibold text-right">Entry Price</th>
                <th className="px-4 py-2 font-semibold text-right">Exit Price</th>
                <th className="px-4 py-2 font-semibold text-right">Qty</th>
                <th className="px-4 py-2 font-semibold text-right">Net PNL (INR)</th>
                <th className="px-4 py-2 font-semibold">Closed Time</th>
                <th className="px-4 py-2 font-semibold text-right">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan="10" className="px-6 py-8 text-center text-gray-500">Loading...</td>
                </tr>
              ) : filteredTrades.length > 0 ? filteredTrades.map((trade) => (
                <tr key={trade.id} className="hover:bg-blue-50/50 group">
                  <td className="px-4 py-2 font-medium text-gray-900 text-xs" title={trade.id}>{trade.id.slice(0, 8)}...</td>
                  <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer text-xs font-bold">
                    {trade.profiles?.client_id || trade.user_id}
                  </td>
                  <td className="px-4 py-2">
                    <div className="font-bold text-gray-900">{trade.symbol}</div>
                    <div className="text-[10px] text-gray-500 uppercase font-medium">
                      {(trade.instruments?.segment || 'NSE').replace('_', ' ')}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      trade.side === 'buy' || trade.side === 'long' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {trade.side === 'long' ? 'buy' : trade.side === 'short' ? 'sell' : trade.side}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-medium">₹{parseFloat(trade.entry_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-right font-medium">₹{parseFloat(trade.exit_price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-right font-bold">{trade.quantity || trade.amount}</td>
                  <td className={`px-4 py-2 text-right font-bold ${
                    parseFloat(trade.net_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    ₹{parseFloat(trade.net_pnl || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(trade.closed_at || trade.time).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2 opacity-20 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => confirmAction(trade, 'modify')}
                        className="p-1 text-orange-600 hover:bg-orange-100 rounded transition-colors" 
                        title="Modify Trade Record"
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
                  <td colSpan="10" className="px-6 py-8 text-center text-gray-500">No trades found.</td>
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
            
            <div className="bg-red-50 text-red-800 text-xs p-3 rounded border border-red-200 mb-4 font-medium font-sans">
              <strong>Super Admin Warning:</strong> 
              {confirmType === 'delete' 
                ? ' Deleting this trade will completely remove it from the client ledger and reverse any PNL impacts. The client will never see this trade occurred.' 
                : ' Modifying an executed trade will instantly recalculate client PNL and margins. This is recorded in the master audit log.'}
            </div>
            
            {confirmType === 'modify' && (
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Override Entry Price (INR)</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded p-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
                    value={editEntryPrice} 
                    onChange={(e) => setEditEntryPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Override Exit Price (INR)</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded p-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
                    value={editExitPrice} 
                    onChange={(e) => setEditExitPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Override Qty</label>
                  <input 
                    type="number" 
                    className="w-full border border-gray-300 rounded p-2 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white" 
                    value={editQty} 
                    onChange={(e) => setEditQty(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Mandatory Audit Note</label>
              <input 
                type="text" 
                className="w-full border border-gray-300 rounded p-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 bg-white" 
                placeholder="Reason for admin intervention..." 
                value={auditNote}
                onChange={(e) => setAuditNote(e.target.value)}
              />
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button 
                onClick={handleExecuteAction} 
                className="px-6 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md text-sm font-bold shadow-sm"
              >
                CONFIRM {confirmType === 'delete' ? 'GHOSTING' : 'MODIFICATION'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
