import React from 'react';
import { Users, Gift, TrendingUp, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Referral() {
  const benefits = [
    "Earn 20% revenue sharing for life",
    "₹500 account opening bonus",
    "Monthly leaderboard rewards",
    "Dedicated affiliate dashboard"
  ];

  return (
    <section id="referral" className="py-20 bg-blue-50 relative overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-100 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden max-w-5xl mx-auto flex flex-col md:flex-row">
          
          {/* Left Content */}
          <div className="p-8 md:p-12 md:w-3/5 flex flex-col justify-center">
            <div className="inline-flex items-center space-x-2 bg-blue-50 text-primary px-3 py-1 rounded-full text-sm font-medium mb-6 w-max">
              <Gift size={16} />
              <span>Partner Program</span>
            </div>
            
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Refer and Earn <span className="text-primary">Unlimited</span>
            </h2>
            
            <p className="text-slate-600 mb-8 text-lg">
              Invite your friends to trade on our platform and earn a recurring commission on every trade they make. Build a passive income stream today.
            </p>
            
            <ul className="space-y-4 mb-8">
              {benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-center space-x-3 text-slate-700">
                  <CheckCircle2 size={20} className="text-green-500 shrink-0" />
                  <span className="font-medium">{benefit}</span>
                </li>
              ))}
            </ul>
            
            <button className="bg-primary hover:bg-blue-700 text-white px-8 py-3.5 rounded-lg font-medium shadow-lg shadow-blue-500/30 transition-all w-max">
              Become an Affiliate
            </button>
          </div>
          
          {/* Right Visual */}
          <div className="bg-slate-900 p-8 md:p-12 md:w-2/5 flex flex-col justify-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-blue-600/20 to-transparent"></div>
            
            <div className="relative z-10 text-white space-y-6">
              <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Your Earnings</div>
                <div className="text-4xl font-bold text-white mb-4">₹45,250</div>
                <div className="flex items-center space-x-2 text-sm text-profit bg-profit/10 w-max px-2 py-1 rounded">
                  <TrendingUp size={14} />
                  <span>+12.5% this month</span>
                </div>
              </div>
              
              <div className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl backdrop-blur-sm">
                <div className="text-slate-400 text-sm mb-1">Total Referrals</div>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold text-white">128</div>
                  <Users size={24} className="text-blue-400" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
