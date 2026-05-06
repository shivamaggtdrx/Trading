import React, { useState } from 'react';
import { Search, FileText, CheckCircle, XCircle, Clock, Download, Eye } from 'lucide-react';

export default function DocumentVault() {
  const docs = [
    { id: 'DOC-9012', client: 'TDX-1192', type: 'PAN Card', uploaded: '2 hours ago', status: 'Pending' },
    { id: 'DOC-9011', client: 'TDX-1192', type: 'Bank Statement', uploaded: '2 hours ago', status: 'Pending' },
    { id: 'DOC-8890', client: 'TDX-0881', type: 'Aadhaar (Front)', uploaded: '1 day ago', status: 'Verified' },
    { id: 'DOC-8891', client: 'TDX-0881', type: 'Aadhaar (Back)', uploaded: '1 day ago', status: 'Verified' },
    { id: 'DOC-8802', client: 'TDX-3309', type: 'Income Proof', uploaded: '3 days ago', status: 'Rejected' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Document Vault</h1>
          <p className="text-sm text-gray-500 mt-1">Centralized secure storage for all client KYC documents and agreements.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="relative flex-1 min-w-[300px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by Document ID or Client ID..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex gap-2">
             <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none">
               <option>All Document Types</option><option>PAN</option><option>Aadhaar</option><option>Bank Proof</option>
             </select>
             <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none">
               <option>All Statuses</option><option>Pending Verification</option><option>Verified</option><option>Rejected</option>
             </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase">
              <tr>
                <th className="py-3 px-4">Doc ID</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Uploaded</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docs.map(d => (
                 <tr key={d.id} className="hover:bg-gray-50">
                   <td className="py-3 px-4 font-mono text-xs text-gray-500">{d.id}</td>
                   <td className="py-3 px-4 font-bold text-blue-600 hover:underline cursor-pointer">{d.client}</td>
                   <td className="py-3 px-4 flex items-center gap-2 font-medium text-gray-900"><FileText className="w-4 h-4 text-gray-400" /> {d.type}</td>
                   <td className="py-3 px-4 text-gray-500">{d.uploaded}</td>
                   <td className="py-3 px-4">
                     <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border flex inline-flex items-center gap-1 ${
                        d.status === 'Verified' ? 'bg-green-50 text-green-700 border-green-200' : 
                        d.status === 'Pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                        'bg-red-50 text-red-700 border-red-200'
                     }`}>
                        {d.status === 'Verified' && <CheckCircle className="w-3 h-3" />}
                        {d.status === 'Pending' && <Clock className="w-3 h-3" />}
                        {d.status === 'Rejected' && <XCircle className="w-3 h-3" />}
                        {d.status}
                     </span>
                   </td>
                   <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                         <button onClick={() => alert(`Viewing document ${d.id}`)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="View"><Eye className="w-4 h-4" /></button>
                         <button onClick={() => alert(`Downloading document ${d.id}`)} className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="Download"><Download className="w-4 h-4" /></button>
                         {d.status === 'Pending' && (
                            <button onClick={() => alert('Quick verify mode')} className="text-xs font-bold text-blue-600 hover:underline ml-2">Verify Now</button>
                         )}
                      </div>
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
