import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Shield, AlertTriangle, Play, Pause, ToggleLeft, ToggleRight, Save, RefreshCw, Globe, TrendingUp, Ban, Megaphone, Send } from 'lucide-react';
import { adminApi } from '../services/adminApi';

const circuitBreakers = [
  { instrument: 'NIFTY50', upperLimit: 5, lowerLimit: 5, currentTrigger: 'None', lastTriggered: 'Never', enabled: true },
  { instrument: 'RELIANCE', upperLimit: 10, lowerLimit: 10, currentTrigger: 'None', lastTriggered: '2026-04-22', enabled: true },
  { instrument: 'XAUUSD', upperLimit: 3, lowerLimit: 3, currentTrigger: 'None', lastTriggered: 'Never', enabled: true },
  { instrument: 'EURUSD', upperLimit: 2, lowerLimit: 2, currentTrigger: 'None', lastTriggered: 'Never', enabled: false },
];

const marginRules = [
  { segment: 'Equity (Intraday)', leverage: '5x', marginReq: '20%', peakMargin: '100%', status: 'active' },
  { segment: 'Equity (Delivery)', leverage: '1x', marginReq: '100%', peakMargin: '100%', status: 'active' },
  { segment: 'F&O (Futures)', leverage: '10x', marginReq: '10%', peakMargin: 'SPAN + Exposure', status: 'active' },
  { segment: 'F&O (Options)', leverage: '1x', marginReq: 'Premium', peakMargin: 'Premium', status: 'active' },
  { segment: 'MCX Gold', leverage: '20x', marginReq: '5%', peakMargin: '100%', status: 'active' },
  { segment: 'Forex Pairs', leverage: '50x', marginReq: '2%', peakMargin: '100%', status: 'active' },
];

const holidays = [
  { date: '2026-05-01', name: 'Maharashtra Day', segments: 'NSE, BSE' },
  { date: '2026-08-15', name: 'Independence Day', segments: 'All Indian' },
  { date: '2026-10-02', name: 'Gandhi Jayanti', segments: 'All Indian' },
  { date: '2026-11-01', name: 'Diwali', segments: 'NSE, BSE, MCX' },
];

