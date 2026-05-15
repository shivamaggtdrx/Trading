import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTradeStore } from '../../store/useTradeStore';
import { Eye, EyeOff, TrendingUp, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { login, authLoading } = useTradeStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const result = await login(email, password);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-surface-2 flex flex-col justify-center items-center px-4">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <span className="text-2xl font-black text-text-primary">Stocks Lab</span>
      </div>

      <div className="w-full max-w-sm bg-surface rounded-2xl shadow-lg border border-border/30 p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary">Welcome Back</h2>
          <p className="text-sm text-text-muted mt-1">Please log in to continue to your dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label className="block text-sm font-bold text-text-secondary mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@email.com" className="w-full px-4 py-3 bg-surface-2 border border-border/50 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-text-secondary mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password" className="w-full px-4 py-3 bg-surface-2 border border-border/50 rounded-xl text-base focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none pr-10" required minLength={6} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted/60">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-xl px-4 py-3">{error}</div>
          )}

          <button type="submit" disabled={authLoading} className="w-full py-3 bg-blue-600 text-white font-bold text-base rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {authLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>Login<ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>

        {/* Features banner */}
        <div className="mt-6 pt-4 border-t border-border/30 flex justify-around text-center">
          <div><div className="text-lg font-black text-blue-600">0%</div><div className="text-base text-text-muted">Brokerage</div></div>
          <div><div className="text-lg font-black text-blue-600">100x</div><div className="text-base text-text-muted">Leverage</div></div>
          <div><div className="text-lg font-black text-blue-600">24/7</div><div className="text-base text-text-muted">Support</div></div>
        </div>
      </div>
    </div>
  );
}
