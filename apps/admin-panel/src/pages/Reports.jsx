import React, { useState, useEffect } from 'react';
import { FileText, Download, Calendar, Filter } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const [type, setType] = useState('Master Weekly Settlement');
  const [target, setTarget] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('reports');
      setReports((res?.reports || []).filter(r => r.status !== 'Completed'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleGenerate = async () => {
    if (!startDate || !endDate) return alert('Please select start and end dates.');
    try {
      await adminApi.updateCrmModule('reports', 'new', {
        report_type: type,
        target_entity: target || 'Global System',
        format: 'PDF/Excel',
        status: 'Ready',
        file_size: 'Pending'
      });
      alert('Report queued for generation.');
      fetchReports();
    } catch (err) {
      alert('Failed to queue report generation.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Settlements</h1>
          <p className="text-sm text-gray-500 mt-1">Generate and download detailed ledgers, PNL, and brokerage reports.</p>
        </div>
        <button onClick={handleGenerate} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 shadow-sm">
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
              <select value={type} onChange={e => setType(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 font-medium">
                <option>Master Weekly Settlement</option>
                <option>Client Detailed Ledger</option>
                <option>Brokerage & Commission Summary</option>
                <option>Trade History Dump</option>
                <option>Open Interest & Exposure</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Target Entity (Optional)</label>
              <input type="text" value={target} onChange={e => setTarget(e.target.value)} placeholder="e.g., MST-001 or TDX-82491" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Start Date</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 text-gray-500" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">End Date</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 text-gray-500" />
              </div>
            </div>
            <button onClick={handleGenerate} className="w-full bg-gray-900 text-white font-bold py-2 rounded shadow-sm hover:bg-gray-800 transition-colors">
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
            {loading ? (
               <div className="text-center py-8 text-gray-500">Loading reports...</div>
            ) : reports.length === 0 ? (
               <div className="text-center py-8 text-gray-500">No ready reports found.</div>
            ) : (
               <ul className="divide-y divide-gray-100">
                 {reports.map((report) => (
                   <li key={report.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
                     <div>
                       <div className="font-bold text-sm text-gray-900">{report.report_type}</div>
                       <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                         <span className="font-medium text-blue-600">{report.target_entity}</span> • <Calendar className="h-3 w-3" /> {new Date(report.created_at).toLocaleString()}
                       </div>
                     </div>
                     <button onClick={() => alert(`Downloading ${report.report_type} (${report.format})`)} className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors">
                       Download {report.format}
                     </button>
                   </li>
                 ))}
               </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
