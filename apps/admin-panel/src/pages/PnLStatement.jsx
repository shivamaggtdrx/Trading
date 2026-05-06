import React, { useState } from 'react';
import { Search, Filter, Download, DollarSign, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

export default function PnLStatement() {
  const [period, setPeriod] = useState('Today');
  const [segmentFilter, setSegmentFilter] = useState('All Segments');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  const pnlData = [
    { id: '1', client: 'John Doe (TDX-101)', segment: 'NSE', date: '2023-10-25', gross: 15000, charges: 500, net: 14500, status: 'Settled' },
    { id: '2', client: 'Alice Smith (TDX-102)', segment: 'MCX', date: '2023-10-25', gross: -5000, charges: 200, net: -5200, status: 'Settled' },
    { id: '3', client: 'Bob Jones (TDX-103)', segment: 'F&O', date: '2023-10-25', gross: 25000, charges: 1200, net: 23800, status: 'Pending' },
    { id: '4', client: 'Sara Khan (TDX-104)', segment: 'NSE', date: '2023-10-25', gross: -8500, charges: 350, net: -8850, status: 'Settled' },
    { id: '5', client: 'Raj Patel (TDX-105)', segment: 'F&O', date: '2023-10-25', gross: 42000, charges: 1800, net: 40200, status: 'Pending' },
  ];

  const filteredData = pnlData.filter(item => {
    const matchesSearch = searchQuery === '' || item.client.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSegment = segmentFilter === 'All Segments' || item.segment === segmentFilter;
    return matchesSearch && matchesSegment;
  });

  const totalGross = filteredData.reduce((sum, i) => sum + i.gross, 0);
  const totalCharges = filteredData.reduce((sum, i) => sum + i.charges, 0);
  const totalNet = filteredData.reduce((sum, i) => sum + i.net, 0);

  const handleExportCSV = () => {
    const headers = 'Date,Client,Segment,Gross P&L,Charges,Net P&L,Status\n';
    const rows = filteredData.map(i => `${i.date},${i.client},${i.segment},${i.gross},${i.charges},${i.net},${i.status}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pnl_statement_${period.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Detailed P&L Statement</h1>
          <p className="text-sm text-gray-500 mt-1">Daily, weekly, and monthly P&L breakdown by segment, client, and node.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExportCSV} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <DollarSign className="w-4 h-4" /> Total Gross P&L
          </div>
          <div className={`text-2xl font-bold ${totalGross >= 0 ? 'text-gray-900' : 'text-red-600'}`}>₹{totalGross.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <TrendingUp className="w-4 h-4 text-green-500" /> Total Net P&L
          </div>
          <div className={`text-2xl font-bold ${totalNet >= 0 ? 'text-green-600' : 'text-red-600'}`}>₹{totalNet.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <TrendingDown className="w-4 h-4 text-red-500" /> Total Charges
          </div>
          <div className="text-2xl font-bold text-red-600">₹{totalCharges.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <Calendar className="w-4 h-4" /> Period
          </div>
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="text-lg font-bold text-gray-900 bg-transparent border-none focus:outline-none cursor-pointer">
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>Last Month</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by Client ID or Name..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)} className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Segments</option>
              <option>NSE</option>
              <option>BSE</option>
              <option>MCX</option>
              <option>F&O</option>
            </select>
            <button onClick={() => setShowFilterPanel(!showFilterPanel)} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium transition-colors ${showFilterPanel ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}>
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>
        </div>

        {showFilterPanel && (
          <div className="p-4 bg-blue-50/50 border-b border-gray-200 flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">From:</label>
              <input type="date" className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">To:</label>
              <input type="date" className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white" />
            </div>
            <select className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white">
              <option>All Status</option>
              <option>Settled</option>
              <option>Pending</option>
            </select>
            <button onClick={() => setShowFilterPanel(false)} className="ml-auto text-sm text-gray-500 hover:text-gray-700">Close</button>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Segment</th>
                <th className="py-3 px-4 text-right">Gross P&L</th>
                <th className="py-3 px-4 text-right">Charges</th>
                <th className="py-3 px-4 text-right">Net P&L</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredData.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">{item.date}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{item.client}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{item.segment}</span>
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${item.gross >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.gross >= 0 ? '+' : ''}₹{item.gross.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4 text-right text-red-500">-₹{item.charges.toLocaleString('en-IN')}</td>
                  <td className={`py-3 px-4 text-right font-bold ${item.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {item.net >= 0 ? '+' : ''}₹{item.net.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Settled' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No records match your filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
