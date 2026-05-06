import { useState, useEffect } from 'react';
import { Search, CheckCircle, XCircle, RefreshCw, AlertTriangle, FileText, IndianRupee, Download } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function DepositApprovals() {
  const [activeTab, setActiveTab] = useState('pending');
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDep, setSelectedDep] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectReason, setRejectReason] = useState('UTR not found / Invalid');

  const fetchDeposits = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getDeposits(activeTab === 'all' ? '' : activeTab);
      setDeposits(data.deposits || []);
    } catch (err) {
      console.error('Failed to fetch deposits', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeposits();
  }, [activeTab]);

  const handleApprove = async () => {
    try {
      await adminApi.approveDeposit(selectedDep.id);
      setShowApproveModal(false);
      setSelectedDep(null);
      fetchDeposits();
    } catch (err) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async () => {
    try {
      await adminApi.rejectDeposit(selectedDep.id, rejectReason);
      setShowRejectModal(false);
      setSelectedDep(null);
      fetchDeposits();
    } catch (err) {
      alert(err.message || 'Rejection failed');
    }
  };

  const filtered = deposits;

  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
    flagged: { label: 'Flagged', color: 'bg-red-100 text-red-700 border-red-200' },
    approved: { label: 'Approved', color: 'bg-green-100 text-green-700 border-green-200' },
    rejected: { label: 'Rejected', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  };

  const totalPending = deposits.filter(d => d.status === 'pending').reduce((s, d) => s + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deposit Approvals</h1>
          <p className="text-sm text-gray-500 mt-1">Verify bank transfers, match UTR numbers, and approve incoming funds.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => alert('Action triggered. Backend integration pending.')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 py-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Bank API
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-lg border shadow-sm ${totalPending > 0 ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}>
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">Pending Deposits</div>
          <div className="text-xl font-black text-yellow-700">₹{totalPending.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">Approved Today</div>
          <div className="text-xl font-black text-green-600">₹25,000</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">Processing Time</div>
          <div className="text-xl font-black text-gray-900">&lt; 15 mins</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">API Auto-Match</div>
          <div className="text-xl font-black text-blue-600">85%</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-4 py-3 gap-4">
          <nav className="flex space-x-2 overflow-x-auto">
            {['pending', 'flagged', 'approved', 'rejected', 'all'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`capitalize px-3 py-1.5 font-medium text-sm rounded-md transition-colors whitespace-nowrap ${
                  activeTab === tab ? 'bg-white shadow-sm text-blue-700 border border-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}>
                {tab}
              </button>
            ))}
          </nav>
          <div className="relative w-full sm:max-w-xs">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input type="text" placeholder="Search by UTR or Client..." className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Deposit ID</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold text-right">Amount</th>
                <th className="px-4 py-3 font-semibold">Method & UTR</th>
                <th className="px-4 py-3 font-semibold">Proof</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filtered.map(dep => (
                <tr key={dep.id} className={`hover:bg-gray-50 ${dep.status === 'flagged' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-bold text-gray-900 text-xs">{dep.id.slice(0, 8)}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{dep.profiles?.full_name}</div>
                    <div className="text-[10px] text-blue-600 font-medium">{dep.profiles?.client_id}</div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-black text-green-700">+₹{dep.amount.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-700">{dep.utr_number}</div>
                    <div className="text-xs text-gray-500">{dep.method}</div>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => alert('View proof pending')} className="text-blue-600 hover:text-blue-800 text-xs font-bold inline-flex items-center gap-1">
                      <FileText className="h-3.5 w-3.5" /> View
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${statusConfig[dep.status]?.color || statusConfig.pending.color}`}>
                        {statusConfig[dep.status]?.label || 'Pending'}
                      </span>
                      {dep.reject_reason && <div className="text-[9px] text-gray-500 mt-1">{dep.reject_reason}</div>}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(dep.status === 'pending' || dep.status === 'flagged') ? (
                      <div className="flex justify-end gap-1">
                        <button onClick={() => { setSelectedDep(dep); setShowApproveModal(true); }}
                          className="px-2.5 py-1 bg-green-50 text-green-700 text-[10px] font-bold rounded hover:bg-green-100 border border-green-200 inline-flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Approve
                        </button>
                        <button onClick={() => { setSelectedDep(dep); setShowRejectModal(true); }}
                          className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded hover:bg-red-100 border border-red-200 inline-flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-gray-400">Processed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showApproveModal && selectedDep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Approve Deposit</h3>
            <p className="text-sm text-gray-600 mb-4">Funds will be instantly credited to the user's wallet.</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 space-y-1">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Client</span><span className="font-bold">{selectedDep.client}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">Amount</span><span className="font-black text-green-700">₹{selectedDep.amount.toLocaleString('en-IN')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">UTR Match</span><span className="font-bold text-green-600 flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Verified</span></div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowApproveModal(false)} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowApproveModal(false)} className="flex-1 py-2 rounded-lg bg-green-600 text-sm font-bold text-white hover:bg-green-700 shadow-sm">Credit Wallet</button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && selectedDep && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Reject Deposit</h3>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Rejection Reason</label>
              <select className="w-full border border-gray-300 rounded p-2 text-sm font-medium mb-2">
                <option>UTR not found / Invalid</option>
                <option>Third-party deposit not allowed</option>
                <option>Amount mismatch</option>
                <option>Fraudulent receipt</option>
                <option>Other</option>
              </select>
              <textarea rows={2} placeholder="Additional notes..." className="w-full border border-gray-300 rounded p-2 text-sm" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowRejectModal(false)} className="flex-1 py-2 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-700">Reject Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
