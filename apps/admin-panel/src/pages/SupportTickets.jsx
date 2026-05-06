import { useState, useEffect } from 'react';
import { LifeBuoy, Search, Filter, MessageCircle, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function SupportTickets() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('open');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [replyStatus, setReplyStatus] = useState('open');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getTickets();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReply = async () => {
    if (!replyMessage) return alert('Message required');
    setSubmitting(true);
    try {
      await adminApi.replyToTicket(selectedTicket.id, replyMessage, replyStatus);
      setSelectedTicket(null);
      setReplyMessage('');
      fetchTickets();
    } catch (err) {
      alert('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = activeTab === 'all' ? tickets : tickets.filter(t => t.status === activeTab || (activeTab==='open' && t.status==='in_progress'));

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600 border-gray-200',
    medium: 'bg-blue-100 text-blue-700 border-blue-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">Manage client queries, bugs, and account issues.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">Open Tickets</div>
          <div className="text-2xl font-black text-orange-600">24</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">Critical Priority</div>
          <div className="text-2xl font-black text-red-600">3</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">Resolved (Today)</div>
          <div className="text-2xl font-black text-green-600">18</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="text-xs font-bold text-gray-500 uppercase mb-1">Avg First Response</div>
          <div className="text-2xl font-black text-gray-900">14m</div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-4 py-3 gap-4">
          <nav className="flex space-x-2">
            {['open', 'resolved', 'all'].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`capitalize px-3 py-1.5 font-medium text-sm rounded-md transition-colors ${
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
            <input type="text" placeholder="Search ID or subject..." className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 bg-white" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Ticket</th>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold">Subject</th>
                <th className="px-4 py-3 font-semibold">Priority</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Assigned</th>
                <th className="px-4 py-3 font-semibold">Time</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">Loading tickets...</td></tr>
              ) : filtered.length > 0 ? filtered.map(t => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-bold text-gray-900 text-xs">{t.ticket_number}</td>
                  <td className="px-4 py-3 font-bold text-blue-600 text-xs">{t.profiles?.client_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-800">{t.subject}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${priorityColors[t.priority]}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 text-xs font-bold ${t.status === 'resolved' ? 'text-green-600' : t.status === 'in_progress' ? 'text-blue-600' : 'text-orange-600'}`}>
                      {t.status === 'resolved' ? <CheckCircle className="h-3 w-3"/> : <AlertCircle className="h-3 w-3"/>}
                      {t.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600">{t.admin?.email || 'Unassigned'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{new Date(t.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => { setSelectedTicket(t); setReplyStatus(t.status); setReplyMessage(''); }} className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[10px] rounded border border-blue-200">
                      Reply / View
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No tickets found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-xl shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-1">{selectedTicket.ticket_number} - {selectedTicket.subject}</h3>
            <p className="text-sm text-gray-500 mb-4">By {selectedTicket.profiles?.client_id}</p>
            
            <div className="bg-gray-50 p-3 rounded mb-4 text-sm text-gray-800">
              {selectedTicket.message}
            </div>

            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Reply</label>
                <textarea value={replyMessage} onChange={e => setReplyMessage(e.target.value)} rows={4} className="w-full border border-gray-300 rounded p-2 text-sm" placeholder="Type your response to the client..."></textarea>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Update Status</label>
                <select value={replyStatus} onChange={e => setReplyStatus(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm">
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setSelectedTicket(null)} className="flex-1 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleReply} disabled={submitting} className="flex-1 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 disabled:opacity-50">
                {submitting ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
