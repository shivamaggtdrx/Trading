import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building,
  User,
  CreditCard,
  Hash,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { api } from '../../services/api';
import { cn } from '../../utils/helpers';

export default function BankAccounts() {
  const navigate = useNavigate();
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null); // stores account ID being deleted
  
  // Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: ''
  });
  
  // Alerts
  const [alert, setAlert] = useState(null);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.getBankAccounts();
      setBankAccounts(res.bankAccounts || []);
    } catch (err) {
      console.error(err);
      showAlert('error', err.message || 'Failed to load bank accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBankAccounts();
  }, []);

  const showAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleInputChange = (field, val) => {
    setForm(prev => ({ ...prev, [field]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bank_name.trim() || !form.account_holder_name.trim() || !form.account_number.trim() || !form.ifsc_code.trim()) {
      showAlert('error', 'All fields are required');
      return;
    }

    setSubmitLoading(true);
    try {
      const res = await api.addBankAccount({
        bank_name: form.bank_name.trim(),
        account_holder_name: form.account_holder_name.trim(),
        account_number: form.account_number.trim(),
        ifsc_code: form.ifsc_code.trim().toUpperCase()
      });
      
      showAlert('success', 'Bank account added successfully');
      setShowAddModal(false);
      setForm({
        bank_name: '',
        account_holder_name: '',
        account_number: '',
        ifsc_code: ''
      });
      fetchBankAccounts();
    } catch (err) {
      console.error(err);
      showAlert('error', err.message || 'Failed to add bank account');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this bank account?')) {
      return;
    }
    
    setDeleteLoading(id);
    try {
      await api.deleteBankAccount(id);
      showAlert('success', 'Bank account deleted successfully');
      fetchBankAccounts();
    } catch (err) {
      console.error(err);
      showAlert('error', err.message || 'Failed to delete bank account');
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="page-enter">
      {/* Header */}
      <header className="sticky top-0 z-30 glass-heavy safe-top border-b border-border/30">
        <div className="max-w-lg mx-auto flex items-center justify-between px-3 py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-1 rounded-lg hover:bg-surface transition-colors touch-active-subtle">
              <ArrowLeft size={18} className="text-text-primary" />
            </button>
            <h1 className="text-base font-bold text-text-primary">Bank Accounts</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg hover:bg-primary/20 transition-all font-semibold flex items-center gap-1 text-xs"
          >
            <Plus size={14} /> Add Account
          </button>
        </div>
      </header>

      <div className="px-3 space-y-3 pb-6 pt-2 max-w-lg mx-auto">
        {/* Alerts banner */}
        {alert && (
          <div className={cn(
            'flex items-start gap-2.5 rounded-xl p-3 border text-xs font-semibold animate-pulse',
            alert.type === 'success' ? 'bg-emerald-950/20 border-emerald-900/30 text-emerald-400' : 'bg-red-950/20 border-red-900/30 text-red-400'
          )}>
            {alert.type === 'success' ? <CheckCircle2 size={15} className="mt-0.5" /> : <AlertCircle size={15} className="mt-0.5" />}
            <span>{alert.message}</span>
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-text-muted">
            <Loader className="w-8 h-8 animate-spin text-primary" />
            <p className="text-xs font-bold mt-2">Loading accounts...</p>
          </div>
        ) : bankAccounts.length === 0 ? (
          /* Empty State */
          <div className="text-center py-16 px-4 bg-surface-2 rounded-2xl border border-border/40">
            <div className="w-12 h-12 bg-surface-3 rounded-full flex items-center justify-center mx-auto mb-3 text-text-muted">
              <Building size={22} />
            </div>
            <h3 className="text-sm font-bold text-text-primary">No Bank Accounts Found</h3>
            <p className="text-xs text-text-muted mt-1 max-w-xs mx-auto">
              Please add a bank account. Saved bank accounts will be available for quick withdrawal selection.
            </p>
            <Button
              variant="outline-primary"
              size="sm"
              className="mt-4"
              onClick={() => setShowAddModal(true)}
            >
              <Plus size={14} className="mr-1.5" /> Add Bank Account
            </Button>
          </div>
        ) : (
          /* Saved Accounts List */
          <div className="space-y-2.5">
            <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider px-0.5">Your Saved Accounts</h3>
            
            {bankAccounts.map((acc) => (
              <Card key={acc.id} padding="p-4" className="relative border-border/50 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-surface-3 border border-border/30 flex items-center justify-center text-primary flex-shrink-0">
                      <Building size={16} />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-text-primary truncate">{acc.bank_name}</h4>
                      <p className="text-xs text-text-muted mt-0.5 truncate flex items-center gap-1">
                        <User size={11} className="text-text-muted/60" />
                        {acc.account_holder_name}
                      </p>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs font-mono font-bold">
                        <div className="flex items-center gap-1 text-text-primary">
                          <CreditCard size={12} className="text-text-muted/60" />
                          <span>A/C: {acc.account_number}</span>
                        </div>
                        <div className="flex items-center gap-1 text-text-secondary">
                          <Hash size={12} className="text-text-muted/60" />
                          <span>IFSC: {acc.ifsc_code}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDelete(acc.id)}
                    disabled={deleteLoading === acc.id}
                    className="p-2 text-text-muted hover:text-danger rounded-lg hover:bg-red-500/5 transition-colors border border-transparent hover:border-red-500/10 flex-shrink-0 self-center"
                  >
                    {deleteLoading === acc.id ? (
                      <Loader size={14} className="animate-spin text-danger" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add Bank Account Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => !submitLoading && setShowAddModal(false)}
        title="Add Bank Account"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Bank Name"
            placeholder="e.g. HDFC Bank"
            value={form.bank_name}
            onChange={(e) => handleInputChange('bank_name', e.target.value)}
            disabled={submitLoading}
            compact
            required
          />
          <Input
            label="Account Holder Name"
            placeholder="Name as in bank record"
            value={form.account_holder_name}
            onChange={(e) => handleInputChange('account_holder_name', e.target.value)}
            disabled={submitLoading}
            compact
            required
          />
          <Input
            label="Account Number"
            type="text"
            placeholder="Enter bank account number"
            value={form.account_number}
            onChange={(e) => handleInputChange('account_number', e.target.value.replace(/\D/g, ''))}
            disabled={submitLoading}
            compact
            required
          />
          <Input
            label="IFSC Code"
            placeholder="11-digit IFSC code"
            value={form.ifsc_code}
            onChange={(e) => handleInputChange('ifsc_code', e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
            disabled={submitLoading}
            compact
            required
          />
          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              fullWidth
              size="md"
              onClick={() => setShowAddModal(false)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="md"
              disabled={submitLoading}
            >
              {submitLoading ? 'Saving...' : 'Save Account'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
