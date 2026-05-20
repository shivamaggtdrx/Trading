import React, { useState, useEffect } from 'react';
import { AlertTriangle, Maximize2, Minimize2, RefreshCw, TrendingUp, TrendingDown, Minus, Ban } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function ExposureHeatmap() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState('All Segments');
  const [selectedItem, setSelectedItem] = useState(null);
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchHeatmap = async () => {
    try {
      setLoading(true);
      const { heatmap } = await adminApi.getRiskHeatmap();
      
      const mappedData = (heatmap || []).map(d => {
        const pct = Math.abs(d.exposure) / 1000; // max limit assumed 100,000
        return {
          ...d,
          exposurePct: Math.min(Math.round(pct), 100),
          disabled: pct > 100,
          direction: d.exposure > 0 ? 'long' : d.exposure < 0 ? 'short' : '-',
          netQty: Math.round(d.exposure / 100) // approx qty
        };
      });

      setHeatmapData(mappedData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch exposure heatmap', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeatmap();
    // Auto-refresh every 10 seconds
    const interval = setInterval(fetchHeatmap, 10000);
    return () => clearInterval(interval);
  }, []);

  const segments = ['All Segments', ...new Set(heatmapData.map(d => d.segment))];

  const filteredData = heatmapData.filter(d => {
    if (segmentFilter === 'All Segments') return true;
    return d.segment === segmentFilter;
  });

  const getExposureColor = (pct, disabled) => {
    if (disabled) return 'bg-gray-400 text-white';
    if (pct > 90) return 'bg-red-500 text-white';
    if (pct > 75) return 'bg-red-400 text-white';
    if (pct > 60) return 'bg-orange-400 text-white';
    if (pct > 40) return 'bg-yellow-400 text-gray-900';
    if (pct > 20) return 'bg-green-400 text-gray-900';
    return 'bg-green-300 text-gray-900';
  };

  const getDirectionIcon = (direction) => {
    if (direction === 'long') return <TrendingUp className="w-3 h-3" />;
    if (direction === 'short') return <TrendingDown className="w-3 h-3" />;
    return <Minus className="w-3 h-3" />;
  };

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  const criticalItems = filteredData.filter(d => d.exposurePct > 90);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exposure Heatmap</h1>
          <p className="text-sm text-gray-500 mt-1">
            Live Redis exposure tracking — net positions across all symbols.
            {lastUpdated && (
              <span className="ml-2 text-gray-400">Updated {lastUpdated.toLocaleTimeString()}</span>
            )}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={fetchHeatmap}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button onClick={toggleFullScreen} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Segment:</span>
          <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)} className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {segments.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        <div className="h-6 w-px bg-gray-300" />
        <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
          <span className="font-medium">Legend:</span>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm" /> &gt; 90%</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-400 rounded-sm" /> 60–90%</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded-sm" /> 40–60%</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded-sm" /> &lt; 40%</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 bg-gray-400 rounded-sm" /> Disabled</div>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs text-gray-500">
          <span><span className="font-bold">{filteredData.length}</span> symbols tracked</span>
          <span><span className="font-bold text-green-600">{filteredData.filter(d => d.direction === 'long').length}</span> long</span>
          <span><span className="font-bold text-red-600">{filteredData.filter(d => d.direction === 'short').length}</span> short</span>
        </div>
      </div>

      {criticalItems.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-red-800">High Concentration Risk Detected</h3>
            <p className="text-sm text-red-700 mt-1">
              {criticalItems.map(d => d.symbol).join(', ')} exceed{criticalItems.length === 1 ? 's' : ''} 90% of internal risk limits. Consider disabling from Risk Management.
            </p>
          </div>
        </div>
      )}

      {loading && heatmapData.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 font-medium">Loading exposure data…</p>
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Minus className="w-6 h-6 text-gray-400" />
          </div>
          <p className="text-gray-700 font-bold">No exposure tracked yet</p>
          <p className="text-sm text-gray-400 mt-1">Exposure counters are updated in real-time as trades execute. Place some orders to see data here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredData.map((item) => (
            <div
              key={item.symbol}
              onClick={() => setSelectedItem(selectedItem?.symbol === item.symbol ? null : item)}
              className={`${getExposureColor(item.exposurePct, item.disabled)} p-4 rounded-xl shadow-sm flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer ${selectedItem?.symbol === item.symbol ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`}
              style={{ minHeight: `${Math.max(100, item.exposurePct * 1.5)}px` }}
            >
              <div className="flex items-start justify-between">
                <span className="font-bold opacity-90">{item.symbol}</span>
                <div className="flex items-center gap-1">
                  {item.disabled && <Ban className="w-3 h-3 opacity-80" />}
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-black/10 backdrop-blur-sm">{item.segment}</span>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center gap-1 text-sm opacity-80 font-medium mb-1">
                  {getDirectionIcon(item.direction)}
                  <span className="capitalize">{item.direction}</span>
                </div>
                <div className="text-2xl font-black">{item.netQty > 0 ? '+' : ''}{item.netQty}</div>
                <div className="text-xs font-bold mt-1 opacity-90">{item.exposurePct}% of limit</div>
                {item.disabled && <div className="text-xs font-bold mt-1 opacity-90 uppercase tracking-wide">⛔ Trading Disabled</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedItem && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-3">Exposure Details — {selectedItem.symbol}</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div><span className="text-gray-500">Segment:</span> <span className="font-bold">{selectedItem.segment}</span></div>
            <div><span className="text-gray-500">Net Qty:</span> <span className={`font-bold ${selectedItem.netQty > 0 ? 'text-green-600' : selectedItem.netQty < 0 ? 'text-red-600' : 'text-gray-500'}`}>{selectedItem.netQty > 0 ? '+' : ''}{selectedItem.netQty}</span></div>
            <div><span className="text-gray-500">Direction:</span> <span className="font-bold capitalize">{selectedItem.direction}</span></div>
            <div><span className="text-gray-500">Limit Used:</span> <span className={`font-bold ${selectedItem.exposurePct > 90 ? 'text-red-600' : 'text-gray-900'}`}>{selectedItem.exposurePct}%</span></div>
            <div><span className="text-gray-500">Status:</span> <span className={`font-bold ${selectedItem.disabled ? 'text-gray-500' : selectedItem.exposurePct > 90 ? 'text-red-600' : selectedItem.exposurePct > 75 ? 'text-orange-600' : 'text-green-600'}`}>{selectedItem.disabled ? 'DISABLED' : selectedItem.exposurePct > 90 ? 'CRITICAL' : selectedItem.exposurePct > 75 ? 'WARNING' : 'NORMAL'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
