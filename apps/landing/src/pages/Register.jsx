import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Globe2, ArrowLeft, ArrowRight } from 'lucide-react';

export default function Register() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Left Side - Branding & Benefits */}
      <div className="hidden lg:flex w-5/12 bg-slate-900 relative flex-col justify-between p-12 overflow-hidden text-white">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-[20%] -left-[10%] w-[80%] h-[80%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[10%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-500/20 blur-[100px]" />
        </div>

        <div className="relative z-10">
          <Link to="/" className="flex items-center space-x-2 mb-16 inline-block">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-white font-bold text-2xl">T</span>
            </div>
            <span className="text-3xl font-bold text-white tracking-tight">Trade<span className="text-primary">X</span></span>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl xl:text-5xl font-bold leading-tight mb-6">
              Start Your Trading Journey Today
            </h1>
            <p className="text-slate-400 text-lg mb-12 max-w-md">
              Join thousands of traders globally. Get access to advanced tools, deep liquidity, and lightning-fast execution.
            </p>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
                  <Globe2 className="text-blue-400" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Global Markets</h3>
                  <p className="text-slate-400">Trade Stocks, Forex, Commodities, and Cryptos from a single unified account.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
                  <Zap className="text-amber-400" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Zero Latency</h3>
                  <p className="text-slate-400">Experience sub-millisecond execution speeds directly connected to top-tier liquidity.</p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/10">
                  <ShieldCheck className="text-emerald-400" size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">Bank-Grade Security</h3>
                  <p className="text-slate-400">Your funds and data are protected by enterprise-level encryption and strict regulatory compliance.</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="relative z-10 text-sm text-slate-500 font-medium">
          © {new Date().getFullYear()} TradeX Securities Pvt. Ltd.
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-7/12 flex items-center justify-center p-6 sm:p-12 lg:p-20 relative overflow-y-auto max-h-screen">
        <Link to="/" className="absolute top-6 left-6 lg:hidden flex items-center space-x-2 text-slate-600 hover:text-primary transition-colors font-medium">
          <ArrowLeft size={18} />
          <span>Back</span>
        </Link>
        
        <div className="absolute top-6 right-6 lg:top-12 lg:right-12">
          <span className="text-slate-500 font-medium">Already have an account? </span>
          <Link to="/login" className="text-primary font-bold hover:underline">Log in</Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          <div className="mb-10 text-center lg:text-left mt-10 lg:mt-0">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
            <p className="text-slate-500 font-medium">Please fill in your details to get started.</p>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">First Name</label>
                <input 
                  type="text" 
                  placeholder="John" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-slate-50 focus:bg-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700">Last Name</label>
                <input 
                  type="text" 
                  placeholder="Doe" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Email Address</label>
              <input 
                type="email" 
                placeholder="john.doe@example.com" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Phone Number</label>
              <div className="flex">
                <select className="px-3 py-3 rounded-l-xl border border-slate-200 border-r-0 focus:border-primary outline-none bg-slate-50 text-slate-700 font-medium">
                  <option>+91</option>
                  <option>+1</option>
                  <option>+44</option>
                  <option>+971</option>
                </select>
                <input 
                  type="tel" 
                  placeholder="98765 43210" 
                  className="w-full px-4 py-3 rounded-r-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-slate-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-slate-50 focus:bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Referral Code <span className="text-slate-400 font-normal">(Optional)</span></label>
              <input 
                type="text" 
                placeholder="Enter code if you have one" 
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-slate-50 focus:bg-white uppercase"
              />
            </div>

            <div className="flex items-start space-x-3 pt-2">
              <input 
                type="checkbox" 
                id="terms" 
                className="mt-1 w-4 h-4 text-primary border-slate-300 rounded focus:ring-primary"
              />
              <label htmlFor="terms" className="text-sm text-slate-600 leading-relaxed">
                I agree to the <Link to="/legal/terms-conditions" className="text-primary font-bold hover:underline">Terms & Conditions</Link> and <Link to="/legal/privacy-policy" className="text-primary font-bold hover:underline">Privacy Policy</Link>. I confirm I am over 18 years of age.
              </label>
            </div>

            <div className="pt-4">
              <button className="w-full bg-primary hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-blue-500/30 hover:-translate-y-1 transition-all flex items-center justify-center space-x-2">
                <span>Create Account</span>
                <ArrowRight size={20} />
              </button>
            </div>
            
            <div className="text-center pt-6">
              <p className="text-xs text-slate-400 font-medium">Secured by 256-bit SSL Encryption</p>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
