import React, { useEffect, useRef } from 'react';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NewsBlogs() {
  const container = useRef(null);

  useEffect(() => {
    // Initialize TradingView News Widget
    if (container.current && !container.current.querySelector('script')) {
      const script = document.createElement("script");
      script.src = "https://s3.tradingview.com/external-embedding/embed-widget-timeline.js";
      script.type = "text/javascript";
      script.async = true;
      script.innerHTML = `
        {
          "feedMode": "all_symbols",
          "isTransparent": true,
          "displayMode": "compact",
          "width": "100%",
          "height": "450",
          "colorTheme": "light",
          "locale": "en"
        }`;
      container.current.appendChild(script);
    }
  }, []);

  return (
    <section id="news" className="py-20 bg-slate-50 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent"></div>
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
          <div className="max-w-2xl mb-6 md:mb-0">
            <div className="inline-flex items-center space-x-2 bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Live Feed</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4 flex items-center space-x-3">
              <TrendingUp className="text-primary hidden sm:block" size={32} />
              <span>News & Market Insights</span>
            </h2>
            <p className="text-slate-600 text-lg">
              Stay ahead of the curve with our auto-updating global market news feed.
            </p>
          </div>
          <Link to="/news" className="inline-flex items-center space-x-2 bg-white text-primary border border-slate-200 px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:-translate-y-1 transition-all">
            <span>Read All News</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Live News Feed Container */}
        <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-2 md:p-6">
          <div className="tradingview-widget-container" ref={container}>
            <div className="tradingview-widget-container__widget"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
