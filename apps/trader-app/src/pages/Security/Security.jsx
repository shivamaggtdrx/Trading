import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Lock, Smartphone, Key, Eye, EyeOff,
  ToggleLeft, ToggleRight, CheckCircle2, AlertTriangle, Clock,
  Fingerprint, Monitor, LogOut,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { cn } from '../../utils/helpers';

const mockSessions = [
  { id: 1, device: 'iPhone 15 Pro', browser: 'Safari', ip: '103.48.xx.xx', location: 'Mumbai, IN', current: true, lastActive: 'Now' },
  { id: 2, device: 'Windows PC', browser: 'Chrome', ip: '49.36.xx.xx', location: 'Delhi, IN', current: false, lastActive: '2 hours ago' },
];

export default function Security() {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center gap-3 px-3 py-2.5">
          <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-surface transition-colors touch-active-subtle">
            <ArrowLeft size={18} className="text-text-primary" />
          </button>
          <h1 className="text-base font-bold text-text-primary">Security</h1>
        </div>
      </header>

      <div className="px-3 space-y-2.5 pb-3 pt-2">
        {/* Security Score */}
        <Card padding="p-0" className="overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 text-white relative overflow-hidden">
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={16} />
                  <span className="text-base font-bold text-white/70 uppercase tracking-wider">Security Score</span>
                </div>
                <p className="text-2xl font-extrabold">Good</p>
                <p className="text-base text-white/60 mt-0.5">Enable 2FA to improve your security score</p>
              </div>
              <div className="w-14 h-14 rounded-full border-3 border-white/30 flex items-center justify-center">
                <span className="text-lg font-extrabold">75</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Password */}
        <div>
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">Authentication</h3>
          <Card padding="p-0">
            <div className="divide-y divide-border/20">
              {/* Change Password */}
              <button
                onClick={() => setShowPasswordModal(true)}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-surface/30 transition-colors touch-active-subtle"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Lock size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-semibold text-text-primary">Change Password</p>
                  <p className="text-sm text-text-muted mt-0.5">Last changed 30 days ago</p>
                </div>
                <Badge variant="warning">Update</Badge>
              </button>

              {/* 2FA */}
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Key size={14} className="text-violet-600" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-text-primary">Two-Factor Authentication</p>
                  <p className="text-sm text-text-muted mt-0.5">Adds an extra layer of security</p>
                </div>
                <button onClick={() => setTwoFA(!twoFA)} className="touch-active-subtle">
                  {twoFA ? (
                    <ToggleRight size={28} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={28} className="text-text-muted/40" />
                  )}
                </button>
              </div>

              {/* Biometric */}
              <div className="flex items-center gap-3 px-3 py-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Fingerprint size={14} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-base font-semibold text-text-primary">Biometric Login</p>
                  <p className="text-sm text-text-muted mt-0.5">Use fingerprint or Face ID</p>
                </div>
                <button onClick={() => setBiometric(!biometric)} className="touch-active-subtle">
                  {biometric ? (
                    <ToggleRight size={28} className="text-emerald-500" />
                  ) : (
                    <ToggleLeft size={28} className="text-text-muted/40" />
                  )}
                </button>
              </div>
            </div>
          </Card>
        </div>

        {/* Active Sessions */}
        <div>
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-1.5 px-0.5">Active Sessions</h3>
          <Card padding="p-0">
            <div className="divide-y divide-border/20">
              {mockSessions.map(session => (
                <div key={session.id} className="px-3 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center">
                      {session.device.includes('iPhone') ? (
                        <Smartphone size={14} className="text-text-muted" />
                      ) : (
                        <Monitor size={14} className="text-text-muted" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-base font-bold text-text-primary">{session.device}</p>
                        {session.current && (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">THIS DEVICE</span>
                        )}
                      </div>
                      <p className="text-sm text-text-muted mt-0.5">
                        {session.browser} · {session.location} · {session.lastActive}
                      </p>
                    </div>
                  </div>
                  {!session.current && (
                    <button className="p-1.5 rounded-lg hover:bg-red-50 transition-colors touch-active-subtle">
                      <LogOut size={14} className="text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Security Tips */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200/50 rounded-lg p-2.5">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-base font-bold text-amber-700">Security Tips</p>
            <ul className="text-sm text-amber-600 mt-1 space-y-0.5">
              <li>• Never share your password or OTP with anyone</li>
              <li>• Enable 2FA for enhanced account protection</li>
              <li>• Regularly review your active sessions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
        <div className="space-y-3">
          <div>
            <label className="block text-base font-bold text-text-muted uppercase tracking-wider mb-1">Current Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} placeholder="Enter current password"
                className="w-full bg-surface border border-border/50 rounded-xl px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all pr-10" />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff size={16} className="text-text-muted" /> : <Eye size={16} className="text-text-muted" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-base font-bold text-text-muted uppercase tracking-wider mb-1">New Password</label>
            <input type="password" placeholder="Enter new password"
              className="w-full bg-surface border border-border/50 rounded-xl px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all" />
          </div>
          <div>
            <label className="block text-base font-bold text-text-muted uppercase tracking-wider mb-1">Confirm New Password</label>
            <input type="password" placeholder="Re-enter new password"
              className="w-full bg-surface border border-border/50 rounded-xl px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all" />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" fullWidth size="md" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
            <Button variant="primary" fullWidth size="md">Update Password</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