export default function MarketControl() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [breakers, setBreakers] = useState(circuitBreakers);
  const [broadcasts, setBroadcasts] = useState([]);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);

  const fetchBroadcasts = async () => {
    try {
      const res = await adminApi.getNotifications();
      setBroadcasts(res?.notifications || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!title || !message) {
      alert("Title and message are required.");
      return;
    }
    setSubmittingBroadcast(true);
    try {
      await adminApi.sendBroadcast({ title, message, type, target_audience: 'all' });
      setTitle('');
      setMessage('');
      setType('info');
      alert('Broadcast sent successfully!');
      fetchBroadcasts();
    } catch (err) {
      alert(err.message || 'Failed to send broadcast');
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('market-control');
      const data = res?.market_control || [];
      const mapped = (data || []).map(s => ({
        id: s.id,
        segment: s.session_name,
        preOpen: '09:00',
        open: s.open_time,
        close: s.close_time,
        postClose: '16:00',
        status: s.status?.toLowerCase() || 'closed',
        color: 'blue'
      }));
      setSessions(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchBroadcasts();
  }, []);

  const toggleSession = async (session) => {
    try {
      const newStatus = session.status === 'open' ? 'Closed' : 'Open';
      await adminApi.updateCrmModule('market-control', session.id, { status: newStatus });
      fetchSessions();
    } catch (err) {
      alert('Failed to update session');
    }
  };

  const toggleBreaker = (index) => {
    setBreakers(prev => prev.map((b, i) => i === index ? { ...b, enabled: !b.enabled } : b));
  };

  const openSessions = sessions.filter(s => s.status === 'open').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Control Center</h1>
          <p className="text-sm text-gray-500 mt-1">Manage trading sessions, circuit breakers, margin rules, and market holidays.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => console.log('Action triggered')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 h-10 px-4 py-2">
            <Pause className="h-4 w-4 mr-2" />
            Halt All Markets
          </button>
          <button onClick={() => console.log('Action triggered')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 shadow-sm">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Globe className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-bold text-gray-500 uppercase">Active Markets</span>
          </div>
          <div className="text-xl font-black text-gray-900">{openSessions} / {sessions.length}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-xs font-bold text-gray-500 uppercase">Circuit Breakers</span>
          </div>
          <div className="text-xl font-black text-green-600">{breakers.filter(b => b.enabled).length} Active</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-bold text-gray-500 uppercase">Margin Segments</span>
          </div>
          <div className="text-xl font-black text-gray-900">{marginRules.length}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-red-500" />
            <span className="text-xs font-bold text-gray-500 uppercase">Upcoming Holidays</span>
          </div>
          <div className="text-xl font-black text-gray-900">{holidays.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trading Sessions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Trading Sessions
            </h2>
            <span className="text-[10px] font-bold text-gray-400">IST (UTC+5:30)</span>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading market sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No market sessions defined.</div>
            ) : sessions.map((session, i) => (
              <div key={session.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${session.status === 'open' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-sm font-bold text-gray-900">{session.segment}</span>
                  </div>
                  <button onClick={() => toggleSession(session)} className="touch-active-subtle">
                    {session.status === 'open' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded border border-green-200">
                        <Play className="h-3 w-3" /> OPEN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-[10px] font-bold rounded border border-red-200">
                        <Pause className="h-3 w-3" /> CLOSED
                      </span>
                    )}
                  </button>
                </div>
                <div className="grid grid-cols-4 gap-2 ml-4">
                  <div><span className="text-[9px] text-gray-400 block">Pre-Open</span><span className="text-xs font-bold text-gray-700">{session.preOpen}</span></div>
                  <div><span className="text-[9px] text-gray-400 block">Open</span><span className="text-xs font-bold text-green-600">{session.open}</span></div>
                  <div><span className="text-[9px] text-gray-400 block">Close</span><span className="text-xs font-bold text-red-600">{session.close}</span></div>
                  <div><span className="text-[9px] text-gray-400 block">Post-Close</span><span className="text-xs font-bold text-gray-700">{session.postClose}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Circuit Breakers */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-600" />
              Circuit Breaker Rules
            </h2>
            <button onClick={() => console.log('Action triggered')} className="text-xs text-blue-600 font-bold hover:text-blue-800">+ Add Rule</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-[10px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Instrument</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Upper %</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Lower %</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Enabled</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {breakers.map((cb, i) => (
                  <tr key={cb.instrument} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">{cb.instrument}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">+{cb.upperLimit}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded">-{cb.lowerLimit}%</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[10px] font-bold text-gray-500">{cb.currentTrigger}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleBreaker(i)}>
                        {cb.enabled ? <ToggleRight className="h-6 w-6 text-green-500 inline" /> : <ToggleLeft className="h-6 w-6 text-gray-300 inline" />}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Margin Rules */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            Margin & Leverage Rules
          </h2>
          <button onClick={() => console.log('Action triggered')} className="text-xs text-blue-600 font-bold hover:text-blue-800">+ Add Segment</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Segment</th>
                <th className="px-6 py-3 font-semibold text-center">Leverage</th>
                <th className="px-6 py-3 font-semibold text-center">Margin Required</th>
                <th className="px-6 py-3 font-semibold text-center">Peak Margin</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {marginRules.map(rule => (
                <tr key={rule.segment} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-bold text-gray-900">{rule.segment}</td>
                  <td className="px-6 py-3 text-center">
                    <span className="text-sm font-black text-blue-600 bg-blue-50 px-3 py-1 rounded-md">{rule.leverage}</span>
                  </td>
                  <td className="px-6 py-3 text-center font-bold text-gray-700">{rule.marginReq}</td>
                  <td className="px-6 py-3 text-center text-xs font-medium text-gray-500">{rule.peakMargin}</td>
                  <td className="px-6 py-3 text-center">
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded border border-green-200 uppercase">{rule.status}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <button onClick={() => console.log('Action triggered')} className="text-blue-600 hover:text-blue-800 font-bold text-xs bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded transition-colors">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Market Holidays */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Calendar className="h-4 w-4 text-red-500" />
            Upcoming Market Holidays
          </h2>
          <button onClick={() => console.log('Action triggered')} className="text-xs text-blue-600 font-bold hover:text-blue-800">+ Declare Holiday</button>
        </div>
        <div className="divide-y divide-gray-100">
          {holidays.map(h => (
            <div key={h.date} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center min-w-[80px]">
                  <div className="text-[10px] font-bold text-red-600 uppercase">{new Date(h.date).toLocaleString('en-US', { month: 'short' })}</div>
                  <div className="text-lg font-black text-red-700">{new Date(h.date).getDate()}</div>
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900">{h.name}</div>
                  <div className="text-xs text-gray-500">Affected: {h.segments}</div>
                </div>
              </div>
              <button onClick={() => console.log('Action triggered')} className="text-red-500 hover:text-red-700 text-xs font-bold bg-red-50 px-3 py-1.5 rounded hover:bg-red-100 border border-red-200">Remove</button>
            </div>
          ))}
        </div>
      </div>

      {/* System Broadcast / Announcements */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Form */}
        <div className="lg:col-span-1 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Megaphone className="h-4 w-4 text-blue-600" />
              Send System Broadcast
            </h2>
          </div>
          <form onSubmit={handleSendBroadcast} className="p-4 space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Scheduled Maintenance"
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Details of the announcement..."
                rows="3"
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="info">Information (Blue)</option>
                <option value="warning">Warning (Yellow)</option>
                <option value="system">System Notice (Orange)</option>
                <option value="alert">Alert (Red)</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={submittingBroadcast}
              className="w-full inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 h-10 px-4 py-2 shadow-sm"
            >
              <Send className="h-4 w-4 mr-2" />
              {submittingBroadcast ? 'Sending...' : 'Broadcast Announcement'}
            </button>
          </form>
        </div>

        {/* Broadcast History */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-purple-600" />
              Broadcast History (Last 5)
            </h2>
            <button
              onClick={fetchBroadcasts}
              className="text-xs font-bold text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-[10px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Created At</th>
                  <th className="px-4 py-2.5 font-semibold">Title & Message</th>
                  <th className="px-4 py-2.5 font-semibold text-center">Type</th>
                  <th className="px-4 py-2.5 font-semibold">By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {broadcasts.slice(0, 5).map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(b.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{b.title}</div>
                      <div className="text-xs text-gray-500 line-clamp-2">{b.message}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded uppercase border ${
                        b.type === 'warning' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        b.type === 'system' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                        b.type === 'alert' ? 'bg-red-100 text-red-800 border-red-200' :
                        'bg-blue-100 text-blue-800 border-blue-200'
                      }`}>
                        {b.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-600">
                      {b.admin?.email || 'System'}
                    </td>
                  </tr>
                ))}
                {broadcasts.length === 0 && (
                  <tr>
                    <td colSpan="4" className="text-center py-6 text-gray-500">
                      No announcements broadcasted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
