import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0);

  const faqs = [
    {
      question: "How does the platform work?",
      answer: "Our platform provides direct market access to various exchanges. Once you open an account, you can deposit funds and start trading instantly through our web, mobile, or desktop applications. Trades are executed in real-time through our high-speed matching engine."
    },
    {
      question: "Which markets are available for trading?",
      answer: "We offer access to NSE Futures & Options, MCX (Commodities), COMEX, major Cryptocurrencies, Forex pairs, and US Stocks & Indices. You can trade all these instruments from a single unified account."
    },
    {
      question: "Is there a demo account available?",
      answer: "Yes, we provide a paper trading (demo) environment with $100,000 virtual funds. It uses live market data so you can practice your strategies risk-free before trading with real money."
    },
    {
      question: "How safe are my funds?",
      answer: "Your funds are held in segregated accounts with top-tier banks. We use bank-grade 256-bit encryption, strict biometric authentication, and comply with all regulatory guidelines to ensure maximum security for your capital."
    },
    {
      question: "What are the account opening charges?",
      answer: "Account opening is completely free for basic accounts. There are no hidden charges. You pay absolutely zero brokerage fees when you execute trades."
    }
  ];

  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex flex-col md:flex-row gap-12 max-w-6xl mx-auto">
          
          <div className="md:w-1/3">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Got Questions?</h2>
            <p className="text-slate-600 mb-8">
              Find answers to the most common questions about trading on our platform.
            </p>
            <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
              <h4 className="font-bold text-slate-800 mb-2">Still need help?</h4>
              <p className="text-sm text-slate-600 mb-4">Our support team is available 24/7 to assist you.</p>
              <button className="w-full bg-white text-primary border border-primary hover:bg-blue-50 py-2 rounded-lg font-medium transition-colors">
                Contact Support
              </button>
            </div>
          </div>
          
          <div className="md:w-2/3 space-y-4">
            {faqs.map((faq, idx) => (
              <div 
                key={idx} 
                className={`border rounded-xl overflow-hidden transition-colors ${
                  openIndex === idx ? 'border-primary bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <button 
                  className="w-full text-left px-6 py-5 flex justify-between items-center focus:outline-none"
                  onClick={() => setOpenIndex(openIndex === idx ? -1 : idx)}
                >
                  <span className={`font-bold pr-4 ${openIndex === idx ? 'text-primary' : 'text-slate-800'}`}>
                    {faq.question}
                  </span>
                  <ChevronDown 
                    size={20} 
                    className={`shrink-0 transition-transform duration-300 ${openIndex === idx ? 'rotate-180 text-primary' : 'text-slate-400'}`} 
                  />
                </button>
                <AnimatePresence>
                  {openIndex === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="px-6 pb-5 text-slate-600">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
}
