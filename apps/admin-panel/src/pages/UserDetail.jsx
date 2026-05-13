import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, Wallet, TrendingUp, AlertTriangle, ShieldAlert,
  Activity, Settings, Percent, Zap
} from 'lucide-react';

export default function UserDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('overview');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  const confirm = (action) => {
    setConfirmAction(action);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    console.log('Confirmed:', confirmAction);
    setShowConfirm(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/users" className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Profile: {id || 'TDX-82491'}</h1>
          <div className="text-sm text-gray-500 flex items-center gap-2 mt-1">
            <span className="font-medium text-gray-800">Master: Master-A</span>
            <span>•</span>
            <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full text-xs">Trading Active</span>
            <span>•</span>
            <span>Joined: 2026-01-15</span>
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
          <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Wallet className="h-4 w-4" /> Credit Line (M2M Limit)
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">₹12,50,050</div>
          <div className="text-xs text-blue-600 font-medium mt-1 cursor-pointer hover:underline" onClick={() => confirm('Adjust Credit Limit')}>Adjust Credit Limit</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Net M2M PNL
          </div>
          <div className="text-2xl font-bold text-green-600 mt-2">+₹1,72,975</div>
          <div className="text-xs text-gray-500 mt-1">Realtime Open PNL</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <Activity className="h-4 w-4" /> Margin Utilized
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">₹4,00,000</div>
          <div className="text-xs text-gray-500 mt-1">Level: 355%</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="text-sm font-medium text-gray-500 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Brokerage Generated
          </div>
          <div className="text-2xl font-bold text-gray-900 mt-2">₹45,200</div>
          <div className="text-xs text-gray-500 mt-1">This Month</div>
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
          {/* Brokerage Rules Tab */}
          {activeTab === 'brokerage_rules' && (
            <div className="p-6 max-w-4xl">
              <div className="flex items-center gap-2 mb-6">
                <Percent className="h-5 w-5 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">Custom Brokerage & Slippage Setup</h3>
              </div>
              <p className="text-sm text-gray-500 mb-6">Define specific revenue settings for this client. Overrides master defaults.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Brokerage Config */}
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

                {/* Slippage & Spread Config */}
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
                <button onClick={() => console.log('Action triggered')} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-md text-sm transition-colors">
                  Save Revenue Settings
                </button>
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
                  <tr className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-bold text-gray-900">NIFTY50</td>
                    <td className="px-4 py-3"><span className="text-green-600 font-bold">LONG</span></td>
                    <td className="px-4 py-3 text-right font-medium">100</td>
                    <td className="px-4 py-3 text-right">₹150.00</td>
                    <td className="px-4 py-3 text-right">₹210.00</td>
                    <td className="px-4 py-3 text-right text-green-600 font-bold">+₹6,000.00</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => confirm('Force Close Position')}
                        className="text-red-600 hover:text-red-800 font-bold text-xs bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors"
                      >
                        Force Square Off
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Risk Settings Tab */}
          {activeTab === 'risk_settings' && (
            <div className="p-6 max-w-2xl">
              <div className="flex items-center gap-2 mb-6">
                <ShieldAlert className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-bold text-gray-900">Per-User Risk & Margin Rules</h3>
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
                <button onClick={() => console.log('Action triggered')} className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-md text-sm transition-colors">
                  Save Risk Rules
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
                  <p className="text-xs text-gray-500 mb-4">Send a password reset link to the user's registered email or force a temporary password.</p>
                  <div className="flex gap-3">
                    <button onClick={() => confirm('Send Password Reset Link')} className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 font-bold rounded-md text-sm transition-colors">
                      Send Reset Link
                    </button>
                    <button onClick={() => confirm('Generate Temporary Password')} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-bold rounded-md text-sm transition-colors">
                      Generate Temp Password
                    </button>
                  </div>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-bold text-sm text-gray-900 mb-2">Two-Factor Authentication (2FA)</h4>
                  <p className="text-xs text-gray-500 mb-4">Manage the user's 2FA settings. Use this to help users who are locked out.</p>
                  <button onClick={() => confirm('Disable 2FA')} className="px-4 py-2 bg-white border border-gray-300 text-red-600 hover:bg-red-50 font-bold rounded-md text-sm transition-colors">
                    Disable 2FA (Emergency)
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <h4 className="font-bold text-sm text-gray-900 mb-2">Active Sessions</h4>
                  <p className="text-xs text-gray-500 mb-4">Terminate active login sessions across all devices.</p>
                  <button onClick={() => confirm('Revoke All Sessions')} className="px-4 py-2 bg-white border border-gray-300 text-orange-600 hover:bg-orange-50 font-bold rounded-md text-sm transition-colors">
                    Log Out All Devices
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Actions & Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                <button onClick={() => confirm('Manual Deposit')} className="flex items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-left">
                  <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">Manual Deposit</div>
                    <div className="text-xs text-gray-500">Add funds to wallet</div>
                  </div>
                </button>
                <button onClick={() => confirm('Manual Withdrawal')} className="flex items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors text-left">
                  <div className="p-2 bg-red-100 rounded-full text-red-600">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">Manual Withdrawal</div>
                    <div className="text-xs text-gray-500">Deduct from wallet</div>
                  </div>
                </button>
                <button onClick={() => confirm('Update KYC Status')} className="flex items-center gap-2 p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors text-left">
                  <div className="p-2 bg-green-100 rounded-full text-green-600">
                    <ShieldAlert className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-gray-900">Update KYC</div>
                    <div className="text-xs text-gray-500">Verify documents</div>
                  </div>
                </button>
              </div>

              <div className="space-y-4">
                <h4 className="font-bold text-sm text-gray-900 border-b pb-2">Recent Activity</h4>
                <div className="text-sm text-gray-600">
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span>Logged in from 192.168.1.1</span>
                    <span className="text-gray-400 text-xs">2 mins ago</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span>Placed BUY order NIFTY 22500 CE</span>
                    <span className="text-gray-400 text-xs">15 mins ago</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span>Deposit successful (₹1,00,000)</span>
                    <span className="text-gray-400 text-xs">1 day ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Placeholders for others */}
          {['orders', 'trades', 'wallet'].includes(activeTab) && (
            <div className="p-6 text-center text-gray-500 text-sm italic">
              Data table for {activeTab} would be populated here...
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
              <label className="block text-xs font-bold text-gray-700 mb-1">Reason / Authorization (Required)</label>
              <textarea className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-blue-500" rows="3" placeholder="Enter reason..."></textarea>
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
