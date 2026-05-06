import React from 'react';
import { LineChart, Smartphone, Zap, Monitor, Lock } from 'lucide-react';
export default function Features() {
  const features = [
    {
      icon: <LineChart size={20} />,
      title: "Advanced Charts",
      desc: "Integrated TradingView charts with 100+ technical indicators and drawing tools."
    },
    {
      icon: <Zap size={20} />,
      title: "Real-time Engine",
      desc: "Tick-by-tick data streaming directly to your browser with zero delay."
    },
    {
      icon: <Smartphone size={20} />,
      title: "Mobile Optimized",
      desc: "Full functionality available on our responsive mobile interfaces."
    },
    {
      icon: <Monitor size={20} />,
      title: "Customizable Layouts",
      desc: "Create personalized workspaces for different trading strategies."
    }
  ];

  return (
    <section className="py-24 bg-slate-900 text-white overflow-hidden relative">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-900/40 to-transparent"></div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="order-2 lg:order-1">
            {/* Dark Mode Dashboard Mockup */}
            <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="bg-slate-800/80 border-b border-slate-700 px-4 py-3 flex justify-between items-center">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-600"></div>
                </div>
                <div className="flex space-x-4">
                  <span className="text-xs text-slate-400">Positions: <span className="text-profit">+₹4,520.50</span></span>
                  <span className="text-xs text-slate-400">Funds: ₹2,45,000</span>
                </div>
              </div>
              
              <div className="p-4 grid grid-cols-12 gap-4">
                {/* Sidebar */}
                <div className="col-span-4 bg-slate-900 rounded-lg border border-slate-700 p-2 space-y-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex justify-between items-center p-2 hover:bg-slate-800 rounded cursor-pointer">
                      <div>
                        <div className="text-sm font-bold text-slate-200">NIFTY{24000 + i*100}CE</div>
                        <div className="text-xs text-slate-500">NSE F&O</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-slate-200">145.20</div>
                        <div className={`text-xs ${i%2===0 ? 'text-loss' : 'text-profit'}`}>{i%2===0 ? '-1.5%' : '+2.4%'}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Main Content */}
                <div className="col-span-8 flex flex-col gap-4">
                  {/* Chart Area */}
                  <div className="h-48 bg-slate-900 rounded-lg border border-slate-700 relative overflow-hidden p-4 flex flex-col">
                    <div className="flex justify-between text-xs text-slate-400 mb-2">
                      <span>NIFTY50 • 1D</span>
                      <div className="flex space-x-2">
                        <span>1M</span><span className="text-blue-400">1D</span><span>1W</span>
                      </div>
                    </div>
                    <div className="flex-1 flex items-end space-x-1 mt-4">
                      {[...Array(30)].map((_, i) => (
                        <div key={i} className={`flex-1 rounded-t-sm opacity-90 ${Math.sin(i/3) > 0 ? 'bg-profit' : 'bg-loss'}`} 
                             style={{ height: `${30 + Math.abs(Math.sin(i/3)) * 60}%` }}></div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Order Entry */}
                  <div className="h-24 bg-slate-900 rounded-lg border border-slate-700 p-4 flex items-center justify-between">
                    <div className="flex space-x-4">
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Qty</div>
                        <input type="text" className="w-20 bg-slate-800 border border-slate-700 text-white p-1 rounded text-sm" defaultValue="50" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 mb-1">Price</div>
                        <input type="text" className="w-24 bg-slate-800 border border-slate-700 text-white p-1 rounded text-sm" defaultValue="145.20" />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button className="bg-profit text-white px-6 py-2 rounded font-bold text-sm">BUY</button>
                      <button className="bg-loss text-white px-6 py-2 rounded font-bold text-sm">SELL</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Professional Tools,<br/>Simplified Experience</h2>
            <p className="text-slate-400 text-lg mb-10 leading-relaxed">
              We've stripped away the complexity of traditional trading platforms while keeping all the power. Execute trades faster, analyze better, and manage risk effortlessly.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-10 h-10 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 text-blue-400">
                    {feature.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-200 mb-1">{feature.title}</h4>
                    <p className="text-sm text-slate-400">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <button className="mt-10 border border-slate-600 hover:border-slate-400 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-medium transition-all">
              Explore All Features
            </button>
          </div>

        </div>
      </div>
    </section>
  );
}
