import React, { useState } from 'react';
import { Search, Download, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Ledger() {
  const [clientSearch, setClientSearch] = useState('TDX-101');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [profileInfo, setProfileInfo] = useState(null);

  const handleLoadLedger = async () => {
    if (!clientSearch.trim()) {
      alert('Please enter a Client ID to load ledger.');
      return;
    }
    
    try {
      setLoading(true);
      const data = await adminApi.getClientLedger(clientSearch);
      setLedgerEntries(data.entries || []);
      setProfileInfo(data.profile);
    } catch (err) {
      alert(err.message || 'Failed to load ledger. Ensure the Client ID is correct.');
      setLedgerEntries([]);
      setProfileInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExportStatement = () => {
    const headers = 'Transaction ID,Date,Description,Debit,Credit,Running Balance\n';
    const rows = ledgerEntries.map(i =>
      `${i.id},${i.date},${i.desc},${i.type === 'Debit' ? i.amount : ''},${i.type === 'Credit' ? i.amount : ''},${i.balance}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger_${clientSearch}_statement.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCredits = ledgerEntries.filter(e => e.type === 'Credit').reduce((s, e) => s + e.amount, 0);
  const totalDebits = ledgerEntries.filter(e => e.type === 'Debit').reduce((s, e) => s + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Ledger</h1>
          <p className="text-sm text-gray-500 mt-1">Full double-entry ledger per client with credits, debits, charges, and penalties.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportStatement} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export Statement
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[300px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} placeholder="Search Client ID (e.g. TDX-101)..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
             <span className="text-gray-500 text-sm">to</span>
             <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={handleLoadLedger} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
              Load Ledger
            </button>
          </div>
        </div>

        <div className="p-6 border-b border-gray-200">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold text-xl">
                   {profileInfo ? profileInfo.full_name.charAt(0) : 'JD'}
                </div>
                <div>
                   <h3 className="text-lg font-bold text-gray-900">{profileInfo ? profileInfo.full_name : 'No Client Loaded'} <span className="text-sm font-normal text-gray-500">({clientSearch})</span></h3>
                   <p className="text-sm text-gray-500">Current Balance: <span className="font-bold text-gray-900">₹{ledgerEntries[0]?.balance.toLocaleString('en-IN') || '0'}</span></p>
                </div>
             </div>
             <div className="flex gap-6">
               <div className="text-center">
                 <div className="text-xs text-gray-500 font-medium">Total Credits</div>
                 <div className="text-lg font-bold text-green-600">₹{totalCredits.toLocaleString('en-IN')}</div>
               </div>
               <div className="text-center">
                 <div className="text-xs text-gray-500 font-medium">Total Debits</div>
                 <div className="text-lg font-bold text-red-600">₹{totalDebits.toLocaleString('en-IN')}</div>
               </div>
             </div>
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Debit (-)</th>
                <th className="py-3 px-4 text-right">Credit (+)</th>
                <th className="py-3 px-4 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">Loading ledger...</td></tr>
              ) : ledgerEntries.length > 0 ? ledgerEntries.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 font-medium text-gray-900">{item.id}</td>
                  <td className="py-3 px-4 text-gray-500">{item.date}</td>
                  <td className="py-3 px-4">{item.desc}</td>
                  <td className="py-3 px-4 text-right text-red-600">
                    {item.type === 'Debit' ? (
                       <span className="flex items-center justify-end gap-1"><ArrowDownRight className="w-3 h-3"/> ₹{item.amount.toLocaleString('en-IN')}</span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right text-green-600">
                     {item.type === 'Credit' ? (
                       <span className="flex items-center justify-end gap-1"><ArrowUpRight className="w-3 h-3"/> ₹{item.amount.toLocaleString('en-IN')}</span>
                    ) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-gray-900">₹{item.balance.toLocaleString('en-IN')}</td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="py-8 text-center text-gray-500">No ledger entries. Enter a Client ID and load.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
