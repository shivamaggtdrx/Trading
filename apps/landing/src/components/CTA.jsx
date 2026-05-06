import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function CTA() {
  return (
    <section className="py-24 bg-primary relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [12, 15, 12] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[50%] -right-[10%] w-[70%] h-[150%] bg-blue-500/30 rounded-full blur-3xl transform rotate-12"
        />
        <motion.div 
          animate={{ scale: [1, 1.2, 1], rotate: [-12, -8, -12] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute top-[20%] -left-[10%] w-[50%] h-[100%] bg-blue-400/20 rounded-full blur-3xl transform -rotate-12"
        />
      </div>
      
      <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight">
            Ready to Start Trading Today?
          </h2>
          <p className="text-xl text-blue-100 mb-10">
            Join thousands of traders who have already upgraded their trading experience. Open your free account in less than 5 minutes.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/register" className="relative overflow-hidden w-full sm:w-auto bg-white text-primary px-8 py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-900/20 hover:-translate-y-1 hover:shadow-2xl transition-all block sm:inline-block group">
              <span className="relative z-10">Start Trading</span>
              <motion.div 
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-100/50 to-transparent z-0 skew-x-12"
                animate={{ translateX: ['-100%', '200%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", repeatDelay: 1 }}
              />
            </Link>
            <Link to="/register" className="w-full sm:w-auto bg-blue-800/50 backdrop-blur-sm text-white border border-blue-400/50 px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700/50 hover:-translate-y-1 transition-all block sm:inline-block">
              Create Account
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
