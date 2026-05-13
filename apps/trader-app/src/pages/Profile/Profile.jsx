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
  const { user, logout } = useTradeStore();
  const navigate = useNavigate();
  const [copiedField, setCopiedField] = useState(null);

  const userName = user?.name || user?.full_name || 'User';
  const userEmail = user?.email || '';
  const clientId = user?.clientId || user?.client_id || '';
  const referralCode = user?.referralCode || user?.referral_code || '';

  const handleCopy = (text, field) => {
    navigator.clipboard?.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const menuSections = [
    {
      title: 'Account',
      items: [
        { icon: CreditCard, label: 'Funds & Withdrawals', subtitle: 'Manage your wallet', iconColor: 'bg-blue-50 text-blue-600', path: '/wallet' },
        { icon: FileText, label: 'Reports & Statements', subtitle: 'Download trade reports', iconColor: 'bg-violet-50 text-violet-600', path: '/reports' },
        { icon: Bell, label: 'Notifications', subtitle: 'Manage alerts & notifications', iconColor: 'bg-amber-50 text-amber-600', path: '/notifications' },
      ],
    },
    {
      title: 'Settings',
      items: [
        { icon: Settings, label: 'Trading Preferences', subtitle: 'Default order settings', iconColor: 'bg-slate-100 text-slate-600', path: '/preferences' },
        { icon: Smartphone, label: 'App Settings', subtitle: 'Appearance & behavior', iconColor: 'bg-cyan-50 text-cyan-600', path: '/preferences' },
        { icon: Shield, label: 'Security', subtitle: 'Password & 2FA', iconColor: 'bg-emerald-50 text-emerald-600', path: '/security' },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & Support', subtitle: 'FAQs & contact us', iconColor: 'bg-indigo-50 text-indigo-600', path: '/help' },
        { icon: Share2, label: 'Refer & Earn', subtitle: 'Invite friends, earn rewards', iconColor: 'bg-pink-50 text-pink-600', path: '/referral' },
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
            <div className="w-14 h-14 bg-primary rounded-lg flex items-center justify-center text-white text-xl font-bold">
              {userName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-text-primary">{userName}</h2>
              <p className="text-base text-text-muted mt-0.5 truncate">{userEmail}</p>
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
            <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Client ID</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {clientId}
              </p>
              <button
                onClick={() => handleCopy(clientId, 'clientId')}
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
            <p className="text-[11px] text-text-muted font-bold uppercase tracking-wider mb-1">Referral Code</p>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-primary" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                {referralCode}
              </p>
              <button
                onClick={() => handleCopy(referralCode, 'referral')}
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
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">
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
                        'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                        item.iconColor
                      )}>
                        <Icon size={15} strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-sm font-semibold text-text-primary">{item.label}</p>
                        <p className="text-sm text-text-muted mt-0.5 truncate">{item.subtitle}</p>
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
          <button onClick={() => { logout(); navigate('/login'); }} className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-50/50 active:bg-red-50 transition-colors touch-active-subtle rounded-xl">
            <div className="w-8 h-8 bg-red-500/8 rounded-xl flex items-center justify-center">
              <LogOut size={15} className="text-red-500" strokeWidth={1.8} />
            </div>
            <span className="text-sm font-semibold text-red-500">Sign Out</span>
          </button>
        </Card>

        {/* App Version */}
        <p className="text-center text-sm text-text-muted/60 py-1">
          TradeX v1.0.0 · Built for traders
        </p>
      </div>
    </div>
  );
}
