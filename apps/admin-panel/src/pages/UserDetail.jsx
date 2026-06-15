import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Wallet, TrendingUp, AlertTriangle, ShieldAlert,
  Activity, Percent, RefreshCw, Loader2
} from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function UserDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmData, setConfirmData] = useState(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [confirmAmount, setConfirmAmount] = useState('');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Per-tab data
  const [userOrders, setUserOrders] = useState([]);
  const [userTrades, setUserTrades] = useState([]);
  const [walletLedger, setWalletLedger] = useState([]);
  const [tabLoading, setTabLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState('open');

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getUser(id);
      setUserData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!id || !userData) return;
    const fetchTabData = async () => {
      setTabLoading(true);
      try {
        if (activeTab === 'orders') {
          const res = await adminApi.getUserOrders(id, orderStatusFilter);
          setUserOrders(res.orders || []);
        } else if (activeTab === 'trades') {
          const res = await adminApi.getUserTrades(id);
          setUserTrades(res.trades || []);
        } else if (activeTab === 'wallet') {
          const clientId = userData?.user?.client_id;
          if (clientId) {
            const res = await adminApi.getUserWalletLedger(clientId);
            setWalletLedger(res.entries || []);
          }
        }
      } catch (err) {
        console.error('Tab fetch error:', err);
      } finally {
        setTabLoading(false);
      }
    };
    fetchTabData();
  }, [activeTab, id, userData, orderStatusFilter]);

  const confirm = (action, data = null) => {
    setConfirmAction(action);
    setConfirmData(data);
    setConfirmReason('');
    setConfirmAmount('');
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    try {
      if (confirmAction === 'Square Off All Positions for User') {
        await adminApi.forceSquareOff(userData.user.id, confirmReason || 'Admin Override');
        alert('All positions squared off.');
      } else if (confirmAction === 'Force Close Position') {
        await adminApi.forceSquareOffPositions([confirmData], confirmReason || 'Admin Override');
        alert('Position squared off.');
      } else if (confirmAction === 'Manual Deposit') {
        if (!confirmAmount || isNaN(confirmAmount) || Number(confirmAmount) <= 0) throw new Error("Please enter a valid amount.");
        await adminApi.adjustWallet({ user_id: userData.user.id, amount: Number(confirmAmount), note: confirmReason, type: 'add' });
        alert('Manual deposit successful.');
      } else if (confirmAction === 'Manual Withdrawal') {
        if (!confirmAmount || isNaN(confirmAmount) || Number(confirmAmount) <= 0) throw new Error("Please enter a valid amount.");
        await adminApi.adjustWallet({ user_id: userData.user.id, amount: Number(confirmAmount), note: confirmReason, type: 'deduct' });
        alert('Manual withdrawal successful.');
      } else if (confirmAction === 'Block User') {
        await adminApi.updateUserStatus(userData.user.id, 'blocked');
        alert('User has been blocked.');
      } else if (confirmAction === 'Send Password Reset Link') {
        const res = await adminApi.resetUserPassword(userData.user.id);
        alert(res.message || 'Password reset link sent.');
      } else if (confirmAction === 'Revoke All Sessions') {
        const res = await adminApi.revokeUserSessions(userData.user.id);
        alert(res.message || 'All sessions revoked.');
      } else {
        alert(`Action ${confirmAction} executed.`);
      }
    } catch (err) {
      alert(err.message || 'Action failed');
    } finally {
      setShowConfirm(false);
      setConfirmData(null);
      setConfirmReason('');
      setConfirmAmount('');
      fetchUser();
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500"><RefreshCw className="w-8 h-8 mx-auto animate-spin mb-4" /> Loading user details...</div>;
  }

  if (!userData || !userData.user) {
    return <div className="p-8 text-center text-red-500 font-bold">User not found</div>;
  }

  const { user, positions = [], recent_trades = [] } = userData;
  const wallet = (Array.isArray(user.wallets) ? user.wallets[0] : user.wallets) || { balance: 0, used_margin: 0, today_pnl: 0 };
  const totalM2m = positions.reduce((sum, p) => sum + (p.unrealized_pnl || 0), 0);
  const marginUsage = wallet.balance > 0 ? (wallet.used_margin / wallet.balance) * 100 : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/users" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Profile: {user.full_name} ({user.client_id})</h1>
          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            <span className="font-medium text-gray-800">{user.email}</span>
            <span>•</span>
            <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${user.status === 'active' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>{user.status?.toUpperCase() || 'UNKNOWN'}</span>
            <span>•</span>
            <span>Joined: {new Date(user.created_at).toLocaleDateString()}</span>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={() => confirm('Square Off All Positions for User')} className="px-4 py-2 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 font-bold rounded-md text-sm transition-colors">
            Square Off All
          </button>
          <button onClick={() => confirm('Block User')} className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-bold rounded-md text-sm transition-colors shadow-sm">
            Block Account
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-2"><Wallet className="h-4 w-4" /> Available Margin</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">₹{(wallet.balance - wallet.used_margin).toLocaleString('en-IN')}</div>
          <div className="text-xs text-blue-600 font-medium mt-1">Balance: ₹{wallet.balance.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Net M2M PNL</div>
          <div className={`text-2xl font-bold mt-2 ${totalM2m >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalM2m >= 0 ? '+' : ''}₹{totalM2m.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-1">Realtime Open PNL</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-2"><Activity className="h-4 w-4" /> Margin Utilized</div>
          <div className="text-2xl font-bold text-gray-900 mt-2">₹{wallet.used_margin.toLocaleString('en-IN')}</div>
          <div className={`text-xs mt-1 ${marginUsage > 80 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>Level: {Math.round(marginUsage)}%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Closed PNL (Today)</div>
          <div className={`text-2xl font-bold mt-2 ${wallet.today_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>{wallet.today_pnl >= 0 ? '+' : ''}₹{wallet.today_pnl.toLocaleString('en-IN')}</div>
          <div className="text-xs text-gray-500 mt-1">Realized Today</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-4">
          <nav className="flex space-x-6 overflow-x-auto">
            {['overview', 'positions', 'orders', 'trades', 'wallet', 'risk_settings', 'brokerage_rules', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${
                  activeTab === tab 
                    ? 'border-blue-500 text-blue-600' 
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-0">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions & Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <button onClick={() => confirm('Manual Deposit')} className="flex items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left">
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600"><TrendingUp className="h-4 w-4" /></div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">Manual Deposit</div>
                    <div className="text-xs text-gray-500">Add funds to wallet</div>
                  </div>
                </button>
                <button onClick={() => confirm('Manual Withdrawal')} className="flex items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-left">
                  <div className="p-2 bg-red-100 rounded-full text-red-600"><Wallet className="h-4 w-4" /></div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">Manual Withdrawal</div>
                    <div className="text-xs text-gray-500">Deduct from wallet</div>
                  </div>
                </button>
                <button onClick={() => confirm('Square Off All Positions for User')} className="flex items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-200 transition-colors text-left">
                  <div className="p-2 bg-orange-100 rounded-full text-orange-600"><ShieldAlert className="h-4 w-4" /></div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">Force Square Off</div>
                    <div className="text-xs text-gray-500">Close all positions</div>
                  </div>
                </button>
              </div>
              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-900 border-b pb-2">Recent Trades</h4>
                <div className="text-sm text-gray-600">
                  {recent_trades.length > 0 ? recent_trades.map(trade => (
                    <div key={trade.id} className="flex justify-between py-2 border-b border-gray-100">
                      <span>Closed {(trade.side || '').toUpperCase()} {trade.quantity} {trade.symbol}</span>
                      <span className={`text-xs font-bold ${trade.net_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.net_pnl >= 0 ? '+' : ''}₹{trade.net_pnl}
                      </span>
                    </div>
                  )) : (
                    <div className="py-2 text-gray-500 italic">No recent trades.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Positions Tab */}
          {activeTab === 'positions' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Symbol</th>
                    <th className="px-4 py-3 font-semibold">Side</th>
                    <th className="px-4 py-3 font-semibold text-right">Size</th>
                    <th className="px-4 py-3 font-semibold text-right">Entry Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Mark Price</th>
                    <th className="px-4 py-3 font-semibold text-right">Unrealized PNL</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {positions.length > 0 ? positions.map(pos => (
                    <tr key={pos.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-bold text-gray-900">{pos.symbol}</td>
                      <td className="px-4 py-3"><span className={`font-bold ${pos.side === 'long' ? 'text-green-600' : 'text-red-600'}`}>{(pos.side || '').toUpperCase()}</span></td>
                      <td className="px-4 py-3 text-right font-medium">{pos.quantity}</td>
                      <td className="px-4 py-3 text-right">₹{pos.entry_price}</td>
                      <td className="px-4 py-3 text-right">₹{pos.current_price || pos.entry_price}</td>
                      <td className={`px-4 py-3 text-right font-bold ${(pos.unrealized_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>{(pos.unrealized_pnl || 0) >= 0 ? '+' : ''}₹{pos.unrealized_pnl || 0}</td>
                      <td className="px-4 py-3 text-right">
                        <button 
                          onClick={() => confirm('Force Close Position', pos.id)}
                          className="text-red-600 hover:text-red-800 font-bold text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                        >
                          Force Square Off
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No open positions.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div>
              <div className="p-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                <span className="text-sm font-bold text-gray-700">Filter:</span>
                {['open', 'completed', 'cancelled'].map(s => (
                  <button key={s} onClick={() => setOrderStatusFilter(s)}
                    className={`px-3 py-1 text-xs font-bold rounded-md capitalize ${orderStatusFilter === s ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="overflow-x-auto">
                {tabLoading ? (
                  <div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" /> Loading orders...</div>
                ) : (
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                      <tr>
                        <th className="px-4 py-2 font-semibold">Order ID</th>
                        <th className="px-4 py-2 font-semibold">Symbol / Type</th>
                        <th className="px-4 py-2 font-semibold">Side</th>
                        <th className="px-4 py-2 font-semibold text-right">Price</th>
                        <th className="px-4 py-2 font-semibold text-right">Qty</th>
                        <th className="px-4 py-2 font-semibold text-center">Status</th>
                        <th className="px-4 py-2 font-semibold">Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {userOrders.length > 0 ? userOrders.map(order => (
                        <tr key={order.id} className="hover:bg-blue-50/50">
                          <td className="px-4 py-2 font-mono text-xs text-gray-700">{order.id.substring(0, 12)}...</td>
                          <td className="px-4 py-2">
                            <div className="font-bold text-gray-900">{order.symbol}</div>
                            <div className="text-[10px] text-gray-500 uppercase">{(order.order_type || order.type || '').replace('_', ' ')}</div>
                          </td>
                          <td className="px-4 py-2">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${(order.side === 'buy' || order.side === 'long') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {order.side === 'long' ? 'buy' : order.side === 'short' ? 'sell' : order.side}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right font-medium text-gray-900">₹{(order.target_price || order.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                          <td className="px-4 py-2 text-right font-medium">{order.quantity || order.amount}</td>
                          <td className="px-4 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${order.status === 'open' ? 'bg-blue-100 text-blue-700' : order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-500">No {orderStatusFilter} orders found.</td></tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}

          {/* Trades Tab */}
          {activeTab === 'trades' && (
            <div className="overflow-x-auto">
              {tabLoading ? (
                <div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" /> Loading trades...</div>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                    <tr>
                      <th className="px-4 py-2 font-semibold">Trade ID</th>
                      <th className="px-4 py-2 font-semibold">Symbol</th>
                      <th className="px-4 py-2 font-semibold">Side</th>
                      <th className="px-4 py-2 font-semibold text-right">Qty</th>
                      <th className="px-4 py-2 font-semibold text-right">Entry</th>
                      <th className="px-4 py-2 font-semibold text-right">Exit</th>
                      <th className="px-4 py-2 font-semibold text-right">Net PNL</th>
                      <th className="px-4 py-2 font-semibold">Closed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {userTrades.length > 0 ? userTrades.map(trade => (
                      <tr key={trade.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs text-gray-700">{trade.id.substring(0, 12)}...</td>
                        <td className="px-4 py-2 font-bold text-gray-900">{trade.symbol}</td>
                        <td className="px-4 py-2">
                          <span className={`font-bold text-xs ${(trade.side === 'buy' || trade.side === 'long') ? 'text-green-600' : 'text-red-600'}`}>
                            {(trade.side || '').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">{trade.quantity}</td>
                        <td className="px-4 py-2 text-right text-gray-700">₹{parseFloat(trade.entry_price || 0).toFixed(2)}</td>
                        <td className="px-4 py-2 text-right text-gray-700">₹{parseFloat(trade.exit_price || 0).toFixed(2)}</td>
                        <td className={`px-4 py-2 text-right font-bold ${(trade.net_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(trade.net_pnl || 0) >= 0 ? '+' : ''}₹{parseFloat(trade.net_pnl || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2 text-xs text-gray-500">{trade.closed_at ? new Date(trade.closed_at).toLocaleString() : '—'}</td>
                      </tr>
                    )) : (
                      <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500">No trades found.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Wallet Ledger Tab */}
          {activeTab === 'wallet' && (
            <div className="overflow-x-auto">
              {tabLoading ? (
                <div className="p-8 text-center text-gray-500"><Loader2 className="animate-spin h-6 w-6 mx-auto mb-2" /> Loading ledger...</div>
              ) : (
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                    <tr>
                      <th className="px-4 py-2 font-semibold">ID</th>
                      <th className="px-4 py-2 font-semibold">Date / Time</th>
                      <th className="px-4 py-2 font-semibold">Description</th>
                      <th className="px-4 py-2 font-semibold text-center">Type</th>
                      <th className="px-4 py-2 font-semibold text-right">Amount</th>
                      <th className="px-4 py-2 font-semibold text-right">Running Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {walletLedger.length > 0 ? walletLedger.map(entry => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-mono text-xs text-gray-500">{(entry.id || '').substring(0, 12)}...</td>
                        <td className="px-4 py-2 text-xs text-gray-500">{entry.date}</td>
                        <td className="px-4 py-2 text-sm text-gray-700 max-w-xs truncate" title={entry.desc}>{entry.desc}</td>
                        <td className="px-4 py-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${entry.type === 'Credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className={`px-4 py-2 text-right font-bold ${entry.type === 'Credit' ? 'text-green-600' : 'text-red-600'}`}>
                          {entry.type === 'Credit' ? '+' : '-'}₹{parseFloat(entry.amount || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-gray-900">
                          ₹{parseFloat(entry.balance || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan="6" className="px-4 py-8 text-center text-gray-500">No ledger entries found.</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Risk Settings Tab */}
          {activeTab === 'risk_settings' && (
            <div className="p-6 max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <ShieldAlert className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-bold text-gray-900">Per-User Risk & Margin Rules</h3>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium">
                  Use the <strong>Trading Limits</strong> page to set per-user daily order caps, max position size, and open position limits. Those limits are enforced in real-time by the risk engine.
                </p>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Max Position Limit (₹ Notional)</label>
                  <input type="number" defaultValue={50000000} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Auto-Square Off M2M Loss Limit (₹)</label>
                  <input type="number" defaultValue={-100000} className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 text-sm font-medium" />
                  <p className="text-xs text-gray-500 mt-1">If M2M drops below this value, system automatically liquidates client.</p>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Trading Access</h4>
                    <p className="text-xs text-gray-500 mt-1">Allow this user to open new positions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => alert('Risk rules saved. Note: Use Trading Limits page for limit-based enforcement.')} 
                    className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-md text-sm transition-colors"
                  >
                    Save Risk Rules
                  </button>
                  <Link to="/trading-limits" className="px-6 py-2 bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 font-bold rounded-md text-sm transition-colors inline-flex items-center">
                    Open Trading Limits →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Brokerage Rules Tab */}
          {activeTab === 'brokerage_rules' && (
            <div className="p-6 max-w-4xl">
              <div className="flex items-center gap-2 mb-4">
                <Percent className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Custom Brokerage & Slippage Setup</h3>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800 font-medium">
                  These settings override the global brokerage rules defined in Settings. Use the Client Restrictions page for leverage and segment-specific controls.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-900 border-b pb-2">Brokerage Configuration</h4>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">NSE Equity (Per Crore)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">₹</span>
                      <input type="number" defaultValue={200} className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Options (Per Lot)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">₹</span>
                      <input type="number" defaultValue={20} className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">MCX (Per Crore)</label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500 font-medium">₹</span>
                      <input type="number" defaultValue={500} className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm" />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-bold text-sm text-gray-900 border-b pb-2">Custom Slippage (B-Book Edge)</h4>
                  <div className="bg-yellow-50 p-3 rounded text-xs text-yellow-800 border border-yellow-200">
                    Artificially worsen the client's execution price by this margin to increase broker PNL.
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Market Order Slippage Penalty (Ticks)</label>
                    <input type="number" defaultValue={2} className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm" />
                    <p className="text-[10px] text-gray-500 mt-1">E.g. If market is 100, execute buy at 100.10</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Execution Delay (Seconds)</label>
                    <input type="number" defaultValue={0.5} step="0.1" className="w-full px-3 py-1.5 border border-gray-300 rounded focus:ring-blue-500 text-sm" />
                  </div>
                </div>
              </div>
              <div className="mt-8 border-t pt-4">
                <button 
                  onClick={() => alert('Brokerage settings are managed globally via Settings page. Per-user overrides coming in next release.')} 
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-md text-sm transition-colors"
                >
                  Save Revenue Settings
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="p-6 max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <ShieldAlert className="h-5 w-5 text-gray-700" />
                <h3 className="text-lg font-bold text-gray-900">Security & Account Operations</h3>
              </div>
              <div className="space-y-6">
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-bold text-sm text-gray-900 mb-2">Reset Password</h4>
                  <p className="text-xs text-gray-500 mb-4">Send a password reset link to the user's registered email address ({user.email}).</p>
                  <button 
                    onClick={() => confirm('Send Password Reset Link')} 
                    className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-md text-sm transition-colors"
                  >
                    Send Reset Link
                  </button>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-bold text-sm text-gray-900 mb-2">Active Sessions</h4>
                  <p className="text-xs text-gray-500 mb-4">Terminate active login sessions across all devices. The user will be forced to login again.</p>
                  <button 
                    onClick={() => confirm('Revoke All Sessions')} 
                    className="px-4 py-2 bg-white border border-gray-300 text-orange-600 hover:bg-orange-50 font-bold rounded-md text-sm transition-colors"
                  >
                    Log Out All Devices
                  </button>
                </div>
                <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                  <h4 className="font-bold text-sm text-red-900 mb-2">Danger Zone</h4>
                  <p className="text-xs text-red-700 mb-4">Block this user's account immediately. They will not be able to login or trade.</p>
                  <button 
                    onClick={() => confirm('Block User')} 
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 font-bold rounded-md text-sm transition-colors"
                  >
                    Block Account
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-black text-gray-900 mb-2">Confirm Admin Override</h3>
            <p className="text-sm text-gray-600 mb-4">Are you sure you want to execute: <strong className="text-red-600">{confirmAction}</strong>?</p>
            <div className="mb-6">
              {['Manual Deposit', 'Manual Withdrawal'].includes(confirmAction) && (
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1">Amount (₹)</label>
                  <input type="number" value={confirmAmount} onChange={e => setConfirmAmount(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500" placeholder="Enter amount..." />
                </div>
              )}
              {!['Send Password Reset Link', 'Revoke All Sessions'].includes(confirmAction) && (
                <>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Reason / Authorization (Required)</label>
                  <textarea value={confirmReason} onChange={e => setConfirmReason(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500" rows="3" placeholder="Enter reason..."></textarea>
                </>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowConfirm(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-black hover:bg-red-700">EXECUTE</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}