import React from 'react';
import { Link } from 'react-router-dom';
import { Activity, Briefcase, TrendingUp, Compass, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TradingTypes() {
  const types = [
    {
      icon: <Clock size={32} className="text-white" />,
      title: "Intraday Trading",
      desc: "Capitalize on daily market movements with high leverage and zero brokerage. Perfect for active day traders.",
      color: "bg-blue-500",
      link: "/trading/intraday"
    },
    {
      icon: <Briefcase size={32} className="text-white" />,
      title: "Equity Delivery",
      desc: "Build long-term wealth by investing in quality stocks. Zero brokerage on delivery trades.",
      color: "bg-indigo-500",
      link: "/trading/equity"
    },
    {
      icon: <TrendingUp size={32} className="text-white" />,
      title: "Margin Trading",
      desc: "Get up to 4x leverage on over 500+ approved stocks. Pay interest only on the margin utilized.",
      color: "bg-purple-500",
      link: "/trading/margin"
    },
    {
      icon: <Activity size={32} className="text-white" />,
      title: "Futures & Options",
      desc: "Trade index and stock derivatives with advanced option chain analytics and strategic payoff graphs.",
      color: "bg-sky-500",
      link: "/markets/nse"
    },
    {
      icon: <Compass size={32} className="text-white" />,
      title: "Commodity Trading",
      desc: "Diversify your portfolio with bullion, energy, and agri-commodities on MCX & NCDEX.",
      color: "bg-teal-500",
      link: "/markets/mcx"
    }
  ];

  return (
    <section id="trading-types" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Trading Built for You</h2>
            <p className="text-slate-600 text-lg">
              Whether you are an active day trader or a long-term investor, we have the right tools and products to support your strategy.
            </p>
          </div>
          <Link to="/trading/margin" className="hidden md:block text-primary font-medium hover:underline">
            View Pricing
          </Link>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {types.map((type, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-xl transition-shadow group"
            >
              <div className={`p-6 ${type.color} flex justify-between items-center`}>
                {type.icon}
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Activity size={16} className="text-white" />
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-slate-800 mb-2">{type.title}</h3>
                <p className="text-slate-600 mb-4">{type.desc}</p>
                <Link to={type.link} className="text-sm font-bold text-primary hover:text-blue-700 uppercase tracking-wide">
                  Learn More &rarr;
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
