import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ShieldCheck, 
  Zap, 
  Globe, 
  TrendingUp, 
  Clock, 
  Percent, 
  Award,
  PlayCircle,
  ArrowRight,
  Wallet,
  Briefcase,
  Smartphone,
  Banknote,
  LineChart,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

export default function WhyUsPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const features = [
    {
      icon: <Percent size={32} className="text-emerald-500" />,
      title: "Zero Brokerage, Keep 100% Profits",
      desc: "Stop sharing your hard-earned money. We offer the lowest brokerage plans in the industry. What you earn is entirely yours to take home. No more profit-sharing with brokers."
    },
    {
      icon: <TrendingUp size={32} className="text-primary" />,
      title: "Up to 500x Margin",
      desc: "Maximize your trading potential. Trade higher volumes with lesser capital using our flexible, industry-leading margin facilities designed for professional traders."
    },
    {
      icon: <Zap size={32} className="text-yellow-500" />,
      title: "Ultra-Fast Execution",
      desc: "Execute your trades at lightning speed with our advanced trading infrastructure. Real-time transactions ensure you never miss market opportunities."
    },
    {
      icon: <Globe size={32} className="text-purple-500" />,
      title: "500+ Assets & Multi Markets",
      desc: "Unify your global trading experience. Access NSE, MCX, Comex, Crypto, Forex, and US Stocks from a single interface. Trade in the currency of your choice and skip conversion hassles."
    },
    {
      icon: <LineChart size={32} className="text-pink-500" />,
      title: "Advanced Trading Tools",
      desc: "Access state-of-the-art technical analysis indicators, customizable charts, and comprehensive market data to make informed, professional trading decisions."
    },
    {
      icon: <Banknote size={32} className="text-orange-500" />,
      title: "Instant Deposits & Withdrawals",
      desc: "Enjoy super fast deposits via UPI or bank transfer. Partnered with top payment processors to ensure 100% of payments are swift, with absolutely no restrictions."
    },
    {
      icon: <PlayCircle size={32} className="text-blue-500" />,
      title: "Free Demo Account",
      desc: "Practice with virtual funds and get a feel for real market conditions before you start investing your own capital. Perfect for beginners and pros to test strategies."
    },
    {
      icon: <Star size={32} className="text-indigo-500" />,
      title: "Trusted by Celebrities & You",
      desc: "Invest with confidence. Our platform is endorsed by well-respected celebrities and trusted by thousands. Enjoy 24/7 dedicated customer support."
    }
  ];

  const steps = [
    {
      num: "01",
      title: "Register",
      desc: "Sign up with just your Email & Phone number."
    },
    {
      num: "02",
      title: "Minimal Documents",
      desc: "Quick verification with absolutely zero extensive paperwork."
    },
    {
      num: "03",
      title: "Deposit Instantly",
      desc: "Super fast Deposits via UPI or direct bank transfer."
    },
    {
      num: "04",
      title: "Start Trading",
      desc: "Access global exchanges and start trading in seconds."
    }
  ];

  const marginData = [
    { script: "Gold", ordinary: "₹ 5,50,000", tradex: "₹ 13,000" },
    { script: "Natural Gas", ordinary: "₹ 65,000", tradex: "₹ 400" },
    { script: "Crude", ordinary: "₹ 2,50,000", tradex: "₹ 1,500" },
    { script: "Silver", ordinary: "₹ 3,00,000", tradex: "₹ 4,500" },
    { script: "Bank Nifty", ordinary: "₹ 90,000", tradex: "₹ 1,500" },
    { script: "Nifty", ordinary: "₹ 1,20,000", tradex: "₹ 2,500" }
  ];

  return (
    <main className="pt-20 pb-20 bg-slate-50 min-h-screen">
      
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 bg-slate-900 text-white overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[0%] right-[0%] w-[50%] h-[70%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[0%] left-[0%] w-[50%] h-[60%] rounded-full bg-emerald-500/20 blur-[100px]" />
        </div>

        <motion.div 
          animate={{ scale: [1, 1.05, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute left-[10%] top-[20%] opacity-10 hidden lg:block"
        >
          <ShieldCheck size={300} />
        </motion.div>

        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 text-emerald-300 px-4 py-1.5 rounded-full text-sm font-bold tracking-wide uppercase mb-8">
              <Award size={16} />
              <span>India's Most Trusted Trading Platform</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold mb-6 leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-primary">
              Why Choose TradeX?
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 leading-relaxed max-w-3xl mx-auto font-light mb-10">
              Discover why thousands of traders prefer our platform. Enjoy zero brokerage, lightning-fast execution, advanced charting tools, and a seamless trading experience across 500+ global assets.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register" className="w-full sm:w-auto bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all flex items-center justify-center space-x-2">
                <span>Start Trading Now</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* About Us / Foundation */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest mb-2">Our Story</h2>
              <h3 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">Built for Traders, by Traders</h3>
              <p className="text-slate-600 text-lg leading-relaxed mb-6">
                Founded in 2018, TradeX was established with a clear vision: to provide traders of all levels with unparalleled access to financial markets, accompanied by state-of-the-art trading solutions.
              </p>
              <p className="text-slate-600 text-lg leading-relaxed">
                We believe in creating a professional and supportive environment designed to maximize your potential for success. That means stripping away exorbitant broker fees, providing massive margins, and ensuring your transactions are always secure and instant.
              </p>
            </div>
            <div className="flex-1">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 relative">
                <div className="absolute top-0 right-0 w-20 h-20 bg-primary/10 rounded-bl-[100px]"></div>
                <Briefcase size={48} className="text-primary mb-6" />
                <h4 className="text-2xl font-bold text-slate-900 mb-4">Secure Earnings: Brokerage + Salary Plans!</h4>
                <p className="text-slate-600 leading-relaxed">
                  Join TradeX and take advantage of our highly competitive brokerage plans combined with a <strong>guaranteed salary structure</strong>. Whether you’re an experienced trader or just starting out, we provide the perfect platform to grow your earnings and achieve true financial stability.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-16 relative z-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">No More Sharing Your Profits</h2>
            <p className="text-lg text-slate-600">See the difference zero brokerage makes on your bottom line.</p>
          </div>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden flex flex-col md:flex-row"
          >
            <div className="flex-1 p-10 bg-slate-50 border-b md:border-b-0 md:border-r border-slate-200 opacity-70 grayscale">
              <h3 className="text-2xl font-bold text-slate-600 mb-6 text-center">Ordinary Platforms</h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center text-slate-500">
                  <span>Your Profit</span>
                  <span className="font-medium text-slate-700">₹28,000</span>
                </li>
                <li className="flex justify-between items-center text-slate-500">
                  <span>Brokerage, Taxes etc.</span>
                  <span className="font-medium text-red-500">- ₹20,000</span>
                </li>
                <li className="w-full h-px bg-slate-200 my-2"></li>
                <li className="flex justify-between items-center font-bold text-lg">
                  <span className="text-slate-600">Net Profit (Take Home)</span>
                  <span className="text-slate-800">₹8,000</span>
                </li>
              </ul>
            </div>
            <div className="flex-1 p-10 bg-white relative">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-bl-full"></div>
              <h3 className="text-2xl font-bold text-primary mb-6 text-center flex items-center justify-center space-x-2">
                <span>TradeX</span>
                <ShieldCheck className="text-emerald-500" size={24} />
              </h3>
              <ul className="space-y-4">
                <li className="flex justify-between items-center">
                  <span className="text-slate-600">Your Profit</span>
                  <span className="font-bold text-slate-900">₹28,000</span>
                </li>
                <li className="flex justify-between items-center">
                  <span className="text-slate-600">Brokerage, Taxes etc.</span>
                  <span className="font-bold text-emerald-500">₹0 (Zero)</span>
                </li>
                <li className="w-full h-px bg-slate-100 my-2"></li>
                <li className="flex justify-between items-center font-bold text-xl">
                  <span className="text-slate-900">Net Profit (Take Home)</span>
                  <span className="text-emerald-600 text-2xl">₹28,000</span>
                </li>
              </ul>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Margin Comparison Table */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Up to 500x Margin</h2>
            <p className="text-lg text-slate-600 mb-2">Trade higher volumes with lesser capital.</p>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">Illustrative Comparison of Margin Required for Intraday Trading:</p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full text-center border-collapse">
              <thead>
                <tr>
                  <th className="py-5 px-6 bg-slate-50 border border-slate-200 text-slate-800 font-bold text-lg rounded-tl-xl">Script</th>
                  <th className="py-5 px-6 bg-slate-50 border border-slate-200 text-slate-800 font-bold text-lg">Per Lot Margin - Ordinary Platform</th>
                  <th className="py-5 px-6 bg-blue-50/50 border border-slate-200 text-primary font-bold text-lg rounded-tr-xl">Per lot Margin - TradeX</th>
                </tr>
              </thead>
              <tbody>
                {marginData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 border border-slate-200 text-slate-600 font-medium">{row.script}</td>
                    <td className="py-4 px-6 border border-slate-200 text-slate-500">{row.ordinary}</td>
                    <td className="py-4 px-6 border border-slate-200 text-emerald-600 font-bold bg-blue-50/20">{row.tradex}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-slate-50">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-6">Everything You Need to Succeed</h2>
            <p className="text-lg text-slate-600">From unparalleled margins to ultra-fast execution, we provide the tools that professional traders demand.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 transition-all duration-300 group"
              >
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3 leading-tight">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Onboarding Steps */}
      <section className="py-20 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-blue-600/10 skew-x-12"></div>
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Open Account in 1 Minute</h2>
            <p className="text-lg text-slate-400">Join the ultimate trading experience. Apply for a trading account instantly and access advanced tools.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-black text-slate-800 mb-4 opacity-50">{step.num}</div>
                <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                <p className="text-slate-400">{step.desc}</p>
                {idx < 3 && <div className="hidden md:block absolute top-10 -right-4 w-8 h-px bg-slate-700"></div>}
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <Link to="/register" className="inline-flex items-center space-x-2 bg-primary hover:bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all">
              <span>Join Now!</span>
              <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
