import React, { useState } from 'react';
import { Download, PieChart, DollarSign, ArrowUpRight, ArrowDownRight, Layers } from 'lucide-react';

export default function ProfitAttribution() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profit Attribution</h1>
          <p className="text-sm text-gray-500 mt-1">Analyze platform revenue sources, segment profitability, and A-Book vs B-Book split.</p>
        </div>
        <button onClick={() => alert('Downloading report...')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* B-Book vs A-Book Split */}
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm col-span-1">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><PieChart className="w-4 h-4" /> Revenue Split (MTD)</h3>
            <div className="space-y-4">
               <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">B-Book P&L (Internalized)</span><span className="font-bold text-green-600">₹45.2L</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full" style={{ width: '65%' }}></div></div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">A-Book Brokerage</span><span className="font-bold text-green-600">₹18.4L</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-indigo-400 h-2 rounded-full" style={{ width: '25%' }}></div></div>
               </div>
               <div>
                  <div className="flex justify-between text-sm mb-1"><span className="text-gray-600">Penalties & Fees</span><span className="font-bold text-green-600">₹6.1L</span></div>
                  <div className="w-full bg-gray-100 rounded-full h-2"><div className="bg-orange-400 h-2 rounded-full" style={{ width: '10%' }}></div></div>
               </div>
            </div>
            <div className="mt-6 pt-4 border-t border-gray-100 text-center">
               <div className="text-xs text-gray-500 uppercase tracking-wide font-bold">Total Platform Revenue</div>
               <div className="text-3xl font-black text-gray-900 mt-1">₹69.7L</div>
            </div>
         </div>

         {/* Segment Performance */}
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm col-span-2">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2"><Layers className="w-4 h-4" /> Profitability by Segment</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {[
                  { seg: 'NSE F&O', rev: '₹32.5L', margin: '42%', up: true },
                  { seg: 'MCX Options', rev: '₹15.2L', margin: '28%', up: true },
                  { seg: 'NSE Cash', rev: '₹4.1L', margin: '12%', up: false },
                  { seg: 'Currency', rev: '₹2.8L', margin: '8%', up: true },
               ].map(s => (
                  <div key={s.seg} className="p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                     <div className="text-xs font-bold text-gray-500">{s.seg}</div>
                     <div className="text-xl font-bold text-gray-900 mt-1">{s.rev}</div>
                     <div className={`text-xs font-medium mt-2 flex items-center gap-1 ${s.up ? 'text-green-600' : 'text-red-600'}`}>
                        {s.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                        {s.margin} Margin
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
           <h3 className="text-sm font-bold text-gray-900">Top Revenue Generating Clients</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase">
              <tr>
                <th className="py-3 px-4">Client ID</th>
                <th className="py-3 px-4 text-right">Brokerage Paid</th>
                <th className="py-3 px-4 text-right">M2M Loss (B-Book Profit)</th>
                <th className="py-3 px-4 text-right">Total Platform Revenue</th>
                <th className="py-3 px-4 text-center">Execution Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                 { id: 'TDX-8821', name: 'Rohan Desai', broker: '₹45,200', loss: '₹4,50,000', total: '₹4,95,200', type: 'B-Book' },
                 { id: 'TDX-1045', name: 'Amit Kumar', broker: '₹82,100', loss: '₹0', total: '₹82,100', type: 'A-Book' },
                 { id: 'TDX-3392', name: 'Priya S.', broker: '₹12,400', loss: '₹1,25,000', total: '₹1,37,400', type: 'B-Book' },
              ].map(c => (
                 <tr key={c.id} className="hover:bg-gray-50">
                   <td className="py-3 px-4"><div className="font-bold text-blue-600">{c.id}</div><div className="text-xs text-gray-500">{c.name}</div></td>
                   <td className="py-3 px-4 text-right font-medium text-gray-700">{c.broker}</td>
                   <td className="py-3 px-4 text-right font-medium text-green-600">{c.loss}</td>
                   <td className="py-3 px-4 text-right font-bold text-gray-900">{c.total}</td>
                   <td className="py-3 px-4 text-center"><span className={`px-2 py-1 rounded text-xs font-bold ${c.type === 'B-Book' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>{c.type}</span></td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
