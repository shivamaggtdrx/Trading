import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Copy, Check, Users, Gift,
  Star, Loader2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useTradeStore } from '../../store/useTradeStore';
import { formatCurrency, cn } from '../../utils/helpers';
import { api } from '../../services/api';

const tiers = [
  { name: 'Bronze', min: 0, max: 5, commission: '10%', color: 'from-amber-600 to-amber-700' },
  { name: 'Silver', min: 5, max: 15, commission: '15%', color: 'from-slate-400 to-slate-500' },
  { name: 'Gold', min: 15, max: 50, commission: '20%', color: 'from-yellow-400 to-amber-500' },
  { name: 'Platinum', min: 50, max: Infinity, commission: '25%', color: 'from-cyan-400 to-blue-500' },
];

export default function Referral() {
  const navigate = useNavigate();
  const { user } = useTradeStore();
  const [copiedField, setCopiedField] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReferrals = async () => {
      try {
        const data = await api.getReferrals();
        setReferrals(data.referrals || []);
      } catch (err) {
        console.error('Failed to load referrals:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReferrals();
  }, []);

  const totalEarned = referrals.reduce((s, r) => s + (r.earned || 0), 0);
  const activeReferrals = referrals.filter(r => r.status === 'active').length;
  const currentTier = tiers.find(t => activeReferrals >= t.min && activeReferrals < t.max) || tiers[0];

  const handleCopy = (text, field) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const referralCode = user?.referralCode || user?.referral_code || '';
  const referralLink = `https://stockslab.com/register?ref=${referralCode}`;

  return (
    <div className="page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-3 py-2.5">
          <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-surface transition-colors touch-active-subtle">
            <ArrowLeft size={18} className="text-text-primary" />
          </button>
          <h1 className="text-base font-bold text-text-primary">Refer & Earn</h1>
        </div>
      </header>

      <div className="px-3 space-y-2.5 pb-3 pt-2">
        {/* Hero Card */}
        <Card padding="p-0" className="overflow-hidden">
          <div className="bg-gradient-to-br from-pink-500 via-rose-500 to-orange-500 p-4 text-white relative overflow-hidden">
            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/5 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-white/5 rounded-full" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Gift size={18} />
                <span className="text-base font-bold text-white/70 uppercase tracking-wider">Your Referral Code</span>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <p className="text-xl font-extrabold tracking-wider" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  {referralCode || '—'}
                </p>
                {referralCode && (
                  <button
                    onClick={() => handleCopy(referralCode, 'code')}
                    className="p-1.5 bg-white/15 rounded-lg hover:bg-white/25 transition-colors"
                  >
                    {copiedField === 'code' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                )}
              </div>
              <p className="text-base text-white/60">
                Earn up to <span className="font-bold text-white">25% commission</span> on every trade your referrals make
              </p>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-1.5">
          <Card padding="p-2.5">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Total Earned</p>
            <p className="text-sm font-extrabold text-emerald-600 tabular-nums mt-0.5" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
              {formatCurrency(totalEarned)}
            </p>
          </Card>
          <Card padding="p-2.5">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Referrals</p>
            <p className="text-sm font-extrabold text-text-primary tabular-nums mt-0.5">{activeReferrals} active</p>
          </Card>
          <Card padding="p-2.5">
            <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider">Tier</p>
            <p className="text-sm font-extrabold text-primary mt-0.5">{currentTier.name}</p>
          </Card>
        </div>

        {/* Share Link */}
        {referralCode && (
          <Card padding="p-3">
            <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1.5">Share Your Link</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-surface rounded-lg px-3 py-2 text-base text-text-secondary font-medium truncate" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {referralLink}
              </div>
              <button
                onClick={() => handleCopy(referralLink, 'link')}
                className={cn(
                  'px-3 py-2 rounded-lg text-base font-bold transition-all',
                  copiedField === 'link' ? 'bg-emerald-500 text-white' : 'bg-primary text-white'
                )}
              >
                {copiedField === 'link' ? '✓ Copied' : 'Copy'}
              </button>
            </div>
          </Card>
        )}

        {/* Commission Tiers */}
        <div>
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">Commission Tiers</h3>
          <div className="grid grid-cols-4 gap-1.5">
            {tiers.map((tier) => (
              <Card key={tier.name} padding="p-2" className={cn(
                'text-center border-2 transition-all',
                currentTier.name === tier.name ? 'border-primary/30 bg-primary/3' : 'border-transparent'
              )}>
                <div className={cn('w-6 h-6 mx-auto rounded-full bg-gradient-to-br flex items-center justify-center mb-1', tier.color)}>
                  <Star size={10} className="text-white" />
                </div>
                <p className="text-sm font-bold text-text-primary">{tier.name}</p>
                <p className="text-[11px] text-primary font-bold mt-0.5">{tier.commission}</p>
                <p className="text-[10px] text-text-muted">{tier.min}+ refs</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Referred Users */}
        <div>
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">
            Your Referrals ({referrals.length})
          </h3>
          {loading ? (
            <Card className="py-8 text-center">
              <Loader2 size={24} className="animate-spin mx-auto text-text-muted" />
              <p className="text-sm text-text-muted mt-2">Loading referrals...</p>
            </Card>
          ) : referrals.length > 0 ? (
            <Card padding="p-0">
              <div className="divide-y divide-border/20">
                {referrals.map((ref) => (
                  <div key={ref.id} className="px-3 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex items-center justify-center text-base font-bold text-slate-600">
                        {ref.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-bold text-text-primary">{ref.name}</p>
                        <p className="text-sm text-text-muted">Joined {ref.joined} · {ref.trades} trades</p>
                      </div>
                    </div>
                    <div className="text-right">
                      {ref.earned > 0 && (
                        <p className="text-base font-extrabold text-emerald-600 tabular-nums" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                          +{formatCurrency(ref.earned)}
                        </p>
                      )}
                      <Badge variant={ref.status === 'active' ? 'success' : 'warning'}>
                        {ref.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <Card className="py-8 text-center">
              <div className="w-12 h-12 bg-surface rounded-xl flex items-center justify-center mx-auto mb-2">
                <Users size={22} className="text-text-muted/50" />
              </div>
              <p className="text-sm font-semibold text-text-secondary">No Referrals Yet</p>
              <p className="text-base text-text-muted mt-0.5">Share your referral code to start earning!</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
