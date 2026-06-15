import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Shield, AlertTriangle, Play, Pause, ToggleLeft, ToggleRight, Save, RefreshCw, Globe, TrendingUp, Ban, Megaphone, Send, Edit, X } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function MarketControl() {
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [instruments, setInstruments] = useState([]);
  const [loadingInstruments, setLoadingInstruments] = useState(true);
  const [breakerSearch, setBreakerSearch] = useState('');
  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(true);
  const [broadcasts, setBroadcasts] = useState([]);
  const [killSwitchActive, setKillSwitchActive] = useState(false);

  // Broadcast Form States
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);

  // Modals & Dialog states
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [holidayDate, setHolidayDate] = useState('');
  const [holidayDesc, setHolidayDesc] = useState('');
  const [holidayExchange, setHolidayExchange] = useState('NSE');
  const [submittingHoliday, setSubmittingHoliday] = useState(false);

  const [showEditSession, setShowEditSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState('');
  const [sessionEndTime, setSessionEndTime] = useState('');
  const [submittingSession, setSubmittingSession] = useState(false);

  const [showEditInstrument, setShowEditInstrument] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(null);
  const [instUpper, setInstUpper] = useState('');
  const [instLower, setInstLower] = useState('');
  const [instMargin, setInstMargin] = useState('');
  const [instLeverage, setInstLeverage] = useState('');
  const [submittingInstrument, setSubmittingInstrument] = useState(false);

  useEffect(() => {
    fetchSessions();
    fetchInstruments();
    fetchHolidays();
    fetchBroadcasts();
    fetchKillSwitchStatus();
  }, []);

  const fetchKillSwitchStatus = async () => {
    try {
      const res = await adminApi.getRiskManagement();
      setKillSwitchActive(res?.killSwitchActive || false);
    } catch (err) {
      console.error('Failed to fetch kill switch status:', err);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoadingSessions(true);
      const res = await adminApi.getCrmModule('market-control');
      const data = res?.market_control || [];
      const mapped = (data || []).map(s => ({
        id: s.id,
        segment: s.segment || s.session_name,
        preOpen: '09:00',
        open: s.start_time ? s.start_time.slice(0, 5) : '09:15',
        close: s.end_time ? s.end_time.slice(0, 5) : '15:30',
        postClose: '16:00',
        status: (s.trading_status || 'closed').toLowerCase(),
        color: 'blue'
      }));
      setSessions(mapped);
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchInstruments = async () => {
    try {
      setLoadingInstruments(true);
      const res = await adminApi.getInstruments();
      setInstruments(res.instruments || []);
    } catch (err) {
      console.error('Failed to fetch instruments:', err);
    } finally {
      setLoadingInstruments(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      setLoadingHolidays(true);
      const res = await adminApi.getCrmModule('market-holidays');
      setHolidays(res?.market_holidays || []);
    } catch (err) {
      console.error('Failed to fetch holidays:', err);
    } finally {
      setLoadingHolidays(false);
    }
  };

  const fetchBroadcasts = async () => {
    try {
      const res = await adminApi.getNotifications();
      setBroadcasts(res?.notifications || []);
    } catch (err) {
      console.error('Failed to fetch broadcasts:', err);
    }
  };

  const handleToggleKillSwitch = async () => {
    const nextVal = !killSwitchActive;
    const actionText = nextVal ? 'HALT ALL trading across all markets' : 'RESUME trading across all markets';
    if (!window.confirm(`Are you sure you want to ${actionText}?`)) return;
    try {
      await adminApi.toggleKillSwitch(nextVal);
      setKillSwitchActive(nextVal);
      alert(`Markets successfully ${nextVal ? 'halted' : 'resumed'}`);
    } catch (err) {
      alert('Failed to toggle kill switch: ' + err.message);
    }
  };

  const toggleSession = async (session) => {
    try {
      const newStatus = session.status === 'open' ? 'closed' : 'open';
      await adminApi.updateCrmModule('market-control', session.id, { trading_status: newStatus });
      fetchSessions();
    } catch (err) {
      alert('Failed to update session status: ' + err.message);
    }
  };

  const handleEditSession = (session) => {
    setSelectedSession(session);
    setSessionStartTime(session.open);
    setSessionEndTime(session.close);
    setShowEditSession(true);
  };

  const handleUpdateSessionTimings = async (e) => {
    e.preventDefault();
    if (!sessionStartTime || !sessionEndTime) return alert('Start and end times are required');
    setSubmittingSession(true);
    try {
      await adminApi.updateCrmModule('market-control', selectedSession.id, {
        start_time: sessionStartTime + ':00',
        end_time: sessionEndTime + ':00'
      });
      alert('Session timings updated successfully');
      setShowEditSession(false);
      fetchSessions();
    } catch (err) {
      alert('Failed to update session timings: ' + err.message);
    } finally {
      setSubmittingSession(false);
    }
  };

  const handleEditInstrument = (inst) => {
    setSelectedInstrument(inst);
    setInstUpper(inst.circuit_upper_pct || 10);
    setInstLower(inst.circuit_lower_pct || 10);
    setInstMargin(inst.margin_required || 20);
    setInstLeverage(inst.max_leverage || 5);
    setShowEditInstrument(true);
  };

  const handleUpdateInstrumentSettings = async (e) => {
    e.preventDefault();
    const upper = parseFloat(instUpper);
    const lower = parseFloat(instLower);
    const margin = parseFloat(instMargin);
    const lev = parseFloat(instLeverage);

    if (isNaN(upper) || upper <= 0 || isNaN(lower) || lower <= 0 || isNaN(margin) || margin <= 0 || isNaN(lev) || lev <= 0) {
      return alert('All fields must be positive numeric values');
    }

    setSubmittingInstrument(true);
    try {
      await adminApi.updateInstrument(selectedInstrument.id, {
        circuit_upper_pct: upper,
        circuit_lower_pct: lower,
        margin_required: margin,
        max_leverage: lev
      });
      alert('Instrument settings updated successfully');
      setShowEditInstrument(false);
      fetchInstruments();
    } catch (err) {
      alert('Failed to update instrument settings: ' + err.message);
    } finally {
      setSubmittingInstrument(false);
    }
  };

  const handleToggleInstrumentStatus = async (inst) => {
    try {
      const nextVal = !inst.trading_enabled;
      await adminApi.updateInstrument(inst.id, { trading_enabled: nextVal });
      fetchInstruments();
    } catch (err) {
      alert('Failed to toggle instrument status: ' + err.message);
    }
  };

  const handleDeclareHoliday = async (e) => {
    e.preventDefault();
    if (!holidayDate || !holidayDesc) return alert('Date and description are required');
    setSubmittingHoliday(true);
    try {
      await adminApi.updateCrmModule('market-holidays', 'new', {
        holiday_date: holidayDate,
        description: holidayDesc,
        exchange: holidayExchange
      });
      alert('Holiday declared successfully!');
      setHolidayDate('');
      setHolidayDesc('');
      setHolidayExchange('NSE');
      setShowAddHoliday(false);
      fetchHolidays();
    } catch (err) {
      alert('Failed to declare holiday: ' + err.message);
    } finally {
      setSubmittingHoliday(false);
    }
  };

  const handleRemoveHoliday = async (holidayId) => {
    if (!window.confirm('Are you sure you want to remove this holiday?')) return;
    try {
      await adminApi.deleteCrmModule('market-holidays', holidayId);
      alert('Holiday removed successfully!');
      fetchHolidays();
    } catch (err) {
      alert('Failed to remove holiday: ' + err.message);
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

  const filteredBreakers = instruments.filter(inst => {
    if (!breakerSearch) return true;
    const term = breakerSearch.toLowerCase();
    return inst.symbol.toLowerCase().includes(term) || inst.name.toLowerCase().includes(term);
  }).slice(0, 10);

  const openSessions = sessions.filter(s => s.status === 'open').length;

  // Group instruments by segment to show average margin/leverage rules dynamically
  const segmentsList = ['nse_equity', 'bse_equity', 'fo_futures', 'fo_options', 'mcx', 'forex', 'crypto'];
  const marginRules = segmentsList.map(seg => {
    const matching = instruments.filter(i => (i.segment || '').toLowerCase() === seg);
    const count = matching.length;
    
    let avgMargin = 20; 
    let avgLeverage = 5; 
    
    if (count > 0) {
      avgMargin = matching.reduce((sum, i) => sum + parseFloat(i.margin_required || 0), 0) / count;
      avgLeverage = matching.reduce((sum, i) => sum + parseFloat(i.max_leverage || 0), 0) / count;
    } else {
      if (seg === 'nse_equity') { avgMargin = 20; avgLeverage = 5; }
      else if (seg === 'bse_equity') { avgMargin = 20; avgLeverage = 5; }
      else if (seg === 'fo_futures') { avgMargin = 10; avgLeverage = 10; }
      else if (seg === 'fo_options') { avgMargin = 100; avgLeverage = 1; }
      else if (seg === 'mcx') { avgMargin = 5; avgLeverage = 20; }
      else if (seg === 'forex') { avgMargin = 2; avgLeverage = 50; }
      else if (seg === 'crypto') { avgMargin = 10; avgLeverage = 10; }
    }
    
    return {
      segment: seg.replace('_', ' ').toUpperCase(),
      leverage: `${Math.round(avgLeverage)}x`,
      marginReq: `${avgMargin.toFixed(1)}%`,
      status: count > 0 ? 'active' : 'inactive',
      count
    };
  });

  return (
    <div className="space-y-6">
      {killSwitchActive && (
        <div className="bg-red-600 text-white font-bold p-3 rounded-lg flex items-center gap-2 shadow-md animate-pulse">
          <AlertTriangle className="h-5 w-5" />
          <span>EMERGENCY TRADING HALT ACTIVE — GLOBAL KILL SWITCH HAS BEEN TRIGGERED. ALL PLACEMENTS ARE BLOCKED.</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Market Control Center</h1>
          <p className="text-sm text-gray-500 mt-1">Manage trading sessions, circuit breakers, margin rules, and market holidays.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleToggleKillSwitch} 
            className={`inline-flex items-center justify-center rounded-md text-sm font-bold h-10 px-4 py-2 border transition-all ${
              killSwitchActive 
                ? 'bg-green-50 text-green-700 hover:bg-green-100 border-green-200' 
                : 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200'
            }`}
          >
            <Pause className="h-4 w-4 mr-2" />
            {killSwitchActive ? 'Resume All Markets' : 'Halt All Markets'}
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
          <div className="text-xl font-black text-gray-900">
            {loadingSessions ? '...' : `${openSessions} / ${sessions.length}`}
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-green-500" />
            <span className="text-xs font-bold text-gray-500 uppercase">Trading Instruments</span>
          </div>
          <div className="text-xl font-black text-green-600">
            {loadingInstruments ? '...' : `${instruments.filter(i => i.trading_enabled).length} Enabled`}
          </div>
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
          <div className="text-xl font-black text-gray-900">
            {loadingHolidays ? '...' : holidays.length}
          </div>
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
            {loadingSessions ? (
              <div className="p-8 text-center text-gray-500">Loading market sessions...</div>
            ) : sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No market sessions defined.</div>
            ) : sessions.map((session) => (
              <div key={session.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${session.status === 'open' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                    <span className="text-sm font-bold text-gray-900 uppercase">{session.segment.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEditSession(session)} 
                      className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-100"
                      title="Edit timings"
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </button>
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

        {/* Instrument Controls (Circuit Breakers + Margins) */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Shield className="h-4 w-4 text-orange-600" />
              Instrument Controller
            </h2>
            <div className="relative w-full sm:max-w-xs">
              <input
                type="text"
                value={breakerSearch}
                onChange={(e) => setBreakerSearch(e.target.value)}
                placeholder="Search symbol (e.g., RELIANCE)..."
                className="w-full text-xs border border-gray-300 rounded px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              />
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm">
              <thead className="text-[10px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold">Symbol</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Circuits</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Margin / Lev</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                  <th className="px-4 py-2.5 text-center font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loadingInstruments ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">Loading instruments...</td>
                  </tr>
                ) : filteredBreakers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-4 py-8 text-center text-gray-500">No matching instruments found.</td>
                  </tr>
                ) : filteredBreakers.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900">{inst.symbol}</div>
                      <div className="text-[9px] text-gray-400 uppercase">{inst.segment?.replace('_', ' ')}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="text-[10px] font-bold text-green-600">+{inst.circuit_upper_pct || 10}%</div>
                      <div className="text-[10px] font-bold text-red-600">-{inst.circuit_lower_pct || 10}%</div>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">
                      <div className="text-xs font-bold text-gray-800">{inst.margin_required || 20}%</div>
                      <div className="text-[10px] text-blue-600 font-black">{inst.max_leverage || 5}x</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => handleToggleInstrumentStatus(inst)}>
                        {inst.trading_enabled ? (
                          <ToggleRight className="h-6 w-6 text-green-500 inline" />
                        ) : (
                          <ToggleLeft className="h-6 w-6 text-gray-300 inline" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button 
                        onClick={() => handleEditInstrument(inst)} 
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="Configure rules"
                      >
                        <Edit className="h-3.5 w-3.5" />
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
            Margin & Leverage Rules (Average Segment Summary)
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-6 py-3 font-semibold">Segment</th>
                <th className="px-6 py-3 font-semibold text-center">Leverage</th>
                <th className="px-6 py-3 font-semibold text-center">Margin Required</th>
                <th className="px-6 py-3 font-semibold text-center">Mapped Count</th>
                <th className="px-6 py-3 font-semibold text-center">Status</th>
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
                  <td className="px-6 py-3 text-center text-xs font-semibold text-gray-500">{rule.count} instruments</td>
                  <td className="px-6 py-3 text-center">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      rule.status === 'active' 
                        ? 'bg-green-100 text-green-700 border-green-200' 
                        : 'bg-gray-100 text-gray-500 border-gray-200'
                    }`}>
                      {rule.status}
                    </span>
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
          <button 
            onClick={() => setShowAddHoliday(true)} 
            className="text-xs text-blue-600 font-bold hover:text-blue-800"
          >
            + Declare Holiday
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {loadingHolidays ? (
            <div className="p-6 text-center text-gray-500">Loading holidays...</div>
          ) : holidays.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No holidays declared.</div>
          ) : holidays.map(h => (
            <div key={h.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-center min-w-[80px]">
                  <div className="text-[10px] font-bold text-red-600 uppercase">
                    {new Date(h.holiday_date).toLocaleString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-lg font-black text-red-700">
                    {new Date(h.holiday_date).getDate()}
                  </div>
                </div>
                <div>
                  <div className="font-bold text-sm text-gray-900">{h.description}</div>
                  <div className="text-xs text-gray-500">Affected Exchange: <span className="font-semibold text-gray-700">{h.exchange || 'ALL'}</span></div>
                </div>
              </div>
              <button 
                onClick={() => handleRemoveHoliday(h.id)} 
                className="text-red-500 hover:text-red-700 text-xs font-bold bg-red-50 px-3 py-1.5 rounded hover:bg-red-100 border border-red-200"
              >
                Remove
              </button>
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
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
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

      {/* Edit Session Timings Modal */}
      {showEditSession && selectedSession && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateSessionTimings} className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900 uppercase">Edit {selectedSession.segment.replace('_', ' ')} Session</h3>
              <button type="button" onClick={() => setShowEditSession(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Open Time (IST)</label>
                <input 
                  type="time" 
                  value={sessionStartTime} 
                  onChange={(e) => setSessionStartTime(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Close Time (IST)</label>
                <input 
                  type="time" 
                  value={sessionEndTime} 
                  onChange={(e) => setSessionEndTime(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowEditSession(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button 
                type="submit" 
                disabled={submittingSession}
                className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-bold shadow-sm disabled:opacity-50"
              >
                {submittingSession ? 'Saving...' : 'Save Timings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Instrument Limits Modal */}
      {showEditInstrument && selectedInstrument && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleUpdateInstrumentSettings} className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Configure {selectedInstrument.symbol}</h3>
              <button type="button" onClick={() => setShowEditInstrument(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Circuit Upper %</label>
                  <input 
                    type="number" 
                    value={instUpper} 
                    onChange={(e) => setInstUpper(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Circuit Lower %</label>
                  <input 
                    type="number" 
                    value={instLower} 
                    onChange={(e) => setInstLower(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Margin Required %</label>
                  <input 
                    type="number" 
                    value={instMargin} 
                    onChange={(e) => setInstMargin(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Max Leverage (x)</label>
                  <input 
                    type="number" 
                    value={instLeverage} 
                    onChange={(e) => setInstLeverage(e.target.value)}
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowEditInstrument(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button 
                type="submit" 
                disabled={submittingInstrument}
                className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-bold shadow-sm disabled:opacity-50"
              >
                {submittingInstrument ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Declare Holiday Modal */}
      {showAddHoliday && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleDeclareHoliday} className="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-4 border-b pb-2">
              <h3 className="text-lg font-bold text-gray-900">Declare Market Holiday</h3>
              <button type="button" onClick={() => setShowAddHoliday(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Holiday Date</label>
                <input 
                  type="date" 
                  value={holidayDate} 
                  onChange={(e) => setHolidayDate(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm text-gray-500 bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Description (Holiday Name)</label>
                <input 
                  type="text" 
                  placeholder="e.g. Diwali / Independence Day"
                  value={holidayDesc} 
                  onChange={(e) => setHolidayDesc(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Affected Exchange / segment</label>
                <select
                  value={holidayExchange}
                  onChange={(e) => setHolidayExchange(e.target.value)}
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white"
                >
                  <option value="NSE">NSE India Only</option>
                  <option value="MCX">MCX Commodities Only</option>
                  <option value="ALL">All Exchanges (Global Halt)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowAddHoliday(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button 
                type="submit" 
                disabled={submittingHoliday}
                className="px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-md text-sm font-bold shadow-sm disabled:opacity-50"
              >
                {submittingHoliday ? 'Declaring...' : 'Declare Holiday'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
