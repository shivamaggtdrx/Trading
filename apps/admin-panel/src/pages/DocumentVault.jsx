import React, { useState, useEffect } from 'react';
import { Search, FileText, CheckCircle, XCircle, Clock, Download, Eye } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function DocumentVault() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('All Document Types');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [search, setSearch] = useState('');

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getKycDocuments('all');
      setDocs(res.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleVerify = async (id) => {
    try {
      await adminApi.verifyKyc(id);
      fetchDocs();
    } catch (err) {
      alert('Failed to verify document');
    }
  };

  const filteredDocs = docs.filter(d => {
    if (filterStatus !== 'All Statuses' && d.status.toLowerCase() !== filterStatus.toLowerCase()) return false;
    if (filterType !== 'All Document Types' && d.document_type !== filterType) return false;
    if (search && !JSON.stringify(d).toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

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
            <input 
              type="text" 
              placeholder="Search by Document ID or Client ID..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
            />
          </div>
          <div className="flex gap-2">
             <select 
               value={filterType} 
               onChange={e => setFilterType(e.target.value)}
               className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none"
             >
               <option>All Document Types</option><option value="pan_card">PAN Card</option><option value="aadhaar">Aadhaar</option><option value="bank_proof">Bank Proof</option>
             </select>
             <select 
               value={filterStatus} 
               onChange={e => setFilterStatus(e.target.value)}
               className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none"
             >
               <option>All Statuses</option><option value="pending">Pending</option><option value="verified">Verified</option><option value="rejected">Rejected</option>
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
              {loading ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">Loading documents...</td></tr>
              ) : filteredDocs.length === 0 ? (
                <tr><td colSpan="6" className="text-center py-8 text-gray-500">No documents found.</td></tr>
              ) : filteredDocs.map(d => (
                 <tr key={d.id} className="hover:bg-gray-50">
                   <td className="py-3 px-4 font-mono text-xs text-gray-500">DOC-{d.id.substring(0,8).toUpperCase()}</td>
                   <td className="py-3 px-4 font-bold text-blue-600 hover:underline cursor-pointer">{d.profiles?.client_id || 'Unknown'}</td>
                   <td className="py-3 px-4 flex items-center gap-2 font-medium text-gray-900"><FileText className="w-4 h-4 text-gray-400" /> {d.document_type.replace('_', ' ').toUpperCase()}</td>
                   <td className="py-3 px-4 text-gray-500">{new Date(d.created_at).toLocaleString()}</td>
                   <td className="py-3 px-4">
                     <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border flex inline-flex items-center gap-1 ${
                        d.status === 'verified' ? 'bg-green-50 text-green-700 border-green-200' : 
                        d.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 
                        'bg-red-50 text-red-700 border-red-200'
                     }`}>
                        {d.status === 'verified' && <CheckCircle className="w-3 h-3" />}
                        {d.status === 'pending' && <Clock className="w-3 h-3" />}
                        {d.status === 'rejected' && <XCircle className="w-3 h-3" />}
                        {d.status}
                     </span>
                   </td>
                   <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2 items-center">
                         <a href={d.file_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-600 hover:bg-gray-100 rounded" title="View"><Eye className="w-4 h-4" /></a>
                         {d.status === 'pending' && (
                            <button onClick={() => handleVerify(d.id)} className="text-xs font-bold text-blue-600 hover:underline ml-2 bg-blue-50 px-2 py-1 rounded">Verify</button>
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
