import React, { useState, useEffect } from 'react';
import { Activity, TrendingUp, TrendingDown, Clock, Globe, ArrowRight } from 'lucide-react';

export default function LiveMarket() {
  const [marketStatus, setMarketStatus] = useState('Open');
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const indices = [
    { name: 'NIFTY 50', value: '19,542.65', change: '+124.50', pct: '+0.64%', up: true },
    { name: 'BANKNIFTY', value: '44,231.10', change: '+310.20', pct: '+0.71%', up: true },
    { name: 'SENSEX', value: '65,821.40', change: '-45.10', pct: '-0.07%', up: false },
    { name: 'INDIA VIX', value: '11.45', change: '-0.30', pct: '-2.55%', up: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Live Market Dashboard <span className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span></span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">Real-time macro view of the Indian markets and institutional flows.</p>
        </div>
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm">
           <div className="flex items-center gap-2 text-sm">
             <Clock className="w-4 h-4 text-gray-400" />
             <span className="font-mono font-medium text-gray-700">{time}</span>
           </div>
           <div className="w-px h-4 bg-gray-300"></div>
           <div className="flex items-center gap-2 text-sm">
             <Globe className="w-4 h-4 text-gray-400" />
             <span className="font-bold text-green-600">{marketStatus}</span>
           </div>
        </div>
      </div>

      {/* Tickers */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {indices.map(idx => (
           <div key={idx.name} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group">
              <div className="text-xs font-bold text-gray-500 mb-1">{idx.name}</div>
              <div className="text-2xl font-black text-gray-900">{idx.value}</div>
              <div className={`text-sm font-bold flex items-center gap-1 mt-1 ${idx.up ? 'text-green-600' : 'text-red-600'}`}>
                 {idx.up ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                 {idx.change} ({idx.pct})
              </div>
           </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* FII DII Data */}
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-blue-600" /> FII & DII Activity (Cash)</h3>
            <div className="space-y-4">
               <div className="flex justify-between items-end border-b border-gray-100 pb-4">
                  <div>
                     <div className="text-sm font-bold text-gray-700">FII Net Value</div>
                     <div className="text-2xl font-black text-red-600">-₹1,425.60 Cr</div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                     <div>Buy: ₹8,420 Cr</div>
                     <div>Sell: ₹9,845 Cr</div>
                  </div>
               </div>
               <div className="flex justify-between items-end">
                  <div>
                     <div className="text-sm font-bold text-gray-700">DII Net Value</div>
                     <div className="text-2xl font-black text-green-600">+₹2,105.40 Cr</div>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                     <div>Buy: ₹6,500 Cr</div>
                     <div>Sell: ₹4,394 Cr</div>
                  </div>
               </div>
            </div>
         </div>

         {/* Sector Performance */}
         <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-bold text-gray-900">Top Sectors</h3>
               <button className="text-xs font-bold text-blue-600 flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></button>
            </div>
            <div className="space-y-3">
               {[
                 { name: 'NIFTY IT', val: '+2.4%', up: true },
                 { name: 'NIFTY AUTO', val: '+1.1%', up: true },
                 { name: 'NIFTY PHARMA', val: '-0.8%', up: false },
                 { name: 'NIFTY METAL', val: '-1.2%', up: false }
               ].map(sec => (
                  <div key={sec.name} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg">
                     <span className="font-medium text-gray-700 text-sm">{sec.name}</span>
                     <span className={`text-sm font-bold px-2 py-1 rounded bg-opacity-10 ${sec.up ? 'text-green-700 bg-green-500' : 'text-red-700 bg-red-500'}`}>{sec.val}</span>
                  </div>
               ))}
            </div>
         </div>
      </div>
    </div>
  );
}
