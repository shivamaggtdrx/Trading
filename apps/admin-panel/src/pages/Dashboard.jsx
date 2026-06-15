import { Users, ShieldAlert, ArrowRightLeft, IndianRupee, Power, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState, useEffect } from 'react';
import { adminApi } from '../services/adminApi';

export default function Dashboard() {
  const [showKillSwitch, setShowKillSwitch] = useState(false);
  const [killConfirm, setKillConfirm] = useState('');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const data = await adminApi.getDashboard();
        setDashboardData(data);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
    // Poll every 10 seconds
    const interval = setInterval(fetchDashboard, 10000);
    return () => clearInterval(interval);
  }, []);

  const stats = [
    { 
      name: 'Net Broker PNL (Today)', 
      value: `₹${(dashboardData?.house_pnl_today || 0).toLocaleString('en-IN')}`, 
      icon: IndianRupee, 
      change: 'Live', 
      changeType: (dashboardData?.house_pnl_today || 0) >= 0 ? 'positive' : 'negative' 
    },
    { 
      name: 'Client PNL (Today)', 
      value: `₹${(dashboardData?.client_pnl_today || 0).toLocaleString('en-IN')}`, 
      icon: ShieldAlert, 
      change: 'Active', 
      changeType: (dashboardData?.client_pnl_today || 0) >= 0 ? 'positive' : 'negative' 
    },
    { 
      name: 'Total Users', 
      value: dashboardData?.total_clients?.toString() || '0', 
      icon: Users, 
      change: 'Registered', 
      changeType: 'positive' 
    },
    { 
      name: 'Active Positions', 
      value: dashboardData?.active_positions?.toString() || '0', 
      icon: Activity, 
      change: 'Open', 
      changeType: 'positive' 
    },
  ];

  const recentActivity = dashboardData?.recent_activity || [];

  const handleKillSwitch = async () => {
    if (killConfirm !== 'SQUAREOFF') {
      alert('Type SQUAREOFF to confirm.');
      return;
    }
    try {
      const res = await adminApi.globalSquareOff();
      alert(res.message);
      setShowKillSwitch(false);
      setKillConfirm('');
    } catch (err) {
      alert(err.message || 'Global Square Off failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Live administrative dashboard and core metrics</p>
        </div>
        <button onClick={() => setShowKillSwitch(true)} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-red-600 text-white hover:bg-red-700 h-10 px-4 shadow-sm animate-pulse shadow-red-500/30">
          <Power className="h-4 w-4 mr-2" />
          GLOBAL KILL SWITCH
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm relative overflow-hidden group hover:border-gray-300 transition-colors">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{stat.name}</p>
                <p className="mt-2 text-2xl font-black text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-lg ${stat.changeType === 'positive' ? 'bg-green-50' : stat.changeType === 'negative' ? 'bg-red-50' : 'bg-blue-50'}`}>
                <stat.icon className={`h-5 w-5 ${stat.changeType === 'positive' ? 'text-green-600' : stat.changeType === 'negative' ? 'text-red-600' : 'text-blue-600'}`} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-xs">
              <span className={`font-bold ${stat.changeType === 'positive' ? 'text-green-600' : stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-500'}`}>
                {stat.change}
              </span>
              <span className="text-gray-400 ml-2">Real-time</span>
            </div>
            <div className="absolute -right-6 -bottom-6 text-gray-50 group-hover:text-gray-100 transition-colors">
              <stat.icon className="h-32 w-32" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Broker Net PNL (7 Days)</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData?.chart_data || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280'}} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`₹${value}`, "Net PNL"]}
                />
                <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 flex flex-col">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Live System Alerts</h2>
          <div className="flex-1 overflow-y-auto">
            <ul className="-mb-8">
              {recentActivity.map((activity, activityIdx) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {activityIdx !== recentActivity.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                          <div className={`h-2 w-2 rounded-full ${activity.type === 'system' ? 'bg-red-500' : 'bg-blue-500'}`} />
                        </span>
                      </div>
                      <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{activity.details}</p>
                        </div>
                        <div className="whitespace-nowrap text-right text-xs text-gray-500">
                          <time dateTime={activity.time}>{activity.time}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {showKillSwitch && (
        <div className="fixed inset-0 bg-red-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-6 border-4 border-red-500">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <Power className="h-8 w-8" />
              <h3 className="text-2xl font-black text-red-700">GLOBAL KILL SWITCH</h3>
            </div>
            <p className="text-sm text-gray-800 font-medium mb-4">
              WARNING: This will instantly square off ALL open positions for ALL clients at current market price and block new order placement.
            </p>
            <div className="bg-red-50 p-3 rounded mb-6 text-xs text-red-800 border border-red-200 font-mono">
              Are you absolutely sure you want to execute system-wide liquidation?
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Type "SQUAREOFF" to confirm</label>
              <input value={killConfirm} onChange={(e) => setKillConfirm(e.target.value)} type="text" className="w-full border-2 border-gray-300 rounded p-2 text-sm focus:ring-red-500 focus:border-red-500 uppercase font-bold" />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowKillSwitch(false)} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-bold text-gray-700 hover:bg-gray-100">Cancel</button>
              <button onClick={handleKillSwitch} className="px-4 py-2 text-white bg-red-600 hover:bg-red-700 rounded-md text-sm font-black shadow-lg">
                EXECUTE SQUARE OFF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
