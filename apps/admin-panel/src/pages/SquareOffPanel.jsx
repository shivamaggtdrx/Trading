import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, XCircle, CheckSquare, Square } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function SquareOffPanel() {
  const [selected, setSelected] = useState([]);
  const [openPositions, setOpenPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPositions = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getOpenPositions();
      setOpenPositions(data.positions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPositions();
  }, []);

  const toggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selected.length === openPositions.length) setSelected([]);
    else setSelected(openPositions.map(p => p.id));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Square-Off Panel</h1>
          <p className="text-sm text-gray-500 mt-1">Dedicated forced square-off dashboard for batch closing positions.</p>
        </div>
        <div className="flex gap-3">
          <button 
             disabled={selected.length === 0}
             onClick={async () => { 
               if(window.confirm(`Force square-off ${selected.length} position(s)? This will send market orders immediately.`)) { 
                 try {
                   await adminApi.forceSquareOffPositions(selected, 'Mass Execution from Admin Panel');
                   alert(`${selected.length} position(s) squared off successfully.`); 
                   setSelected([]); 
                   fetchPositions();
                 } catch (err) {
                   alert('Failed to square off positions: ' + err.message);
                 }
               } 
             }}
             className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
            <AlertTriangle className="w-4 h-4" />
            Force Square-Off Selected ({selected.length})
          </button>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
        <div>
           <h3 className="text-sm font-bold text-orange-800">Warning: Mass Execution</h3>
           <p className="text-sm text-orange-700 mt-1">Executing a forced square-off will immediately send market orders to close the selected positions. This action cannot be undone.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by Client, Instrument..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Filter by Margin Utilized</option>
              <option>&gt; 80% Utilized</option>
              <option>&gt; 90% Utilized</option>
              <option>Margin Call Active</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4 w-12 text-center">
                   <button onClick={selectAll} className="text-gray-400 hover:text-blue-600">
                      {selected.length === openPositions.length && openPositions.length > 0 ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                   </button>
                </th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Instrument</th>
                <th className="py-3 px-4">Side & Qty</th>
                <th className="py-3 px-4 text-right">M2M PnL</th>
                <th className="py-3 px-4 text-center">Margin %</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500">Loading open positions...</td></tr>
              ) : openPositions.length > 0 ? openPositions.map((item) => (
                <tr key={item.id} className={`transition-colors ${selected.includes(item.id) ? 'bg-red-50' : 'hover:bg-gray-50'}`}>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => toggleSelect(item.id)} className={`hover:text-blue-600 ${selected.includes(item.id) ? 'text-blue-600' : 'text-gray-400'}`}>
                       {selected.includes(item.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="py-3 px-4 font-medium text-gray-900">{item.client}</td>
                  <td className="py-3 px-4 font-medium text-gray-700">{item.instrument}</td>
                  <td className="py-3 px-4">
                     <span className={`px-2 py-0.5 rounded text-xs font-bold mr-2 ${item.type === 'BUY' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {item.type}
                     </span>
                     {Math.abs(item.qty)}
                  </td>
                  <td className={`py-3 px-4 text-right font-bold ${item.mtom >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.mtom >= 0 ? '+' : ''}{item.mtom}
                  </td>
                  <td className="py-3 px-4 text-center">
                     <span className={`px-2 py-1 rounded text-xs font-bold ${item.margin > 90 ? 'bg-red-100 text-red-800' : item.margin > 80 ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
                        {item.margin}%
                     </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                     <button onClick={async () => { 
                        if(window.confirm(`Force square-off ${item.instrument} for ${item.client}?`)) {
                           try {
                             await adminApi.forceSquareOffPositions([item.id], 'Individual Force Square-off');
                             alert('Position squared off.');
                             fetchPositions();
                           } catch (err) {
                             alert('Failed to square off position');
                           }
                        } 
                     }} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 text-xs font-medium transition-colors">
                        Square Off
                     </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="7" className="py-8 text-center text-gray-500">No open positions found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
