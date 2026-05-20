import { useState, useEffect } from 'react';
import { Search, Filter, Phone, Mail, UserPlus, CheckCircle, Clock } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Leads() {
  const [activeTab, setActiveTab] = useState('all');
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getLeads().then(res => setLeads(res.leads || [])).catch(console.error).finally(() => setLoading(false));
  }, []);

  const filteredLeads = leads.filter(l => activeTab === 'all' || l.status === activeTab);

  // Dynamic metrics calculation
  const newLeadsToday = leads.filter(l => {
    if (l.status !== 'new') return false;
    const date = new Date(l.created_at || l.date);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  }).length;
  
  const contactedCount = leads.filter(l => l.status === 'contacted').length;
  const kycPendingCount = leads.filter(l => l.status === 'kyc_pending').length;
  const convertedCount = leads.filter(l => l.status === 'converted').length;

  const handleUpdateLead = async (id, status) => {
    try {
      await adminApi.updateLead(id, { status });
      // Refresh leads
      adminApi.getLeads().then(res => setLeads(res.leads || [])).catch(console.error);
    } catch (err) {
      console.error(err);
      alert('Failed to update lead');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Lead Management (CRM)</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage onboarding, KYC, and sales pipeline.</p>
        </div>
        <button onClick={() => alert('Feature coming soon')} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Lead Manually
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-500">New Leads Today</div>
          <div className="text-2xl font-black text-blue-600 mt-1">{newLeadsToday}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-500">Contacted / Follow-up</div>
          <div className="text-2xl font-black text-orange-600 mt-1">{contactedCount}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-500">KYC Pending</div>
          <div className="text-2xl font-black text-yellow-600 mt-1">{kycPendingCount}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-bold text-gray-500">Converted (Total)</div>
          <div className="text-2xl font-black text-green-600 mt-1">{convertedCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Tabs & Filters */}
        <div className="border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-4 py-3 gap-4">
          <nav className="flex space-x-2 overflow-x-auto" aria-label="Tabs">
            {['all', 'new', 'contacted', 'kyc_pending', 'converted'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize px-3 py-1.5 font-medium text-sm rounded-md transition-colors whitespace-nowrap ${
                  activeTab === tab 
                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </nav>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search name, email, phone..."
                className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Lead ID</th>
                <th className="px-4 py-3 font-semibold">Name</th>
                <th className="px-4 py-3 font-semibold">Contact Details</th>
                <th className="px-4 py-3 font-semibold">Source</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredLeads.length > 0 ? filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900 text-xs">{lead.id}</td>
                  <td className="px-4 py-3 font-bold text-gray-900">{lead.name}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      <a href={`mailto:${lead.email}`} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Mail className="h-3 w-3"/> {lead.email}</a>
                      <a href={`tel:${lead.phone}`} className="text-xs text-gray-600 flex items-center gap-1"><Phone className="h-3 w-3"/> {lead.phone}</a>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs font-medium">{lead.source}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                      lead.status === 'new' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      lead.status === 'kyc_pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      lead.status === 'converted' ? 'bg-green-50 text-green-700 border-green-200' :
                      'bg-gray-100 text-gray-700 border-gray-200'
                    }`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs"><Clock className="inline-block h-3 w-3 mr-1"/>{lead.date}</td>
                  <td className="px-4 py-3 text-right">
                    {lead.status !== 'converted' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleUpdateLead(lead.id, 'contacted')} className="px-3 py-1 bg-white border border-gray-300 text-gray-700 text-xs font-bold rounded hover:bg-gray-50 shadow-sm">Log Call</button>
                        {lead.status === 'kyc_pending' ? (
                          <button onClick={() => handleUpdateLead(lead.id, 'converted')} className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 shadow-sm flex items-center gap-1"><CheckCircle className="h-3 w-3"/> Approve KYC</button>
                        ) : (
                          <button onClick={() => handleUpdateLead(lead.id, 'kyc_pending')} className="px-3 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 shadow-sm flex items-center gap-1">Mark KYC Pending</button>
                        )}
                      </div>
                    )}
                    {lead.status === 'converted' && (
                       <button onClick={() => alert('View Client Profile - Coming soon')} className="px-3 py-1 bg-white border border-gray-300 text-blue-600 text-xs font-bold rounded hover:bg-gray-50 shadow-sm">View Client Profile</button>
                    )}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No leads found for this filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
