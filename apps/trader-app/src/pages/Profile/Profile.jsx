import { useNavigate } from 'react-router-dom';
import {
  User,
  CreditCard,
  Share2,
  Settings,
  HelpCircle,
  Shield,
  LogOut,
  ChevronRight,
  Copy,
  Check,
  FileText,
  Bell,
  Moon,
  Smartphone,
} from 'lucide-react';
import { useState } from 'react';
import Header from '../../components/layout/Header';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import { useTradeStore } from '../../store/useTradeStore';
import { cn } from '../../utils/helpers';

export default function Profile() {
  const { user } = useTradeStore();
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState(null);

  const handleCopy = (text, field) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: CreditCard, label: 'Funds & Withdrawals', subtitle: 'Manage your wallet', iconColor: 'from-blue-500/10 to-blue-600/10 text-blue-600', path: '/wallet' },
        { icon: FileText, label: 'Reports & Statements', subtitle: 'Download trade reports', iconColor: 'from-violet-500/10 to-purple-500/10 text-violet-600', path: '/reports' },
        { icon: Bell, label: 'Notifications', subtitle: 'Manage alerts & notifications', iconColor: 'from-amber-500/10 to-orange-500/10 text-amber-600', path: '/notifications' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: Settings, label: 'Trading Preferences', subtitle: 'Default order settings', iconColor: 'from-slate-500/10 to-gray-500/10 text-slate-600', path: '/preferences' },
        { icon: Smartphone, label: 'App Settings', subtitle: 'Appearance & behavior', iconColor: 'from-cyan-500/10 to-teal-500/10 text-cyan-600', path: '/preferences' },
        { icon: Shield, label: 'Security', subtitle: 'Password & 2FA', iconColor: 'from-emerald-500/10 to-green-500/10 text-emerald-600', path: '/security' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', subtitle: 'FAQs & contact us', iconColor: 'from-indigo-500/10 to-blue-500/10 text-indigo-600', path: '/help' },
        { icon: Share2, label: 'Refer & Earn', subtitle: 'Invite friends, earn rewards', iconColor: 'from-pink-500/10 to-rose-500/10 text-pink-600', path: '/referral' },
      ],
    },
  ];

  return (
    <div className="page-enter">
      <Header title="Profile" showNotification={false} compact />

      <div className="px-3 space-y-2.5 pb-3">
        {/* User Info Card */}
        <Card padding="p-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-blue-900 rounded-xl flex items-center justify-center text-white text-lg font-extrabold shadow-lg shadow-slate-800/20">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-bold text-text-primary">{user.name}</h2>
              <p className="text-[10px] text-text-muted mt-0.5 truncate">{user.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="success">
                  <Shield size={8} className="mr-1" />
                  KYC Verified
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Client ID & Referral */}
        <div className="grid grid-cols-2 gap-2">
          <Card padding="p-3">
            <p className="text-[8px] text-text-muted font-bold uppercase tracking-wider mb-1">Client ID</p>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {user.clientId}
              </p>
              <button
                onClick={() => handleCopy(user.clientId, 'clientId')}
                className="p-1 rounded-lg hover:bg-surface transition-colors touch-active-subtle"
              >
                {copiedField === 'clientId' ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <Copy size={12} className="text-text-muted" />
                )}
              </button>
            </div>
          </Card>
          <Card padding="p-3">
            <p className="text-[8px] text-text-muted font-bold uppercase tracking-wider mb-1">Referral Code</p>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {user.referralCode}
              </p>
              <button
                onClick={() => handleCopy(user.referralCode, 'referral')}
                className="p-1 rounded-lg hover:bg-surface transition-colors touch-active-subtle"
              >
                {copiedField === 'referral' ? (
                  <Check size={12} className="text-emerald-500" />
                ) : (
                  <Copy size={12} className="text-text-muted" />
                )}
              </button>
            </div>
          </Card>
        </div>

        {/* Menu Sections */}
        {menuSections.map((section) => (
          <div key={section.title}>
            <h3 className="text-[9px] font-bold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">
              {section.title}
            </h3>
            <Card padding="p-0">
              <div className="divide-y divide-border/20">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.label}
                      onClick={() => item.path && navigate(item.path)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-surface/30 active:bg-surface transition-colors touch-active-subtle"
                    >
                      <div className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br',
                        item.iconColor
                      )}>
                        <Icon size={15} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-xs font-semibold text-text-primary">{item.label}</p>
                        <p className="text-[9px] text-text-muted mt-0.5 truncate">{item.subtitle}</p>
                      </div>
                      <ChevronRight size={14} className="text-text-muted/50 flex-shrink-0" />
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>
        ))}

        {/* Logout */}
        <Card padding="p-0">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50/50 active:bg-red-50 transition-colors touch-active-subtle rounded-xl">
            <div className="w-8 h-8 bg-red-500/8 rounded-xl flex items-center justify-center">
              <LogOut size={15} className="text-red-500" strokeWidth={1.8} />
            </div>
            <span className="text-xs font-semibold text-red-500">Sign Out</span>
          </button>
        </Card>

        {/* App Version */}
        <p className="text-center text-[9px] text-text-muted/60 py-1">
          TradeX v1.0.0 · Built for traders
        </p>
      </div>
    </div>
  );
}
