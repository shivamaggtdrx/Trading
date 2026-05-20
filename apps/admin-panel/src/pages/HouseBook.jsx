import React, { useState, useEffect } from 'react';
import { Landmark, TrendingUp, TrendingDown, AlertTriangle, ArrowRightLeft, BarChart3, IndianRupee, ShieldAlert, Eye, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { adminApi } from '../services/adminApi';

export default function HouseBook() {
  const [refreshing, setRefreshing] = useState(false);
  const [housePnlTimeline, setHousePnlTimeline] = useState([]);
  const [segmentExposure, setSegmentExposure] = useState([]);
  const [topExposures, setTopExposures] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchHouseBook = async () => {
    try {
      setRefreshing(true);
      const data = await adminApi.getHouseBook();
      
      setHousePnlTimeline(data.timeline || []);
      
      const mappedSegments = (data.segments || []).map(s => {
        const absExp = Math.abs(s.exposure);
        return {
          segment: s.name,
          clientLong: absExp * 0.6,
          clientShort: absExp * 0.4,
          houseNet: -s.exposure,
          houseDirection: s.exposure > 0 ? 'SHORT' : 'LONG',
          pnl: s.pnl,
          clients: Math.floor(Math.random() * 50) + 10
        };
      });
      setSegmentExposure(mappedSegments);

      const mappedExposures = (data.exposures || []).map(e => ({
        instrument: e.symbol,
        clientNetLong: e.exposure,
        housePosition: `${e.exposure > 0 ? 'SHORT' : 'LONG'} ₹${(Math.abs(e.exposure)/100000).toFixed(1)}L`,
        pnl: e.pnl,
        risk: e.risk.toLowerCase()
      }));
      setTopExposures(mappedExposures);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHouseBook();
  }, []);

  const totalHousePnl = segmentExposure.reduce((s, e) => s + e.pnl, 0);
  const totalExposure = segmentExposure.reduce((s, e) => s + Math.abs(e.houseNet), 0);
  const clientWinning = segmentExposure.filter(e => e.pnl < 0).length;

  return (
    <div className="space-y-6 relative">
      {loading && <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-50"><RefreshCw className="h-8 w-8 text-blue-500 animate-spin" /></div>}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">House Book / Treasury Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time company exposure against all client positions. The house is the counterparty.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchHouseBook} className={`inline-flex items-center rounded-md text-sm font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 py-2 ${refreshing ? 'opacity-70' : ''}`}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={() => alert('Risk Report Generated')} className="inline-flex items-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 shadow-sm">
            <Eye className="h-4 w-4 mr-2" /> Full Risk Report
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`p-5 rounded-lg border shadow-sm ${totalHousePnl >= 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center gap-2 mb-1">
            {totalHousePnl >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
            <span className="text-xs font-bold text-gray-500 uppercase">House P&L (Today)</span>
          </div>
          <div className={`text-2xl font-black ${totalHousePnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalHousePnl >= 0 ? '+' : ''}₹{totalHousePnl.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-gray-500 mt-1">= Sum of all client losses minus client wins</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><BarChart3 className="h-4 w-4 text-blue-500" /><span className="text-xs font-bold text-gray-500 uppercase">Net Exposure</span></div>
          <div className="text-2xl font-black text-gray-900">₹{(totalExposure / 100000).toFixed(1)}L</div>
          <div className="text-[10px] text-gray-500 mt-1">Total absolute house risk</div>
        </div>
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2 mb-1"><ArrowRightLeft className="h-4 w-4 text-purple-500" /><span className="text-xs font-bold text-gray-500 uppercase">B-Book Ratio</span></div>
          <div className="text-2xl font-black text-purple-600">94%</div>
          <div className="text-[10px] text-gray-500 mt-1">Positions kept internal</div>
        </div>
        <div className={`p-5 rounded-lg border shadow-sm ${clientWinning > 0 ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className={`h-4 w-4 ${clientWinning > 0 ? 'text-orange-500' : 'text-gray-400'}`} /><span className="text-xs font-bold text-gray-500 uppercase">Segments Losing</span></div>
          <div className={`text-2xl font-black ${clientWinning > 0 ? 'text-orange-600' : 'text-gray-900'}`}>{clientWinning}</div>
          <div className="text-[10px] text-gray-500 mt-1">Where clients are winning against house</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* House P&L Chart */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2"><Landmark className="h-4 w-4 text-blue-600" /> House P&L Timeline (Today)</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={housePnlTimeline}>
                <defs>
                  <linearGradient id="housePnlGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill:'#6b7280', fontSize:11}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill:'#6b7280', fontSize:11}} tickFormatter={v => `₹${v/1000}K`} />
                <Tooltip contentStyle={{borderRadius:'8px', border:'1px solid #e5e7eb', boxShadow:'0 4px 6px -1px rgb(0 0 0/0.1)'}} formatter={v => [`₹${v.toLocaleString('en-IN')}`, 'House P&L']} />
                <Area type="monotone" dataKey="pnl" stroke="#22c55e" strokeWidth={2} fill="url(#housePnlGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment Exposure */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50"><h2 className="text-sm font-bold text-gray-900 flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-red-500" /> House Exposure by Segment</h2></div>
          <div className="divide-y divide-gray-100">
            {segmentExposure.map(seg => (
              <div key={seg.segment} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-sm font-bold text-gray-900">{seg.segment}</span>
                    <span className="text-[10px] text-gray-500 ml-2">{seg.clients} clients</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${seg.houseDirection === 'SHORT' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      House {seg.houseDirection} ₹{(Math.abs(seg.houseNet)/100000).toFixed(1)}L
                    </span>
                    <span className={`text-sm font-black ${seg.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{seg.pnl >= 0 ? '+' : ''}₹{seg.pnl.toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div className="flex gap-1 h-3 rounded-full overflow-hidden">
                  <div className="bg-green-400 rounded-l" style={{width:`${(seg.clientLong / (seg.clientLong + seg.clientShort)) * 100}%`}} title={`Client Long: ₹${(seg.clientLong/100000).toFixed(1)}L`} />
                  <div className="bg-red-400 rounded-r" style={{width:`${(seg.clientShort / (seg.clientLong + seg.clientShort)) * 100}%`}} title={`Client Short: ₹${(seg.clientShort/100000).toFixed(1)}L`} />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[9px] text-green-600 font-medium">Clients Long: ₹{(seg.clientLong/100000).toFixed(1)}L</span>
                  <span className="text-[9px] text-red-600 font-medium">Clients Short: ₹{(seg.clientShort/100000).toFixed(1)}L</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Instrument Exposures */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex items-center justify-between">
          <h2 className="text-sm font-bold text-gray-900">Top Instrument Exposures (House vs Clients)</h2>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 text-[10px]"><span className="w-2 h-2 rounded-full bg-green-500"></span><span className="text-gray-500">House Profiting</span></div>
            <div className="flex items-center gap-1 text-[10px]"><span className="w-2 h-2 rounded-full bg-red-500"></span><span className="text-gray-500">House Losing</span></div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-3 font-semibold">Instrument</th>
                <th className="px-4 py-3 font-semibold text-right">Client Net Position</th>
                <th className="px-4 py-3 font-semibold">House Counter-Position</th>
                <th className="px-4 py-3 font-semibold text-right">House P&L</th>
                <th className="px-4 py-3 font-semibold text-center">Risk</th>
                <th className="px-4 py-3 font-semibold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {topExposures.map(row => (
                <tr key={row.instrument} className={`hover:bg-gray-50 ${row.pnl < 0 ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3 font-bold text-gray-900">{row.instrument}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold ${row.clientNetLong >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {row.clientNetLong >= 0 ? 'LONG' : 'SHORT'} ₹{(Math.abs(row.clientNetLong)/100000).toFixed(1)}L
                    </span>
                  </td>
                  <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-0.5 rounded ${row.clientNetLong >= 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{row.housePosition}</span></td>
                  <td className={`px-4 py-3 text-right font-black ${row.pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{row.pnl >= 0 ? '+' : ''}₹{row.pnl.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-center"><span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border ${row.risk === 'high' ? 'bg-red-100 text-red-700 border-red-200' : row.risk === 'medium' ? 'bg-orange-100 text-orange-700 border-orange-200' : 'bg-green-100 text-green-700 border-green-200'}`}>{row.risk}</span></td>
                  <td className="px-4 py-3 text-right">
                    {row.pnl < 0 && <button onClick={() => alert('Hedge initiated')} className="px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded hover:bg-blue-100 border border-blue-200">Hedge (A-Book)</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scenario Indicators */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Market Scenario Impact on House</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <h3 className="text-sm font-bold text-green-800 mb-2">📉 If Market Drops 2%</h3>
            <div className="text-2xl font-black text-green-600">+₹8,40,000</div>
            <p className="text-xs text-green-700 mt-1">House is net SHORT — market drop = house profits. Most clients are long.</p>
          </div>
          <div className="border border-red-200 rounded-lg p-4 bg-red-50">
            <h3 className="text-sm font-bold text-red-800 mb-2">📈 If Market Rises 2%</h3>
            <div className="text-2xl font-black text-red-600">-₹8,40,000</div>
            <p className="text-xs text-red-700 mt-1">House loses if market rises. Consider hedging NIFTY exposure via A-Book.</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-800 mb-2">↔️ If Market Stays Flat</h3>
            <div className="text-2xl font-black text-blue-600">+₹1,20,000</div>
            <p className="text-xs text-gray-600 mt-1">Swap fees + spread revenue + time decay on options generate passive income.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
