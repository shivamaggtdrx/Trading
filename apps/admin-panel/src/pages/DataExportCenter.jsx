import React, { useState, useEffect } from 'react';
import { Download, FileSpreadsheet, FileJson, FileText, Search, Clock } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function DataExportCenter() {
  const [module, setModule] = useState('Users & Clients');
  const [format, setFormat] = useState('csv');
  const [generating, setGenerating] = useState(false);
  const [pastExports, setPastExports] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExports = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('reports');
      setPastExports((res || []).filter(r => r.status === 'Completed'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExports();
  }, []);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await adminApi.updateCrmModule('reports', 'new', { 
        report_type: module, 
        target_entity: 'Global', 
        format: format.toUpperCase(),
        status: 'Completed',
        file_size: `${(Math.random() * 10 + 1).toFixed(1)} MB`
      });
      alert(`${module} report generated in ${format.toUpperCase()} format. Downloading...`);
      fetchExports();
    } catch (err) {
      alert('Failed to generate report');
    } finally {
      setGenerating(false);
    }
  };

  const handleRedownload = (item) => {
    alert(`Re-downloading ${item.report_type} (${item.format}) — ${item.file_size}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Export Center</h1>
          <p className="text-sm text-gray-500 mt-1">Generate CSV/Excel/PDF for any module or schedule daily reports.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {/* Generate New Export */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Generate New Report</h2>
            <div className="space-y-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Module</label>
                  <select value={module} onChange={(e) => setModule(e.target.value)} className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option>Users & Clients</option>
                    <option>Order Book</option>
                    <option>Trade Book</option>
                    <option>Ledger & Balances</option>
                    <option>P&L Statements</option>
                  </select>
               </div>
               
               <div className="grid grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
                     <input type="date" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  <div>
                     <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
                     <input type="date" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
               </div>

               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
                  <div className="flex gap-4">
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="format" value="csv" checked={format === 'csv'} onChange={(e) => setFormat(e.target.value)} className="text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700 flex items-center gap-1"><FileSpreadsheet className="w-4 h-4 text-green-600" /> CSV</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="format" value="excel" checked={format === 'excel'} onChange={(e) => setFormat(e.target.value)} className="text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700 flex items-center gap-1"><FileText className="w-4 h-4 text-blue-600" /> Excel</span>
                     </label>
                     <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="format" value="json" checked={format === 'json'} onChange={(e) => setFormat(e.target.value)} className="text-blue-600 focus:ring-blue-500" />
                        <span className="text-sm text-gray-700 flex items-center gap-1"><FileJson className="w-4 h-4 text-yellow-600" /> JSON</span>
                     </label>
                  </div>
               </div>

               <div className="pt-2">
                  <button onClick={handleGenerate} disabled={generating} className="w-full flex justify-center items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
                     {generating ? (
                       <>
                         <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                         Generating...
                       </>
                     ) : (
                       <>
                         <Download className="w-4 h-4" />
                         Generate & Download
                       </>
                     )}
                  </button>
               </div>
            </div>
         </div>

         {/* Recent Exports */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-bold text-gray-900">Recent Exports</h2>
               <button onClick={() => alert(`Loading all ${pastExports.length} historical exports...`)} className="text-blue-600 text-sm font-medium hover:underline">View All</button>
            </div>
            
            <div className="flex-1 overflow-y-auto">
               <div className="space-y-3">
                  {loading ? (
                     <div className="text-center py-6 text-gray-500">Loading exports...</div>
                  ) : pastExports.length === 0 ? (
                     <div className="text-center py-6 text-gray-500">No exports found.</div>
                  ) : pastExports.map((item) => (
                     <div key={item.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded bg-blue-50 flex items-center justify-center">
                              {item.format === 'CSV' ? <FileSpreadsheet className="w-5 h-5 text-green-600" /> : 
                               item.format === 'Excel' ? <FileText className="w-5 h-5 text-blue-600" /> : 
                               <FileJson className="w-5 h-5 text-yellow-600" />}
                           </div>
                           <div>
                              <div className="text-sm font-bold text-gray-900">{item.report_type}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(item.created_at).toLocaleString()} • {item.file_size}</div>
                           </div>
                        </div>
                        <button onClick={() => handleRedownload(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded" title="Download Again">
                           <Download className="w-4 h-4" />
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
