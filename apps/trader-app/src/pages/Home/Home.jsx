import { useNavigate } from 'react-router-dom';
import { Briefcase, PieChart, Circle } from 'lucide-react';
import { useTradeStore } from '../../store/useTradeStore';

export default function Home() {
  const { user } = useTradeStore();
  const navigate = useNavigate();
  const walletRaw = useTradeStore(s => s.wallet);
  const wallet = walletRaw || { balance: 0, equity: 0, usedMargin: 0, todayPnl: 0, todayPnlPercent: 0, availableMargin: 0 };

  const formatAmount = (val) => {
    return Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="page-enter bg-white dark:bg-[#0b0e14] min-h-full">
      <div className="px-4 lg:px-12 py-8 max-w-6xl mx-auto">
        <h1 className="text-[28px] font-normal text-text-primary mb-10 tracking-tight">
          Hi, {user?.name?.split(' ')[0] || 'Trader'}
        </h1>

        {/* Equity and Commodity Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-0 border-b border-border/40 pb-16 mb-12">
          
          {/* Equity Section */}
          <div className="md:pr-16">
            <div className="flex items-center gap-2 mb-8 text-text-secondary">
              <PieChart size={18} strokeWidth={1.5} />
              <span className="text-[15px]">Equity</span>
            </div>
            
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[44px] leading-none font-light text-text-primary tracking-tight mb-3">
                  {formatAmount(wallet.balance)}
                </div>
                <div className="text-[13px] text-text-muted">Margin available</div>
              </div>
              
              <div className="text-right space-y-5">
                <div className="flex justify-between gap-8 items-end border-b border-border/30 pb-2">
                  <div className="text-[13px] text-text-muted text-left">Margins used</div>
                  <div className="text-[15px] text-text-primary">{formatAmount(wallet.usedMargin)}</div>
                </div>
                <div className="flex justify-between gap-8 items-end border-b border-border/30 pb-2">
                  <div className="text-[13px] text-text-muted text-left">Opening balance</div>
                  <div className="text-[15px] text-text-primary">{formatAmount(wallet.balance)}</div>
                </div>
                <div className="pt-1">
                  <button className="text-[13px] text-blue-500 hover:text-blue-600 flex items-center justify-end gap-1.5 font-medium ml-auto transition-colors">
                    <Circle size={10} strokeWidth={3} className="text-blue-500" /> View statement
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Commodity Section */}
          <div className="md:border-l border-border/40 md:pl-16 mt-12 md:mt-0">
            <div className="flex items-center gap-2 mb-8 text-text-secondary">
              <Circle size={18} strokeWidth={1.5} />
              <span className="text-[15px]">Commodity</span>
            </div>
            
            <div className="flex items-start justify-between">
              <div>
                <div className="text-[44px] leading-none font-light text-text-primary tracking-tight mb-3">
                  0.00
                </div>
                <div className="text-[13px] text-text-muted">Margin available</div>
              </div>
              
              <div className="text-right space-y-5">
                <div className="flex justify-between gap-8 items-end border-b border-border/30 pb-2">
                  <div className="text-[13px] text-text-muted text-left">Margins used</div>
                  <div className="text-[15px] text-text-primary">0.00</div>
                </div>
                <div className="flex justify-between gap-8 items-end border-b border-border/30 pb-2">
                  <div className="text-[13px] text-text-muted text-left">Opening balance</div>
                  <div className="text-[15px] text-text-primary">0.00</div>
                </div>
                <div className="pt-1">
                  <button className="text-[13px] text-blue-500 hover:text-blue-600 flex items-center justify-end gap-1.5 font-medium ml-auto transition-colors">
                    <Circle size={10} strokeWidth={3} className="text-blue-500" /> View statement
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Holdings empty state (similar to Zerodha) */}
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="mb-8 opacity-20 text-text-primary">
            <Briefcase size={80} strokeWidth={1} />
          </div>
          <p className="text-[15px] text-text-secondary mb-8 max-w-[400px] leading-relaxed">
            You don't have any stocks in your DEMAT yet. Get started with absolutely free equity investments.
          </p>
          <button 
            onClick={() => navigate('/markets')} 
            className="bg-[#387ed1] hover:bg-[#2b6eb5] text-white px-8 py-2.5 rounded text-[15px] font-medium transition-colors"
          >
            Start investing
          </button>
        </div>
      </div>
    </div>
  );
}
