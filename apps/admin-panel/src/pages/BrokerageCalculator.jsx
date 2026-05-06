import { useState } from 'react';
import { Calculator, Save, IndianRupee, PieChart, Info, Settings, RefreshCw } from 'lucide-react';

const segments = [
  { id: 'eq_delivery', name: 'Equity Delivery', flatFee: 20, percentage: 0.1, minFee: 20 },
  { id: 'eq_intraday', name: 'Equity Intraday', flatFee: 20, percentage: 0.05, minFee: 20 },
  { id: 'fo_futures', name: 'F&O Futures', flatFee: 20, percentage: 0.01, minFee: 20 },
  { id: 'fo_options', name: 'F&O Options', flatFee: 20, percentage: 0, minFee: 20, perLot: true },
  { id: 'mcx_commodities', name: 'MCX Commodities', flatFee: 20, percentage: 0.01, minFee: 20 },
];

export default function BrokerageCalculator() {
  const [tradeValue, setTradeValue] = useState(100000);
  const [selectedSegment, setSelectedSegment] = useState('eq_intraday');

  const activeSegment = segments.find(s => s.id === selectedSegment);
  
  // Fake calculation logic for UI
  const calculatedBrokerage = activeSegment.perLot ? activeSegment.flatFee : Math.max(activeSegment.minFee, tradeValue * (activeSegment.percentage / 100));
  const stt = tradeValue * 0.025 / 100;
  const exchangeTxn = tradeValue * 0.00345 / 100;
  const gst = (calculatedBrokerage + exchangeTxn) * 0.18;
  const sebi = tradeValue * 0.0001 / 100;
  const stampDuty = tradeValue * 0.003 / 100;

  const totalCharges = calculatedBrokerage + stt + exchangeTxn + gst + sebi + stampDuty;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brokerage & Charges</h1>
          <p className="text-sm text-gray-500 mt-1">Configure global commission slabs and preview tax breakdowns.</p>
        </div>
        <button onClick={() => alert('Action triggered. Backend integration pending.')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 shadow-sm">
          <Save className="h-4 w-4 mr-2" />
          Save Fee Structure
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center gap-2">
            <Settings className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-bold text-gray-900">Commission Slabs</h2>
          </div>
          <div className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Segment</th>
                    <th className="px-4 py-3 text-center font-semibold">Flat Fee (₹)</th>
                    <th className="px-4 py-3 text-center font-semibold">% Turnover</th>
                    <th className="px-4 py-3 text-center font-semibold">Min Fee (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {segments.map((seg) => (
                    <tr key={seg.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">
                        {seg.name}
                        {seg.perLot && <span className="ml-2 text-[9px] bg-blue-100 text-blue-700 px-1 py-0.5 rounded uppercase">Per Lot</span>}
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" defaultValue={seg.flatFee} className="w-full text-center border border-gray-300 rounded p-1.5 text-sm font-medium focus:ring-blue-500" />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" defaultValue={seg.percentage} step="0.01" className="w-full text-center border border-gray-300 rounded p-1.5 text-sm font-medium focus:ring-blue-500" disabled={seg.perLot} />
                      </td>
                      <td className="px-4 py-3">
                        <input type="number" defaultValue={seg.minFee} className="w-full text-center border border-gray-300 rounded p-1.5 text-sm font-medium focus:ring-blue-500" disabled={seg.perLot} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Preview Calculator
            </h2>
            <select 
              className="text-sm font-bold border-gray-300 rounded focus:ring-blue-500"
              value={selectedSegment}
              onChange={(e) => setSelectedSegment(e.target.value)}
            >
              {segments.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          
          <div className="p-6 flex-1 flex flex-col">
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2">Simulated Trade Value (Turnover)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 font-bold">₹</span>
                </div>
                <input 
                  type="number" 
                  value={tradeValue}
                  onChange={(e) => setTradeValue(Number(e.target.value))}
                  className="block w-full pl-8 pr-3 py-3 border border-gray-300 rounded-lg text-lg font-black focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-lg p-5 border border-gray-200 flex-1">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 border-b border-gray-200 pb-2">Tax & Charge Breakdown</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Brokerage ({activeSegment.percentage > 0 ? `${activeSegment.percentage}% or Flat ₹${activeSegment.flatFee}` : `Flat ₹${activeSegment.flatFee}`})</span>
                  <span className="text-sm font-bold text-gray-900">₹{calculatedBrokerage.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">STT / CTT</span>
                  <span className="text-sm font-bold text-gray-900">₹{stt.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Exchange Txn Charge</span>
                  <span className="text-sm font-bold text-gray-900">₹{exchangeTxn.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">GST (18% on Brokerage + Txn)</span>
                  <span className="text-sm font-bold text-gray-900">₹{gst.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">SEBI Charges</span>
                  <span className="text-sm font-bold text-gray-900">₹{sebi.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 font-medium">Stamp Duty</span>
                  <span className="text-sm font-bold text-gray-900">₹{stampDuty.toFixed(2)}</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="text-base font-bold text-gray-900">Total Charges</span>
                <span className="text-xl font-black text-red-600">₹{totalCharges.toFixed(2)}</span>
              </div>
            </div>
            
            <div className="mt-4 flex items-start gap-2 bg-blue-50 p-3 rounded border border-blue-100 text-blue-800 text-xs">
              <Info className="h-4 w-4 shrink-0 mt-0.5" />
              <p>These charges are deducted directly from the client's available balance upon order execution.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
