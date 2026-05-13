import { useState } from 'react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';

const reports = [
  { id: 'REP-005', type: 'Weekly Settlement', target: 'Master MST-001', generated: '2026-05-01 10:00', status: 'Ready', format: 'PDF/Excel' },
  { id: 'REP-004', type: 'Client Ledger', target: 'TDX-82491', generated: '2026-05-01 09:45', status: 'Ready', format: 'PDF' },
  { id: 'REP-003', type: 'Brokerage Summary', target: 'Global System', generated: '2026-04-30 23:59', status: 'Ready', format: 'Excel' },
  { id: 'REP-002', type: 'Risk Exposure', target: 'Global System', generated: '2026-04-30 18:00', status: 'Ready', format: 'PDF' },
];

export default function Reports() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Settlements</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and download detailed ledgers, PNL, and brokerage reports.</p>
        </div>
        <button onClick={() => console.log('Action triggered')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 shadow-sm">
          <FileText className="h-4 w-4 mr-2" />
          Generate New Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Generate Report</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Report Type</label>
              <select className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 font-medium">
                <option>Master Weekly Settlement</option>
                <option>Client Detailed Ledger</option>
                <option>Brokerage & Commission Summary</option>
                <option>Trade History Dump</option>
                <option>Open Interest & Exposure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Target Entity (Optional)</label>
              <input type="text" placeholder="e.g., MST-001 or TDX-82491" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                <input type="date" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                <input type="date" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 text-gray-500" />
              </div>
            </div>
            <button onClick={() => console.log('Action triggered')} className="w-full bg-gray-900 text-white font-bold py-2 rounded shadow-sm hover:bg-gray-800 transition-colors">
              Queue Report Generation
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
            <Download className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-bold text-gray-900">Recent Downloads</h2>
          </div>
          <div className="overflow-y-auto flex-1 p-0">
            <ul className="divide-y divide-gray-100">
              {reports.map((report) => (
                <li key={report.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-sm text-gray-900">{report.type}</div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                      <span className="font-medium text-blue-600">{report.target}</span> • <Calendar className="h-3 w-3" /> {report.generated}
                    </div>
                  </div>
                  <button onClick={() => console.log('Action triggered')} className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors">
                    Download {report.format}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
