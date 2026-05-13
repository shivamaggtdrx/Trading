import { useState, useEffect } from 'react';
import { ShieldAlert, TrendingUp, Ban, AlertTriangle, Settings, Save, Users, IndianRupee, Lock, Unlock } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function ProfitCeiling() {
  const [globalConfig, setGlobalConfig] = useState({ enabled: true, defaultDailyCap: 50000, defaultWeeklyCap: 200000, warningThreshold: 80, autoSquareOffThreshold: 95, blockNewOrdersAtCap: true, showRealReason: false, clientMessage: 'Trading temporarily paused due to market risk conditions.' });
  const [editingGlobal, setEditingGlobal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  
  const [clientCeilings, setClientCeilings] = useState([]);
  const [triggerLog, setTriggerLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCeilingData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getProfitCeiling();
      setClientCeilings(data.clientCeilings || []);
      setTriggerLog(data.triggerLog || []);
      if (data.globalConfig) setGlobalConfig(data.globalConfig);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCeilingData();
  }, []);

  const breachedCount = clientCeilings.filter(c => c.status === 'breached').length;
  const approachingCount = clientCeilings.filter(c => c.status === 'approaching').length;
  const totalProtected = clientCeilings.reduce((s, c) => s + Math.max(0, c.todayPnl), 0);

  const getStatusStyle = (s) => ({ breached: 'bg-red-100 text-red-700 border-red-200', approaching: 'bg-orange-100 text-orange-700 border-orange-200', normal: 'bg-blue-100 text-blue-700 border-blue-200', losing: 'bg-green-100 text-green-700 border-green-200' }[s] || 'bg-gray-100 text-gray-600 border-gray-200');
  const getProgressColor = (p) => p >= 95 ? 'bg-red-500' : p >= 80 ? 'bg-orange-500' : p >= 50 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profit Ceiling System</h1>
          <p className="text-sm text-gray-500 mt-1">Auto-cap daily & weekly client profits. Protect house revenue from consistent winners.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditingGlobal(!editingGlobal)} className="inline-flex items-center rounded-md text-sm font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 py-2"><Settings className="h-4 w-4 mr-2" /> Global Config</button>
          <button onClick={() => console.log('Action triggered')} className={`inline-flex items-center rounded-md text-sm font-bold h-10 px-4 py-2 shadow-sm ${globalConfig.enabled ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-green-600 text-white hover:bg-green-700'}`}>
            {globalConfig.enabled ? <><Lock className="h-4 w-4 mr-2" /> Active</> : <><Unlock className="h-4 w-4 mr-2" /> Disabled</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className={`p-5 rounded-lg border shadow-sm ${breachedCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-1"><Ban className={`h-4 w-4 ${breachedCount > 0 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} /><span className="text-xs font-bold text-gray-500 uppercase">Breached</span></div>
          <div className={`text-xl font-black ${breachedCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{breachedCount}</div>
        </div>
        <div className={`p-5 rounded-lg border shadow-sm ${approachingCount > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-orange-500" /><span className="text-xs font-bold text-gray-500 uppercase">Approaching</span></div>
          <div className="text-xl font-black text-orange-600">{approachingCount}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-blue-500" /><span className="text-xs font-bold text-gray-500 uppercase">Monitored</span></div>
          <div className="text-xl font-black text-gray-900">{clientCeilings.length}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><IndianRupee className="h-4 w-4 text-green-500" /><span className="text-xs font-bold text-gray-500 uppercase">Protected</span></div>
          <div className="text-xl font-black text-green-600">₹{totalProtected.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-purple-500" /><span className="text-xs font-bold text-gray-500 uppercase">Default Cap</span></div>
          <div className="text-xl font-black text-gray-900">₹{globalConfig.defaultDailyCap.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {editingGlobal && (
        <div className="bg-white rounded-lg border border-blue-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Settings className="h-5 w-5 text-blue-600" /> Global Configuration</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div><label className="block text-sm font-bold text-gray-700 mb-1">Default Daily Cap (₹)</label><input type="number" value={globalConfig.defaultDailyCap} onChange={e => setGlobalConfig(p => ({...p, defaultDailyCap: +e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded font-medium" /><p className="text-[10px] text-gray-500 mt-1">Max profit per day</p></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">Default Weekly Cap (₹)</label><input type="number" value={globalConfig.defaultWeeklyCap} onChange={e => setGlobalConfig(p => ({...p, defaultWeeklyCap: +e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded font-medium" /><p className="text-[10px] text-gray-500 mt-1">Max profit per week</p></div>
            <div><label className="block text-sm font-bold text-gray-700 mb-1">Auto Square-Off At (%)</label><input type="number" value={globalConfig.autoSquareOffThreshold} onChange={e => setGlobalConfig(p => ({...p, autoSquareOffThreshold: +e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded font-medium" /><p className="text-[10px] text-gray-500 mt-1">Auto-close positions at this %</p></div>
            <div className="md:col-span-2"><label className="block text-sm font-bold text-gray-700 mb-1">Client-Facing Message (Disguised)</label><input type="text" value={globalConfig.clientMessage} onChange={e => setGlobalConfig(p => ({...p, clientMessage: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded font-medium text-sm" /><p className="text-[10px] text-gray-500 mt-1">Message shown to client when cap is hit</p></div>
            <div className="space-y-3 pt-1">
              {[{k:'blockNewOrdersAtCap',l:'Block orders at cap'},{k:'showRealReason',l:'Show real reason'}].map(i => (
                <div key={i.k} className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">{i.l}</span>
                  <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" checked={globalConfig[i.k]} onChange={() => setGlobalConfig(p => ({...p, [i.k]: !p[i.k]}))} className="sr-only peer" /><div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div></label>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end mt-6"><button onClick={() => { setEditingGlobal(false); alert('Saved.'); }} className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-md text-sm font-bold hover:bg-blue-700 shadow-sm"><Save className="h-4 w-4 mr-2" /> Save</button></div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Live Profit Ceiling Monitor</h2>
          <button onClick={() => console.log('Action triggered')} className="text-xs text-blue-600 font-bold hover:text-blue-800">+ Override Client</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr><th className="px-4 py-3 font-semibold">Client</th><th className="px-4 py-3 font-semibold text-center">Tier</th><th className="px-4 py-3 font-semibold text-right">Daily Cap</th><th className="px-4 py-3 font-semibold text-center">Today vs Cap</th><th className="px-4 py-3 font-semibold text-right">Weekly Cap</th><th className="px-4 py-3 font-semibold text-center">Week vs Cap</th><th className="px-4 py-3 font-semibold text-center">Status</th><th className="px-4 py-3 font-semibold text-center">Auto S/O</th><th className="px-4 py-3 text-right font-semibold">Actions</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                <tr><td colSpan="9" className="py-8 text-center text-gray-500">Loading profit ceilings...</td></tr>
              ) : clientCeilings.map(row => {
                const dp = row.todayPnl > 0 ? Math.min(100, (row.todayPnl / row.dailyCap) * 100) : 0;
                const wp = row.weekPnl > 0 ? Math.min(100, (row.weekPnl / row.weeklyCap) * 100) : 0;
                return (
                  <tr key={row.id} className={`hover:bg-gray-50 ${row.status === 'breached' ? 'bg-red-50/40' : row.status === 'approaching' ? 'bg-orange-50/30' : ''}`}>
                    <td className="px-4 py-3"><div className="font-bold text-gray-900">{row.client}</div><div className="text-[10px] text-gray-500">{row.name}</div></td>
                    <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${row.tier === 'Profitable' ? 'bg-red-100 text-red-700' : row.tier === 'Whale' ? 'bg-blue-100 text-blue-700' : row.tier === 'Regular' ? 'bg-gray-100 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>{row.tier}</span></td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">₹{row.dailyCap.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${getProgressColor(dp)}`} style={{width:`${dp}%`}} /></div><span className={`text-xs font-bold ${row.todayPnl >= 0 ? (dp >= 80 ? 'text-red-600' : 'text-green-600') : 'text-gray-500'}`}>{row.todayPnl >= 0 ? '+' : ''}₹{row.todayPnl.toLocaleString('en-IN')}</span></div></td>
                    <td className="px-4 py-3 text-right font-medium text-gray-600">₹{row.weeklyCap.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${getProgressColor(wp)}`} style={{width:`${wp}%`}} /></div><span className={`text-xs font-bold ${row.weekPnl >= 0 ? (wp >= 80 ? 'text-red-600' : 'text-green-600') : 'text-gray-500'}`}>{row.weekPnl >= 0 ? '+' : ''}₹{row.weekPnl.toLocaleString('en-IN')}</span></div></td>
                    <td className="px-4 py-3 text-center"><span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusStyle(row.status)}`}>{row.status}</span></td>
                    <td className="px-4 py-3 text-center">{row.autoSquareOff ? <span className="text-green-600 text-xs font-bold">ON</span> : <span className="text-gray-400 text-xs font-bold">OFF</span>}</td>
                    <td className="px-4 py-3 text-right"><div className="flex justify-end gap-1"><button onClick={() => { setSelectedClient(row); setShowOverrideModal(true); }} className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded hover:bg-blue-100 border border-blue-200">Edit</button>{row.status !== 'losing' && <button onClick={() => alert('Action triggered.')} className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded hover:bg-red-100 border border-red-200">S/O</button>}</div></td>
                  </tr>);
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50"><h2 className="text-sm font-bold text-gray-900">Today's Ceiling Triggers</h2></div>
        <div className="divide-y divide-gray-100">
          {triggerLog.map(l => (
            <div key={l.id} className="px-4 py-3 hover:bg-gray-50">
              <div className="flex items-center gap-3"><span className="text-xs font-mono text-gray-400">{l.time}</span><span className="text-xs font-bold text-blue-600">{l.client}</span><span className={`text-[10px] font-bold px-2 py-0.5 rounded ${l.action === 'Auto Square-Off' ? 'bg-red-100 text-red-700' : l.action === 'Warning Alert' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'}`}>{l.action}</span></div>
              <p className="text-xs text-gray-600 mt-1 ml-[72px]">{l.reason}</p>
              <p className="text-[10px] text-gray-400 mt-0.5 ml-[72px]">→ {l.result}</p>
            </div>
          ))}
        </div>
      </div>

      {showOverrideModal && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Override — {selectedClient.client}</h3>
            <div className="space-y-4">
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Daily Cap (₹)</label><input type="number" defaultValue={selectedClient.dailyCap} className="w-full px-3 py-2 border border-gray-300 rounded font-medium" /></div>
              <div><label className="block text-sm font-bold text-gray-700 mb-1">Weekly Cap (₹)</label><input type="number" defaultValue={selectedClient.weeklyCap} className="w-full px-3 py-2 border border-gray-300 rounded font-medium" /></div>
              <div className="flex items-center justify-between"><span className="text-sm font-medium text-gray-700">Auto Square-Off</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" defaultChecked={selectedClient.autoSquareOff} className="sr-only peer" /><div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div></label></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowOverrideModal(false)} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { setShowOverrideModal(false); alert('Saved.'); }} className="flex-1 py-2 rounded-lg bg-blue-600 text-sm font-bold text-white hover:bg-blue-700 shadow-sm">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
