import React, { useState } from 'react';
import { Search, Filter, AlertTriangle, Maximize2, Minimize2 } from 'lucide-react';

export default function ExposureHeatmap() {
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [segmentFilter, setSegmentFilter] = useState('All Segments');
  const [selectedItem, setSelectedItem] = useState(null);

  const heatmapData = [
    { symbol: 'NIFTY', exposure: 85, value: '₹4.5Cr', type: 'Index' },
    { symbol: 'BANKNIFTY', exposure: 92, value: '₹8.2Cr', type: 'Index' },
    { symbol: 'FINNIFTY', exposure: 45, value: '₹1.2Cr', type: 'Index' },
    { symbol: 'MIDCPNIFTY', exposure: 20, value: '₹45L', type: 'Index' },
    { symbol: 'RELIANCE', exposure: 78, value: '₹2.8Cr', type: 'Equity' },
    { symbol: 'HDFCBANK', exposure: 65, value: '₹1.8Cr', type: 'Equity' },
    { symbol: 'INFY', exposure: 30, value: '₹85L', type: 'Equity' },
    { symbol: 'TCS', exposure: 15, value: '₹40L', type: 'Equity' },
    { symbol: 'CRUDEOIL', exposure: 88, value: '₹3.5Cr', type: 'Commodity' },
    { symbol: 'GOLD', exposure: 55, value: '₹1.5Cr', type: 'Commodity' },
    { symbol: 'SILVER', exposure: 40, value: '₹95L', type: 'Commodity' },
    { symbol: 'NATURALGAS', exposure: 95, value: '₹5.2Cr', type: 'Commodity' },
  ];

  const filteredData = heatmapData.filter(d => {
    if (segmentFilter === 'All Segments') return true;
    if (segmentFilter === 'Index Options') return d.type === 'Index';
    if (segmentFilter === 'Equity Options') return d.type === 'Equity';
    if (segmentFilter === 'MCX (Commodity)') return d.type === 'Commodity';
    return true;
  });

  const getExposureColor = (exposure) => {
    if (exposure > 90) return 'bg-red-500 text-white';
    if (exposure > 75) return 'bg-red-400 text-white';
    if (exposure > 60) return 'bg-orange-400 text-white';
    if (exposure > 40) return 'bg-yellow-400 text-gray-900';
    if (exposure > 20) return 'bg-green-400 text-gray-900';
    return 'bg-green-300 text-gray-900';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exposure Heatmap</h1>
          <p className="text-sm text-gray-500 mt-1">Visual heatmap showing platform-wide exposure by scrip/segment to identify concentration risk.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={toggleFullScreen} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            {isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
         <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Filter by Segment:</span>
            <select value={segmentFilter} onChange={(e) => setSegmentFilter(e.target.value)} className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Segments</option>
              <option>Index Options</option>
              <option>Equity Options</option>
              <option>MCX (Commodity)</option>
            </select>
         </div>
         <div className="h-6 w-px bg-gray-300"></div>
         <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Legend:</span>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-red-500 rounded-sm"></div> &gt; 90%</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-400 rounded-sm"></div> 60-90%</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-yellow-400 rounded-sm"></div> 40-60%</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-400 rounded-sm"></div> &lt; 40%</div>
         </div>
      </div>

      {filteredData.filter(d => d.exposure > 90).length > 0 && (
         <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
           <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
           <div>
              <h3 className="text-sm font-bold text-red-800">High Concentration Risk Detected</h3>
              <p className="text-sm text-red-700 mt-1">
                {filteredData.filter(d => d.exposure > 90).map(d => d.symbol).join(', ')} exceed{filteredData.filter(d => d.exposure > 90).length === 1 ? 's' : ''} 90% of internal risk limits.
              </p>
           </div>
         </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
         {filteredData.sort((a, b) => b.exposure - a.exposure).map((item) => (
            <div 
               key={item.symbol} 
               onClick={() => setSelectedItem(selectedItem?.symbol === item.symbol ? null : item)}
               className={`${getExposureColor(item.exposure)} p-4 rounded-xl shadow-sm flex flex-col justify-between transition-all hover:scale-[1.02] cursor-pointer ${selectedItem?.symbol === item.symbol ? 'ring-2 ring-offset-2 ring-gray-800' : ''}`}
               style={{ minHeight: `${Math.max(100, item.exposure * 1.5)}px` }}
            >
               <div className="flex items-start justify-between">
                  <span className="font-bold opacity-90">{item.symbol}</span>
                  <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-black/10 backdrop-blur-sm">{item.type}</span>
               </div>
               <div className="mt-4">
                  <div className="text-sm opacity-80 font-medium">Net Exposure</div>
                  <div className="text-2xl font-black">{item.value}</div>
                  <div className="text-xs font-bold mt-1 opacity-90">{item.exposure}% of limit</div>
               </div>
            </div>
         ))}
      </div>

      {selectedItem && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-3">Exposure Details — {selectedItem.symbol}</h3>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">Type:</span> <span className="font-bold">{selectedItem.type}</span></div>
            <div><span className="text-gray-500">Net Exposure:</span> <span className="font-bold">{selectedItem.value}</span></div>
            <div><span className="text-gray-500">Limit Used:</span> <span className={`font-bold ${selectedItem.exposure > 90 ? 'text-red-600' : 'text-gray-900'}`}>{selectedItem.exposure}%</span></div>
            <div><span className="text-gray-500">Status:</span> <span className={`font-bold ${selectedItem.exposure > 90 ? 'text-red-600' : selectedItem.exposure > 75 ? 'text-orange-600' : 'text-green-600'}`}>{selectedItem.exposure > 90 ? 'CRITICAL' : selectedItem.exposure > 75 ? 'WARNING' : 'NORMAL'}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
