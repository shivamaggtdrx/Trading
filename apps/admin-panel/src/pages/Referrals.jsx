import { useState, useEffect } from 'react';
import { Users, IndianRupee, Percent, Gift, ChevronRight, ChevronDown } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Referrals() {
  const [activeTab, setActiveTab] = useState('list');
  const [expandedNodes, setExpandedNodes] = useState({});
  const [stats, setStats] = useState({
    totalReferrals: 0,
    totalPaidOut: 0,
    currentCommission: 'Loading...',
    activity: [],
    hierarchyNodes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getReferralStats()
      .then(res => {
        setStats(res);
        // Expand the first master node by default if there is one
        const masters = res.hierarchyNodes.filter(n => !n.referred_by);
        if (masters.length > 0) {
          setExpandedNodes({ [masters[0].client_id]: true });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleNode = (id) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading Referral Stats...</div>;

  // Reconstruct tree helper
  const getChildren = (clientId) => stats.hierarchyNodes.filter(n => n.profiles?.client_id === clientId);
  const masters = stats.hierarchyNodes.filter(n => !n.referred_by);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Referral Management</h1>
        <button onClick={() => console.log('Action triggered')} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2">
          <Gift className="h-4 w-4 mr-2" />
          Adjust Reward Rules
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Total Referrals</h3>
            <div className="text-2xl font-bold text-gray-900">{stats.totalReferrals.toLocaleString()}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center">
          <div className="p-3 bg-green-50 text-green-600 rounded-lg">
            <IndianRupee className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Total Paid Out</h3>
            <div className="text-2xl font-bold text-gray-900">₹{stats.totalPaidOut.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm flex items-center">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
            <Percent className="h-6 w-6" />
          </div>
          <div className="ml-4">
            <h3 className="text-sm font-medium text-gray-500">Current Commission</h3>
            <div className="text-2xl font-bold text-gray-900">{stats.currentCommission}</div>
            <div className="text-xs text-gray-500 mt-1">active structure</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-4 py-3 gap-4">
          <nav className="flex space-x-2" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3 py-1.5 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'list' 
                  ? 'bg-white shadow-sm text-blue-700 border border-gray-200' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Recent Activity
            </button>
            <button
              onClick={() => setActiveTab('hierarchy')}
              className={`px-3 py-1.5 font-medium text-sm rounded-md transition-colors ${
                activeTab === 'hierarchy' 
                  ? 'bg-white shadow-sm text-blue-700 border border-gray-200' 
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
              }`}
            >
              Referral Hierarchy Tree
            </button>
          </nav>
        </div>

        {activeTab === 'list' && (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                <tr>
                  <th className="px-6 py-3 font-medium">Ref ID</th>
                  <th className="px-6 py-3 font-medium">Referrer (Invited By)</th>
                  <th className="px-6 py-3 font-medium">Invitee (New User)</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Earned (INR)</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {stats.activity.map((ref) => (
                  <tr key={ref.id} className="hover:bg-blue-50/50">
                    <td className="px-6 py-4 font-medium text-gray-900">{ref.id}</td>
                    <td className="px-6 py-4 text-blue-600 hover:underline cursor-pointer font-medium">{ref.referrer}</td>
                    <td className="px-6 py-4 text-blue-600 hover:underline cursor-pointer font-medium">{ref.invited}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        ref.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {ref.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-gray-900">
                      ₹{ref.earned.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-gray-500 text-xs">{ref.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'hierarchy' && (
          <div className="p-6">
            <h3 className="text-sm font-medium text-gray-700 mb-4">Master Affiliates Network</h3>
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 font-mono text-sm">
              <ul className="space-y-2">
                {masters.map(master => (
                  <li key={master.client_id}>
                    <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded" onClick={() => toggleNode(master.client_id)}>
                      {expandedNodes[master.client_id] ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                      <span className="font-bold text-blue-600">{master.client_id} (Master)</span>
                    </div>
                    {expandedNodes[master.client_id] && (
                      <ul className="pl-6 mt-2 space-y-2 border-l-2 border-gray-200 ml-2">
                        {getChildren(master.client_id).map(child => (
                          <li key={child.client_id} className="flex flex-col gap-1 text-gray-600 p-1">
                            <div className="flex items-center gap-2">
                              <span className="w-4 border-b-2 border-gray-200 inline-block"></span>
                              {child.client_id} (Trader)
                            </div>
                          </li>
                        ))}
                        {getChildren(master.client_id).length === 0 && (
                          <li className="text-gray-400 italic text-xs ml-6">No active referrals yet</li>
                        )}
                      </ul>
                    )}
                  </li>
                ))}
                {masters.length === 0 && (
                  <li className="text-gray-400 italic text-sm">No master affiliates found</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
