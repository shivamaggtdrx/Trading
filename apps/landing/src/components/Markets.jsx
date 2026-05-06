import React, { useState } from 'react';
import { Link } from 'react-router-dom';
export default function Markets() {
  const [activeTab, setActiveTab] = useState('nse');

  const markets = [
    { id: 'nse', label: 'NSE F&O' },
    { id: 'mcx', label: 'MCX' },
    { id: 'comex', label: 'COMEX' },
    { id: 'crypto', label: 'Crypto' },
    { id: 'forex', label: 'Forex' },
    { id: 'us', label: 'US Stocks' },
  ];

  const marketData = {
    nse: {
      desc: "Trade India's leading indices and stock derivatives with high liquidity and low margins.",
      instruments: [
        { name: 'NIFTY 50', price: '22,453.20', change: '+0.85%' },
        { name: 'BANKNIFTY', price: '48,230.45', change: '-0.32%' },
        { name: 'RELIANCE', price: '2,950.00', change: '+1.20%' },
        { name: 'HDFCBANK', price: '1,450.75', change: '-0.15%' }
      ]
    },
    mcx: {
      desc: "Access the domestic commodities market including precious metals, energy, and base metals.",
      instruments: [
        { name: 'GOLD', price: '71,250.00', change: '+0.45%' },
        { name: 'SILVER', price: '82,400.00', change: '+1.10%' },
        { name: 'CRUDEOIL', price: '6,850.00', change: '-1.25%' },
        { name: 'COPPER', price: '840.50', change: '+0.60%' }
      ]
    },
    comex: {
      desc: "Trade international commodities on the global exchange with leverage.",
      instruments: [
        { name: 'GOLD USD', price: '2,340.50', change: '+0.25%' },
        { name: 'SILVER USD', price: '28.45', change: '+0.80%' },
        { name: 'WTI CRUDE', price: '82.30', change: '-1.10%' },
        { name: 'NATGAS', price: '2.45', change: '-0.50%' }
      ]
    },
    crypto: {
      desc: "24/7 access to major cryptocurrencies with tight spreads and deep liquidity.",
      instruments: [
        { name: 'BTC/USD', price: '64,250.00', change: '+2.45%' },
        { name: 'ETH/USD', price: '3,150.20', change: '+1.80%' },
        { name: 'SOL/USD', price: '145.60', change: '-0.50%' },
        { name: 'BNB/USD', price: '580.40', change: '+0.90%' }
      ]
    },
    forex: {
      desc: "Trade major, minor, and exotic currency pairs in the world's largest financial market.",
      instruments: [
        { name: 'EUR/USD', price: '1.0845', change: '+0.12%' },
        { name: 'GBP/USD', price: '1.2560', change: '-0.08%' },
        { name: 'USD/JPY', price: '154.20', change: '+0.35%' },
        { name: 'USD/INR', price: '83.45', change: '-0.05%' }
      ]
    },
    us: {
      desc: "Invest in top global tech companies and US indices from anywhere.",
      instruments: [
        { name: 'APPLE', price: '175.40', change: '+1.50%' },
        { name: 'TESLA', price: '180.20', change: '-2.10%' },
        { name: 'MICROSOFT', price: '410.50', change: '+0.80%' },
        { name: 'NASDAQ 100', price: '17,850.20', change: '+1.15%' }
      ]
    }
  };

  return (
    <section id="markets" className="py-20 bg-fintech-gray border-y border-slate-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Markets We Offer</h2>
          <p className="text-slate-600 text-lg">
            Trade across thousands of instruments globally from a single powerful platform.
          </p>
        </div>

        {/* Custom Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {markets.map((market) => (
            <button
              key={market.id}
              onClick={() => setActiveTab(market.id)}
              className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 ${
                activeTab === market.id 
                  ? 'bg-primary text-white shadow-md' 
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {market.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <h3 className="text-2xl font-bold text-slate-800 mb-2">{markets.find(m => m.id === activeTab)?.label}</h3>
            <p className="text-slate-600">{marketData[activeTab].desc}</p>
          </div>
          
          <div className="bg-slate-50 p-8">
            <div className="grid sm:grid-cols-2 gap-4">
              {marketData[activeTab].instruments.map((inst, idx) => {
                const isPositive = inst.change.startsWith('+');
                return (
                  <div 
                    key={`${activeTab}-${idx}`}
                    className="bg-white p-4 rounded-xl border border-slate-200 flex justify-between items-center"
                  >
                    <span className="font-bold text-slate-800">{inst.name}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium text-slate-800">{inst.price}</div>
                      <div className={`text-xs font-bold ${isPositive ? 'text-profit' : 'text-loss'}`}>
                        {inst.change}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 text-center">
              <Link 
                to={`/markets/${activeTab === 'us' ? 'us-stocks' : activeTab === 'comex' ? 'mcx' : activeTab}`} 
                className="text-primary font-medium hover:underline flex items-center justify-center space-x-1 mx-auto"
              >
                <span>View all instruments</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
