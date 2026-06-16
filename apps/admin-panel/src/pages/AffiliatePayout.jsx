import { useState, useEffect, useCallback } from 'react';
import {
  Banknote, RefreshCw, Filter, CheckCircle, XCircle, Clock, Eye,
  ChevronRight, Loader2, Plus, Search, AlertTriangle, CreditCard,
  Calendar, FileText, Download, Users2
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const api = {
  get: (path) => fetch(`${API_BASE}/api/admin${path}`, { credentials: 'include' }).then(r => r.json()),
  post: (path, body) => fetch(`${API_BASE}/api/admin${path}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json()),
};

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  color: 'bg-amber-100 text-amber-700',  icon: Clock },
  approved: { label: 'Approved', color: 'bg-blue-100 text-blue-700',    icon: CheckCircle },
  paid:     { label: 'Paid',     color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700',      icon: XCircle },
};

const fmt = v => `₹${parseFloat(v || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
const fmtDate = d => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

// ─── PAY MODAL ────────────────────────────────────────────────
function PayModal({ payout, onClose, onDone }) {
  const [form, setForm] = useState({ payment_method: 'bank_transfer', payment_reference: '', payment_date: new Date().toISOString().split('T')[0], notes: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePay = async () => {
    if (!form.payment_reference) { setError('Payment reference is required'); return; }
    setSaving(true);
    const r = await api.post(`/affiliate-payouts/${payout.id}/pay`, form);
    setSaving(false);
    if (r.message) { onDone(); onClose(); }
    else setError(r.error || 'Failed to mark as paid');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Mark as Paid</h3>
            <p className="text-sm text-gray-500">{payout.affiliate_accounts?.name} — {fmt(payout.total_amount)}</p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <p className="text-sm font-semibold text-amber-700">⚠ This action is irreversible. Confirm payment details carefully.</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Payment Method</label>
            <select value={form.payment_method} onChange={e => setForm(f => ({ ...f, payment_method: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
              <option value="bank_transfer">Bank Transfer (NEFT/RTGS)</option>
              <option value="upi">UPI</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">UTR / Transaction Reference *</label>
            <input value={form.payment_reference} onChange={e => setForm(f => ({ ...f, payment_reference: e.target.value }))}
              placeholder="Enter UTR number or transaction ID"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Payment Date</label>
            <input type="date" value={form.payment_date} onChange={e => setForm(f => ({ ...f, payment_date: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Notes (optional)</label>
            <textarea rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handlePay} disabled={saving}
            className="flex-1 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            Confirm Paid
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── DETAIL MODAL ──────────────────────────────────────────────
function DetailModal({ payoutId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/affiliate-payouts/${payoutId}`).then(r => { setData(r); setLoading(false); });
  }, [payoutId]);

  if (loading) return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
    </div>
  );

  const { payout, commissions } = data || {};
  const cfg = STATUS_CONFIG[payout?.status] || STATUS_CONFIG.pending;
  const StatusIcon = cfg.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">Payout Details</h3>
              <p className="text-sm text-gray-500">{payout?.affiliate_accounts?.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl font-bold">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Affiliate</span><span className="font-semibold text-gray-800">{payout?.affiliate_accounts?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Code</span><span className="font-mono text-indigo-600 font-bold">{payout?.affiliate_accounts?.affiliate_code}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Period</span><span className="font-semibold text-gray-800">{fmtDate(payout?.period_start)} – {fmtDate(payout?.period_end)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-500">Commissions</span><span className="font-semibold text-gray-800">{payout?.commission_count} events</span></div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm"><span className="text-gray-500">Total Amount</span><span className="font-bold text-2xl text-emerald-600">{fmt(payout?.total_amount)}</span></div>
              <div className="flex justify-between text-sm items-center"><span className="text-gray-500">Status</span><span className={`text-xs font-bold px-2 py-1 rounded-full ${cfg.color}`}>{cfg.label}</span></div>
              {payout?.payment_reference && <>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Method</span><span className="font-semibold text-gray-800 capitalize">{payout.payment_method?.replace('_', ' ')}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">UTR Ref</span><span className="font-mono text-xs text-gray-800 font-bold">{payout.payment_reference}</span></div>
              </>}
            </div>
          </div>

          {/* Commissions Breakdown */}
          <div>
            <h4 className="text-sm font-bold text-gray-700 mb-2">Commission Breakdown ({commissions?.length || 0} events)</h4>
            <div className="rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-gray-50"><tr>
                  {['Type', 'Source Amt', 'Rate', 'Commission', 'Date', 'Status'].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold text-gray-500 uppercase">{h}</th>
                  ))}
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {(commissions || []).map(c => (
                    <tr key={c.id} className="hover:bg-gray-50">
                      <td className="px-3 py-2"><span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${c.commission_type === 'deposit' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>{c.commission_type}</span></td>
                      <td className="px-3 py-2 font-semibold">{fmt(c.source_amount)}</td>
                      <td className="px-3 py-2 text-gray-500">{c.commission_pct}%</td>
                      <td className="px-3 py-2 font-bold text-emerald-600">{fmt(c.commission_amount)}</td>
                      <td className="px-3 py-2 text-gray-500">{fmtDate(c.created_at)}</td>
                      <td className="px-3 py-2"><span className="font-bold text-emerald-600 capitalize">{c.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CREATE PAYOUT MODAL ───────────────────────────────────────
function CreatePayoutModal({ affiliates, onClose, onDone }) {
  const [form, setForm] = useState({ affiliate_id: '', period_start: '', period_end: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!form.affiliate_id || !form.period_start || !form.period_end) { setError('All fields required'); return; }
    setSaving(true);
    const r = await api.post('/affiliate-payouts', form);
    setSaving(false);
    if (r.payout) { onDone(); onClose(); }
    else setError(r.error || 'Failed to create payout request');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h3 className="text-lg font-bold text-gray-900">Create Payout Request</h3>
        <p className="text-sm text-gray-500">Groups all pending commissions in the period into a single payout request.</p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Affiliate *</label>
            <select value={form.affiliate_id} onChange={e => setForm(f => ({ ...f, affiliate_id: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30">
              <option value="">Select affiliate</option>
              {affiliates.filter(a => a.status === 'active').map(a => (
                <option key={a.id} value={a.id}>{a.name} ({a.affiliate_code}) — Pending: {fmt(a.pending_balance)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Period Start *</label>
              <input type="date" value={form.period_start} onChange={e => setForm(f => ({ ...f, period_start: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Period End *</label>
              <input type="date" value={form.period_end} onChange={e => setForm(f => ({ ...f, period_end: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 font-semibold">{error}</p>}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 border border-gray-200 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleCreate} disabled={saving}
            className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Create Request
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────
export default function AffiliatePayout() {
  const [payouts, setPayouts] = useState([]);
  const [affiliates, setAffiliates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [viewId, setViewId] = useState(null);
  const [payingPayout, setPayingPayout] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [msg, setMsg] = useState('');
  const [total, setTotal] = useState(0);

  const notify = (text) => { setMsg(text); setTimeout(() => setMsg(''), 3000); };

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ limit: 100 });
    if (statusFilter) params.set('status', statusFilter);
    const [r, a] = await Promise.all([api.get(`/affiliate-payouts?${params}`), api.get('/affiliates')]);
    setPayouts(r.payouts || []);
    setTotal(r.total || 0);
    setAffiliates(a.affiliates || []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (id) => {
    setActionLoading(id + '_approve');
    const r = await api.post(`/affiliate-payouts/${id}/approve`, {});
    setActionLoading(null);
    if (r.message) { notify('✓ Payout approved'); load(); }
    else notify(r.error || 'Failed');
  };

  const handleReject = async (id) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    setActionLoading(id + '_reject');
    const r = await api.post(`/affiliate-payouts/${id}/reject`, { reason });
    setActionLoading(null);
    if (r.message) { notify('Payout rejected'); load(); }
  };

  // Stats
  const pending = payouts.filter(p => p.status === 'pending');
  const approved = payouts.filter(p => p.status === 'approved');
  const paid = payouts.filter(p => p.status === 'paid');
  const pendingTotal = pending.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
  const approvedTotal = approved.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);
  const paidTotal = paid.reduce((s, p) => s + parseFloat(p.total_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Banknote className="w-7 h-7 text-emerald-600" />
            Affiliate Payouts
          </h1>
          <p className="text-sm text-gray-500 mt-1">Track and process bi-weekly affiliate commission payouts</p>
        </div>
        <div className="flex items-center gap-2">
          {msg && <span className={`text-sm font-semibold ${msg.startsWith('✓') ? 'text-emerald-600' : 'text-red-500'}`}>{msg}</span>}
          <button onClick={load} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"><RefreshCw className="w-4 h-4" /></button>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus className="w-4 h-4" />New Payout Request
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center"><Clock className="w-5 h-5 text-amber-600" /></div>
            <p className="text-sm font-bold text-gray-500 uppercase">Pending</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(pendingTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">{pending.length} requests awaiting review</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center"><CheckCircle className="w-5 h-5 text-blue-600" /></div>
            <p className="text-sm font-bold text-gray-500 uppercase">Approved</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(approvedTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">{approved.length} requests ready to pay</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Banknote className="w-5 h-5 text-emerald-600" /></div>
            <p className="text-sm font-bold text-gray-500 uppercase">Paid (All Time)</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(paidTotal)}</p>
          <p className="text-xs text-gray-400 mt-1">{paid.length} payouts completed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        {['', 'pending', 'approved', 'paid', 'rejected'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
        <span className="ml-auto text-sm text-gray-400">{total} total</span>
      </div>

      {/* Payouts Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Affiliate', 'Period', 'Commissions', 'Amount', 'Status', 'Requested', 'Payment Ref', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payouts.map(p => {
                  const cfg = STATUS_CONFIG[p.status] || STATUS_CONFIG.pending;
                  const StatusIcon = cfg.icon;
                  const isActioning = actionLoading?.startsWith(p.id);
                  return (
                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-900">{p.affiliate_accounts?.name}</p>
                        <p className="font-mono text-xs text-indigo-600">{p.affiliate_accounts?.affiliate_code}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        <span className="text-xs">{fmtDate(p.period_start)} – {fmtDate(p.period_end)}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-700 text-center">{p.commission_count}</td>
                      <td className="px-4 py-3 font-bold text-gray-900 text-lg">{fmt(p.total_amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${cfg.color}`}>
                          <StatusIcon className="w-3 h-3" />{cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">{fmtDate(p.requested_at)}</td>
                      <td className="px-4 py-3">
                        {p.payment_reference
                          ? <span className="font-mono text-xs text-gray-700 bg-gray-100 px-2 py-1 rounded">{p.payment_reference}</span>
                          : <span className="text-gray-400 text-xs">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => setViewId(p.id)} className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded hover:bg-indigo-50 transition-colors">
                            <Eye className="w-3 h-3" />View
                          </button>
                          {p.status === 'pending' && (
                            <>
                              <button onClick={() => handleApprove(p.id)} disabled={isActioning}
                                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-semibold px-2 py-1 rounded hover:bg-emerald-50 transition-colors disabled:opacity-50">
                                {actionLoading === p.id + '_approve' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}Approve
                              </button>
                              <button onClick={() => handleReject(p.id)} disabled={isActioning}
                                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1 rounded hover:bg-red-50 transition-colors disabled:opacity-50">
                                <XCircle className="w-3 h-3" />Reject
                              </button>
                            </>
                          )}
                          {p.status === 'approved' && (
                            <button onClick={() => setPayingPayout(p)}
                              className="flex items-center gap-1 text-xs text-emerald-600 hover:text-emerald-800 font-bold px-2 py-1 rounded bg-emerald-50 hover:bg-emerald-100 transition-colors">
                              <Banknote className="w-3 h-3" />Mark Paid
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {payouts.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Banknote className="w-10 h-10 text-gray-200" />
                      <p className="text-gray-400 text-sm font-semibold">No payout requests found</p>
                      <p className="text-gray-300 text-xs">Create one using the button above</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {viewId && <DetailModal payoutId={viewId} onClose={() => setViewId(null)} />}
      {payingPayout && <PayModal payout={payingPayout} onClose={() => setPayingPayout(null)} onDone={load} />}
      {showCreate && <CreatePayoutModal affiliates={affiliates} onClose={() => setShowCreate(false)} onDone={load} />}
    </div>
  );
}
