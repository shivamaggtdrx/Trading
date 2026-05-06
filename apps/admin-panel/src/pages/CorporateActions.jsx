import { useState } from 'react';
import { Briefcase, Gift, Scissors, CheckCircle, Search } from 'lucide-react';

const pendingActions = [
  { id: 'CA-102', type: 'Dividend', symbol: 'TCS (BSE)', details: '₹28.00 per share', exDate: '2026-05-05', eligibleHolders: 145, totalValue: 450000, status: 'Pending' },
  { id: 'CA-103', type: 'Stock Split', symbol: 'HDFCBANK', details: '1:2 Ratio', exDate: '2026-05-10', eligibleHolders: 89, totalValue: 0, status: 'Pending' },
  { id: 'CA-101', type: 'Bonus Issue', symbol: 'INFY', details: '1:1 Bonus', exDate: '2026-04-28', eligibleHolders: 210, totalValue: 0, status: 'Applied' },
];

export default function CorporateActions() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Corporate Actions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage Dividends, Stock Splits, and Bonus Issues for B-Book holders.</p>
        </div>
        <button onClick={() => alert('Action triggered. Backend integration pending.')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
          <Briefcase className="h-4 w-4 mr-2" />
          Declare New Action
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <Gift className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500">Pending Dividends</h3>
            <div className="text-2xl font-black text-gray-900">₹4,50,000</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Scissors className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-500">Upcoming Splits/Bonus</h3>
            <div className="text-2xl font-black text-gray-900">2</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs text-orange-800 bg-orange-50 border border-orange-200 p-3 rounded font-medium">
            <strong>Note:</strong> Since you run a B-Book, paying out dividends to clients reduces your Net PNL. You can choose to skip dividend payouts or apply penalty fees.
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Action Queue</h2>
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search Symbol..."
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Action ID</th>
                <th className="px-6 py-3 font-semibold">Type</th>
                <th className="px-6 py-3 font-semibold">Symbol</th>
                <th className="px-6 py-3 font-semibold">Details</th>
                <th className="px-6 py-3 font-semibold">Ex-Date</th>
                <th className="px-6 py-3 font-semibold text-center">Eligible Holders</th>
                <th className="px-6 py-3 font-semibold text-right">Cost (INR)</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {pendingActions.map((action) => (
                <tr key={action.id} className="hover:bg-gray-50 group">
                  <td className="px-6 py-4 font-bold text-gray-900">{action.id}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      action.type === 'Dividend' ? 'bg-green-50 text-green-700 border-green-200' : 
                      action.type === 'Stock Split' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-purple-50 text-purple-700 border-purple-200'
                    }`}>
                      {action.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-gray-900">{action.symbol}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs font-bold">{action.details}</td>
                  <td className="px-6 py-4 text-gray-600 text-xs">{action.exDate}</td>
                  <td className="px-6 py-4 text-center font-bold text-gray-700 bg-gray-50/50">{action.eligibleHolders}</td>
                  <td className="px-6 py-4 text-right font-bold text-gray-900">
                    {action.totalValue > 0 ? `₹${action.totalValue.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {action.status === 'Pending' ? (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => alert('Action triggered. Backend integration pending.')} className="text-red-600 hover:text-red-800 font-bold text-xs bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors">
                          Skip / Ignore
                        </button>
                        <button onClick={() => alert('Action triggered. Backend integration pending.')} className="text-green-600 hover:text-green-800 font-bold text-xs bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded transition-colors inline-flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" /> Execute Batch
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-500 font-bold text-xs bg-gray-100 px-2 py-1 rounded">Applied</span>
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
