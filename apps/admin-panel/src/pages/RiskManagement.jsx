import { useState, useEffect } from 'react';
import { ShieldAlert, TrendingUp, TrendingDown, AlertTriangle, Users, BarChart3, Eye, Ban, RefreshCw, ChevronDown } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function RiskManagement() {
  const [selectedRiskFilter, setSelectedRiskFilter] = useState('all');
  const [showForceClose, setShowForceClose] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  
  const [exposureData, setExposureData] = useState([]);
  const [segmentExposure, setSegmentExposure] = useState([]);
  const [riskAlerts, setRiskAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRiskData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getRiskManagement();
      setExposureData(data.exposureData || []);
      setSegmentExposure(data.segmentExposure || []);
      setRiskAlerts(data.riskAlerts || []);
    } catch (err) {
      console.error('Failed to fetch risk data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  const filteredExposure = selectedRiskFilter === 'all' 
    ? exposureData 
    : exposureData.filter(e => e.riskLevel === selectedRiskFilter);

  const totalExposure = exposureData.reduce((s, e) => s + e.exposure, 0);
  const totalUnrealized = exposureData.reduce((s, e) => s + e.unrealizedPnl, 0);
  const criticalCount = exposureData.filter(e => e.riskLevel === 'critical').length;

  const getRiskColor = (level) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200',
    };
    return colors[level] || colors.low;
  };

  const getUsageColor = (usage) => {
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-orange-500';
    if (usage >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Risk Management</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time exposure monitoring, margin alerts, and position risk controls.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => alert('Action triggered. Backend integration pending.')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200 h-10 px-4 py-2">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Force Margin Check
          </button>
          <button onClick={() => alert('Action triggered. Backend integration pending.')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-red-600 text-white hover:bg-red-700 h-10 px-4 py-2 shadow-sm">
            <Ban className="h-4 w-4 mr-2" />
            Freeze All New Orders
          </button>
        </div>
      </div>

      {/* Risk Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="h-4 w-4 text-blue-500" />
            <span className="text-xs font-bold text-gray-500 uppercase">Total Exposure</span>
          </div>
          <div className="text-xl font-black text-gray-900">₹{(totalExposure / 100000).toFixed(1)}L</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            {totalUnrealized >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            <span className="text-xs font-bold text-gray-500 uppercase">Unrealized P&L</span>
          </div>
          <div className={`text-xl font-black ${totalUnrealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {totalUnrealized >= 0 ? '+' : ''}₹{totalUnrealized.toLocaleString('en-IN')}
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Users className="h-4 w-4 text-purple-500" />
            <span className="text-xs font-bold text-gray-500 uppercase">Active Traders</span>
          </div>
          <div className="text-xl font-black text-gray-900">{exposureData.length}</div>
        </div>
        <div className={`p-5 rounded-lg border shadow-sm ${criticalCount > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className={`h-4 w-4 ${criticalCount > 0 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
            <span className="text-xs font-bold text-gray-500 uppercase">Critical Risk</span>
          </div>
          <div className={`text-xl font-black ${criticalCount > 0 ? 'text-red-600' : 'text-gray-900'}`}>{criticalCount}</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-xs font-bold text-gray-500 uppercase">Risk Alerts</span>
          </div>
          <div className="text-xl font-black text-orange-600">{riskAlerts.length}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exposure by Segment */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900">Exposure by Segment</h2>
          </div>
          <div className="p-4 space-y-4">
            {segmentExposure.map(seg => (
              <div key={seg.segment}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-gray-700">{seg.segment}</span>
                  <span className="text-xs font-bold text-gray-500">{seg.clients} clients</span>
                </div>
                <div className="flex gap-1 h-5">
                  <div className="bg-green-400 rounded-l" style={{ width: `${(seg.long / (seg.long + seg.short)) * 100}%` }} title={`Long: ₹${(seg.long/100000).toFixed(0)}L`} />
                  <div className="bg-red-400 rounded-r" style={{ width: `${(seg.short / (seg.long + seg.short)) * 100}%` }} title={`Short: ₹${(seg.short/100000).toFixed(0)}L`} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-green-600 font-medium">Long: ₹{(seg.long/100000).toFixed(0)}L</span>
                  <span className={`text-[10px] font-bold ${seg.net >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    Net: {seg.net >= 0 ? '+' : ''}₹{(seg.net/100000).toFixed(1)}L
                  </span>
                  <span className="text-[10px] text-red-600 font-medium">Short: ₹{(seg.short/100000).toFixed(0)}L</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Risk Alerts */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Live Risk Alerts
            </h2>
            <button onClick={fetchRiskData} className="text-xs text-blue-600 font-bold hover:text-blue-800 flex items-center gap-1">
              <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
          </div>
          <div className="divide-y divide-gray-100">
            {loading ? (
               <div className="p-8 text-center text-gray-500">Loading alerts...</div>
            ) : riskAlerts.length === 0 ? (
               <div className="p-8 text-center text-gray-500">No active risk alerts.</div>
            ) : riskAlerts.map(alert => (
              <div key={alert.id} className="p-4 hover:bg-gray-50 flex items-start gap-3">
                <div className={`mt-0.5 p-1.5 rounded ${
                  alert.severity === 'critical' ? 'bg-red-100 text-red-600' :
                  alert.severity === 'high' ? 'bg-orange-100 text-orange-600' :
                  'bg-yellow-100 text-yellow-600'
                }`}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{alert.type}</span>
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${getRiskColor(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{alert.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-blue-600 font-bold">{alert.client}</span>
                    <span className="text-[10px] text-gray-400">{alert.time}</span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => alert('Action triggered. Backend integration pending.')} className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded hover:bg-blue-100 border border-blue-200">View</button>
                  <button onClick={() => alert('Action triggered. Backend integration pending.')} className="px-2 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded hover:bg-red-100 border border-red-200">Action</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Client Exposure Table */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="text-sm font-bold text-gray-900">Client Exposure Monitor</h2>
          <div className="flex gap-2">
            {['all', 'critical', 'high', 'medium', 'low'].map(f => (
              <button key={f} onClick={() => setSelectedRiskFilter(f)}
                className={`px-3 py-1 text-[10px] font-bold rounded-md capitalize transition-colors ${
                  selectedRiskFilter === f ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Client</th>
                <th className="px-4 py-3 font-semibold text-right">Exposure (₹)</th>
                <th className="px-4 py-3 font-semibold text-right">Margin (₹)</th>
                <th className="px-4 py-3 font-semibold text-center">Usage</th>
                <th className="px-4 py-3 font-semibold text-center">Positions</th>
                <th className="px-4 py-3 font-semibold text-right">Unrealized P&L</th>
                <th className="px-4 py-3 font-semibold text-center">Risk</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredExposure.map(row => (
                <tr key={row.client} className={`hover:bg-gray-50 ${row.riskLevel === 'critical' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900">{row.client}</div>
                    <div className="text-[10px] text-gray-500">{row.name}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">₹{row.exposure.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-600">₹{row.margin.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${getUsageColor(row.usage)}`} style={{ width: `${row.usage}%` }} />
                      </div>
                      <span className={`text-xs font-bold ${row.usage >= 90 ? 'text-red-600' : row.usage >= 75 ? 'text-orange-600' : 'text-gray-600'}`}>
                        {row.usage}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-700">{row.positions}</td>
                  <td className={`px-4 py-3 text-right font-bold ${row.unrealizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {row.unrealizedPnl >= 0 ? '+' : ''}₹{row.unrealizedPnl.toLocaleString('en-IN')}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${getRiskColor(row.riskLevel)}`}>
                      {row.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => alert('Action triggered. Backend integration pending.')} className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors" title="View Details">
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button className="p-1.5 rounded hover:bg-red-50 text-red-500 transition-colors" title="Force Liquidate"
                        onClick={() => { setSelectedClient(row); setShowForceClose(true); }}>
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Position Limit Rules */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Position Limit Rules</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Per-Client Limits</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Max Open Positions</label>
                <input type="number" defaultValue={50} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Max Exposure (₹)</label>
                <input type="number" defaultValue={10000000} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Max Daily Loss (₹)</label>
                <input type="number" defaultValue={500000} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm font-medium" />
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Per-Instrument Limits</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Max Qty per Order</label>
                <input type="number" defaultValue={5000} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Max Client Concentration (%)</label>
                <input type="number" defaultValue={80} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm font-medium" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">Circuit Breaker Trigger (%)</label>
                <input type="number" defaultValue={10} className="w-full px-3 py-1.5 border border-gray-300 rounded text-sm font-medium" />
              </div>
            </div>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Auto-Actions</h3>
            <div className="space-y-3">
              {[
                { label: 'Auto-liquidate at stop-out', defaultChecked: true },
                { label: 'Block new orders at 90% margin', defaultChecked: true },
                { label: 'Send margin call email at 80%', defaultChecked: true },
                { label: 'Alert admin at 85% margin', defaultChecked: true },
                { label: 'Daily loss limit auto-block', defaultChecked: false },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700">{item.label}</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked={item.defaultChecked} className="sr-only peer" />
                    <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Force Close Modal */}
      {showForceClose && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">⚠️ Force Liquidate All Positions</h3>
            <p className="text-sm text-gray-600 mb-4">
              This will immediately close <strong>all {selectedClient.positions} open positions</strong> for client <strong>{selectedClient.client}</strong> at market price.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-red-700 font-medium">
                <strong>Exposure:</strong> ₹{selectedClient.exposure.toLocaleString('en-IN')} | 
                <strong> Unrealized P&L:</strong> ₹{selectedClient.unrealizedPnl.toLocaleString('en-IN')} | 
                <strong> Margin Usage:</strong> {selectedClient.usage}%
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-xs font-bold text-gray-700 mb-1">Reason (Required)</label>
              <textarea rows={2} placeholder="Enter reason for force liquidation..." className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-red-500" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowForceClose(false)} className="flex-1 py-2 rounded-lg border border-gray-300 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => setShowForceClose(false)} className="flex-1 py-2 rounded-lg bg-red-600 text-sm font-bold text-white hover:bg-red-700 shadow-sm">Force Liquidate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
