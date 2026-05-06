import React from 'react';
import { Check } from 'lucide-react';

export default function Pricing() {
  const plans = [
    {
      name: "Basic",
      price: "0",
      desc: "Perfect for beginners starting their journey.",
      features: [
        "Zero AMC for first year",
        "Free Equity Delivery",
        "₹20/trade for F&O",
        "Basic Charting Tools",
        "Standard Support"
      ],
      highlight: false
    },
    {
      name: "Pro",
      price: "499",
      period: "/month",
      desc: "For active traders needing advanced tools.",
      features: [
        "Zero Brokerage across all segments",
        "Advanced TradingView Charts",
        "Options Strategy Builder",
        "Margin Trading Facility (MTF)",
        "Priority Support"
      ],
      highlight: true
    },
    {
      name: "Institutional",
      price: "Custom",
      desc: "For high-volume traders and institutions.",
      features: [
        "API Access (1000 req/sec)",
        "Colocation Hosting",
        "Dedicated Relationship Manager",
        "Custom Algorithmic Strategies",
        "24/7 Premium Support"
      ],
      highlight: false
    }
  ];

  return (
    <section id="pricing" className="py-20 bg-slate-50 border-y border-slate-200">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Transparent Pricing</h2>
          <p className="text-slate-600 text-lg">
            No hidden fees, no surprises. Choose the plan that best fits your trading style.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, idx) => (
            <div 
              key={idx} 
              className={`rounded-2xl flex flex-col relative ${
                plan.highlight 
                  ? 'bg-primary text-white shadow-2xl scale-105 z-10' 
                  : 'bg-white text-slate-800 border border-slate-200'
              }`}
            >
              {plan.highlight && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </div>
              )}
              
              <div className={`p-8 border-b ${plan.highlight ? 'border-blue-500' : 'border-slate-100'}`}>
                <h3 className={`text-xl font-bold mb-2 ${plan.highlight ? 'text-white' : 'text-slate-800'}`}>
                  {plan.name}
                </h3>
                <p className={`text-sm mb-6 ${plan.highlight ? 'text-blue-100' : 'text-slate-500'}`}>
                  {plan.desc}
                </p>
                <div className="flex items-baseline space-x-1">
                  <span className="text-3xl font-bold">₹</span>
                  <span className="text-5xl font-extrabold">{plan.price}</span>
                  {plan.period && <span className={`text-sm ${plan.highlight ? 'text-blue-100' : 'text-slate-500'}`}>{plan.period}</span>}
                </div>
              </div>
              
              <div className="p-8 flex-1 flex flex-col">
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start space-x-3">
                      <Check size={18} className={`shrink-0 mt-0.5 ${plan.highlight ? 'text-blue-200' : 'text-primary'}`} />
                      <span className={plan.highlight ? 'text-blue-50' : 'text-slate-600'}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                <button 
                  className={`w-full py-3.5 rounded-lg font-bold transition-all ${
                    plan.highlight 
                      ? 'bg-white text-primary hover:bg-slate-50 shadow-lg' 
                      : 'bg-blue-50 text-primary hover:bg-blue-100'
                  }`}
                >
                  Get Started
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
