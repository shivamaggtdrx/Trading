import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '../../store/useTradeStore';
import { Eye, EyeOff, TrendingUp, ArrowRight } from 'lucide-react';

export default function Login() {
  const [mode, setMode] = useState('login'); // login | signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { login, signup, authLoading } = useTradeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    let result;
    if (mode === 'login') {
      result = await login(email, password);
    } else {
      if (!fullName.trim()) { setError('Full name is required'); return; }
      result = await signup(email, password, fullName, phone, referralCode);
    }

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-black text-gray-900">TradeX</span>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        {/* Tab switch */}
        <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
          <button onClick={() => setMode('login')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Login</button>
          <button onClick={() => setMode('signup')} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>Sign Up</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">Full Name</label>
              <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Enter your name" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-600 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Phone (optional)</label>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Referral Code (optional)</label>
                <input type="text" value={referralCode} onChange={e => setReferralCode(e.target.value)} placeholder="Enter referral code" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" />
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-medium rounded-xl px-4 py-3">{error}</div>
          )}

          <button type="submit" disabled={authLoading} className="w-full py-3 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {authLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>{mode === 'login' ? 'Login' : 'Create Account'}<ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Features banner */}
        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-around text-center">
          <div><div className="text-lg font-black text-blue-600">0%</div><div className="text-[10px] text-gray-500">Brokerage</div></div>
          <div><div className="text-lg font-black text-blue-600">100x</div><div className="text-[10px] text-gray-500">Leverage</div></div>
          <div><div className="text-lg font-black text-blue-600">24/7</div><div className="text-[10px] text-gray-500">Support</div></div>
        </div>
      </div>
    </div>
  );
}
