import React, { useState } from 'react';
import { Play, CheckCircle2, AlertCircle, Clock, FileText, RotateCcw } from 'lucide-react';

export default function EODSettlement() {
  const [status, setStatus] = useState('idle'); // idle, running, completed

  const steps = [
    { id: 1, name: 'Halt Trading Services', status: status === 'completed' ? 'done' : status === 'running' ? 'done' : 'pending' },
    { id: 2, name: 'Fetch EOD Prices from Exchange', status: status === 'completed' ? 'done' : status === 'running' ? 'running' : 'pending' },
    { id: 3, name: 'Calculate Mark-to-Market (M2M)', status: status === 'completed' ? 'done' : 'pending' },
    { id: 4, name: 'Apply Penalties & Brokerage', status: status === 'completed' ? 'done' : 'pending' },
    { id: 5, name: 'Ledger Settlement & Balances', status: status === 'completed' ? 'done' : 'pending' },
    { id: 6, name: 'Generate Settlement Reports', status: status === 'completed' ? 'done' : 'pending' },
  ];

  const handleStart = () => {
     if (window.confirm('Start EOD settlement process? Trading will be halted during this process.')) {
       setStatus('running');
       setTimeout(() => setStatus('completed'), 3000);
     }
  };

  const handleReset = () => {
    if (window.confirm('Reset settlement process? This will allow you to run it again.')) {
      setStatus('idle');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">EOD / Settlement Processing</h1>
          <p className="text-sm text-gray-500 mt-1">End-of-day wizard for M2M, auto-debit/credit, and ledger settlement.</p>
        </div>
        <div className="flex gap-3">
          {status === 'completed' && (
            <button onClick={handleReset} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          )}
          <button onClick={() => alert('Previous Settlement Reports:\n\n• 24 Oct 2023 — Settled ✓\n• 23 Oct 2023 — Settled ✓\n• 22 Oct 2023 — Settled ✓\n• 21 Oct 2023 — Settled ✓')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileText className="w-4 h-4" />
            Previous Reports
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
         <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-6">
            <div>
               <h2 className="text-lg font-bold text-gray-900">Settlement Cycle: 25 Oct 2023</h2>
               <p className="text-sm text-gray-500">Status: {status === 'idle' ? 'Ready to Start' : status === 'running' ? 'Processing...' : 'Completed successfully'}</p>
            </div>
            {status === 'idle' && (
               <button onClick={handleStart} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 shadow-sm transition-all">
                  <Play className="w-5 h-5 fill-current" />
                  Start EOD Process
               </button>
            )}
            {status === 'running' && (
               <button onClick={() => console.log('Action triggered')} disabled className="flex items-center gap-2 px-6 py-3 bg-blue-400 text-white rounded-lg font-medium cursor-wait shadow-sm transition-all">
                  <Clock className="w-5 h-5 animate-spin" />
                  Processing...
               </button>
            )}
            {status === 'completed' && (
               <button onClick={() => alert('Settlement Report for 25 Oct 2023\n\nTotal Clients Settled: 1,245\nProfit Credited: ₹12,45,000\nLosses Debited: ₹8,32,000\nBrokerage Collected: ₹2,15,000\nPenalties Applied: ₹45,000\n\nSettlement ID: STL-20231025')} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 shadow-sm transition-all">
                  <CheckCircle2 className="w-5 h-5" />
                  View Settlement Report
               </button>
            )}
         </div>

         <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 before:to-transparent">
            {steps.map((step, index) => (
               <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 bg-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10
                     ${step.status === 'done' ? 'border-green-500 text-green-500' : 
                       step.status === 'running' ? 'border-blue-500 text-blue-500 border-dashed animate-spin-slow' : 
                       'border-gray-300 text-gray-300'}`}>
                     {step.status === 'done' ? <CheckCircle2 className="w-5 h-5" /> : 
                      step.status === 'running' ? <Clock className="w-5 h-5" /> : 
                      <div className="w-2.5 h-2.5 rounded-full bg-gray-300" />}
                  </div>
                  
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-gray-200 bg-white shadow-sm">
                     <div className="flex items-center justify-between space-x-2 mb-1">
                        <div className="font-bold text-gray-900">Step {step.id}</div>
                        <div className={`text-xs font-medium px-2 py-1 rounded-full
                           ${step.status === 'done' ? 'bg-green-100 text-green-700' : 
                             step.status === 'running' ? 'bg-blue-100 text-blue-700' : 
                             'bg-gray-100 text-gray-600'}`}>
                           {step.status.toUpperCase()}
                        </div>
                     </div>
                     <div className="text-gray-500 text-sm">{step.name}</div>
                  </div>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
}
