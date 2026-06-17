import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Shield, Lock, Key, Eye, EyeOff,
  ToggleLeft, ToggleRight, AlertTriangle, CheckCircle2,
  Fingerprint, Loader2,
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { cn } from '../../utils/helpers';
import { api } from '../../services/api';

export default function Security() {
  const navigate = useNavigate();
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [biometric, setBiometric] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Password change state
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState(null);
  const [pwSuccess, setPwSuccess] = useState(false);

  const handlePasswordChange = async () => {
    setPwError(null);
    setPwSuccess(false);

    if (!currentPw || !newPw || !confirmPw) {
      setPwError('All fields are required');
      return;
    }
    if (newPw.length < 8) {
      setPwError('New password must be at least 8 characters');
      return;
    }
    if (newPw !== confirmPw) {
      setPwError('Passwords do not match');
      return;
    }

    setPwLoading(true);
    try {
      await api.changePassword(currentPw, newPw);
      setPwSuccess(true);
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPwSuccess(false);
      }, 2000);
    } catch (err) {
      setPwError(err.message || 'Failed to change password');
    } finally {
      setPwLoading(false);
    }
  };

  const securityScore = twoFA ? 100 : biometric ? 75 : 50;
  const scoreLabel = securityScore >= 90 ? 'Excellent' : securityScore >= 70 ? 'Good' : 'Fair';

  return (
    <div className="">
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
          <div className={cn(
            "p-4 text-white relative overflow-hidden transition-colors",
            securityScore >= 90 ? "bg-gradient-to-r from-emerald-500 to-emerald-600" :
            securityScore >= 70 ? "bg-gradient-to-r from-emerald-500 to-emerald-600" :
            "bg-gradient-to-r from-amber-500 to-amber-600"
          )}>
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Shield size={16} />
                  <span className="text-base font-bold text-white/70 uppercase tracking-wider">Security Score</span>
                </div>
                <p className="text-2xl font-extrabold">{scoreLabel}</p>
                <p className="text-base text-white/60 mt-0.5">
                  {!twoFA ? 'Enable 2FA to improve your security score' : 'Your account is well protected'}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full border-3 border-white/30 flex items-center justify-center">
                <span className="text-lg font-extrabold">{securityScore}</span>
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
                onClick={() => { setShowPasswordModal(true); setPwError(null); setPwSuccess(false); }}
                className="w-full flex items-center gap-3 px-3 py-3 hover:bg-surface/30 transition-colors touch-active-subtle"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Lock size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-base font-semibold text-text-primary">Change Password</p>
                  <p className="text-sm text-text-muted mt-0.5">Keep your account secure</p>
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

        {/* Security Tips */}
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200/50 rounded-lg p-2.5">
          <AlertTriangle size={14} className="text-amber-600 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-base font-bold text-amber-700">Security Tips</p>
            <ul className="text-sm text-amber-600 mt-1 space-y-0.5">
              <li>• Never share your password or OTP with anyone</li>
              <li>• Enable 2FA for enhanced account protection</li>
              <li>• Use a strong password with at least 8 characters</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal isOpen={showPasswordModal} onClose={() => setShowPasswordModal(false)} title="Change Password">
        <div className="space-y-3">
          {pwSuccess && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200/50 rounded-lg p-2.5">
              <CheckCircle2 size={14} className="text-emerald-600" />
              <p className="text-sm font-bold text-emerald-700">Password updated successfully!</p>
            </div>
          )}
          {pwError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200/50 rounded-lg p-2.5">
              <AlertTriangle size={14} className="text-red-600" />
              <p className="text-sm font-bold text-red-700">{pwError}</p>
            </div>
          )}
          <div>
            <label className="block text-base font-bold text-text-muted uppercase tracking-wider mb-1">Current Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Enter current password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full bg-surface border border-border/50 rounded-xl px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all pr-10"
              />
              <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2">
                {showPassword ? <EyeOff size={16} className="text-text-muted" /> : <Eye size={16} className="text-text-muted" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-base font-bold text-text-muted uppercase tracking-wider mb-1">New Password</label>
            <input
              type="password"
              placeholder="Enter new password (min 8 chars)"
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              className="w-full bg-surface border border-border/50 rounded-xl px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
            />
          </div>
          <div>
            <label className="block text-base font-bold text-text-muted uppercase tracking-wider mb-1">Confirm New Password</label>
            <input
              type="password"
              placeholder="Re-enter new password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full bg-surface border border-border/50 rounded-xl px-3 py-2.5 text-base text-text-primary placeholder:text-text-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/15 focus:border-primary/40 transition-all"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" fullWidth size="md" onClick={() => setShowPasswordModal(false)}>Cancel</Button>
            <Button
              variant="primary"
              fullWidth
              size="md"
              onClick={handlePasswordChange}
              disabled={pwLoading}
            >
              {pwLoading ? <Loader2 size={16} className="animate-spin" /> : 'Update Password'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
