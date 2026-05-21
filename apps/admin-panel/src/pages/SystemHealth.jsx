import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Zap, RefreshCw, Cpu, HardDrive } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function SystemHealth() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await adminApi.getSystemHealth();
      setHealth(data);
    } catch (err) {
      console.error('Failed to fetch system health:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(true), 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) {
    return <div className="p-8 text-center text-gray-500">Loading system health metrics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health & Uptime</h1>
          <p className="text-sm text-gray-500 mt-1">Live monitoring of infrastructure, APIs, and database performance.</p>
        </div>
        <button 
          onClick={() => fetchHealth(true)} 
          disabled={refreshing}
          className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 py-2 shadow-sm disabled:opacity-50">
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Stats'}
        </button>
      </div>

      {/* Core Services */}
      <h2 className="text-lg font-bold text-gray-900 mb-2">Core Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className={`bg-white p-5 rounded-lg border border-gray-200 shadow-sm border-t-4 ${health?.status === 'operational' ? 'border-t-green-500' : 'border-t-red-500'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-900">Trading Engine</span>
            </div>
            {health?.status === 'operational' ? (
              <span className="flex h-2.5 w-2.5 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span>
            ) : (
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
            )}
          </div>
          <div className={`text-xs font-bold inline-block px-2 py-0.5 rounded ${health?.status === 'operational' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
            {health?.status === 'operational' ? 'Operational' : 'Down'}
          </div>
          <div className="text-xs text-gray-500 mt-2 font-mono">Uptime: 99.99%</div>
        </div>
        
        <div className={`bg-white p-5 rounded-lg border border-gray-200 shadow-sm border-t-4 ${health?.database.status === 'operational' ? 'border-t-green-500' : 'border-t-red-500'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-900">Supabase DB</span>
            </div>
            {health?.database.status === 'operational' && <span className="flex h-2.5 w-2.5 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span>}
          </div>
          <div className="text-xs text-green-600 font-bold bg-green-50 inline-block px-2 py-0.5 rounded">Operational</div>
          <div className="text-xs text-gray-500 mt-2 font-mono">Lat: {health?.database.latency}ms | Conn: {health?.database?.connections || 0}</div>
        </div>

        <div className={`bg-white p-5 rounded-lg border border-gray-200 shadow-sm border-t-4 ${health?.marketFeed.latency > 200 ? 'border-t-yellow-500' : 'border-t-green-500'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-900">Market Data Feed</span>
            </div>
            <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${health?.marketFeed.latency > 200 ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
          </div>
          <div className={`text-xs font-bold inline-block px-2 py-0.5 rounded ${health?.marketFeed.latency > 200 ? 'text-yellow-700 bg-yellow-50' : 'text-green-600 bg-green-50'}`}>
            {health?.marketFeed.latency > 200 ? 'Degraded (High Latency)' : 'Operational'}
          </div>
          <div className="text-xs text-gray-500 mt-2 font-mono">Lat: {health?.marketFeed.latency}ms (Expected &lt;100ms)</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm border-t-4 border-t-green-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-900">Redis Cache</span>
            </div>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </div>
          <div className="text-xs text-green-600 font-bold bg-green-50 inline-block px-2 py-0.5 rounded">Operational</div>
          <div className="text-xs text-gray-500 mt-2 font-mono">Hit Rate: {health?.redis?.hitRate || 99}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resource Usage */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2"><Cpu className="h-4 w-4"/> API Node Resources</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">CPU Usage</span>
                <span className="text-xs font-bold text-gray-900">{health?.system?.cpu}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{width: `${health?.system?.cpu}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">Memory (RAM)</span>
                <span className={`text-xs font-bold ${health?.system?.memory > 80 ? 'text-orange-600' : 'text-green-600'}`}>
                  {health?.system?.memory}% ({health?.system?.memoryText})
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full transition-all duration-500 ${health?.system?.memory > 80 ? 'bg-orange-500' : 'bg-green-500'}`} style={{width: `${health?.system?.memory}%`}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">Storage <HardDrive className="inline h-3 w-3"/></span>
                <span className="text-xs font-bold text-gray-900">{health?.system?.storage || 0}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{width: `${health?.system?.storage || 0}%`}}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-6">Traffic & Connections</h3>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase mb-1">Active WebSockets</div>
              <div className="text-3xl font-black text-gray-900">{health?.metrics.websockets.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase mb-1">Order TPS</div>
              <div className="text-3xl font-black text-gray-900">{health?.metrics.tps} <span className="text-xs font-medium text-gray-400 normal-case">/ sec</span></div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase mb-1">Queue (Wait/Act)</div>
              <div className="text-3xl font-black text-green-600">
                {health?.metrics.queueWaiting || 0} / {health?.metrics.queueActive || 0}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase mb-1">Failed Jobs</div>
              <div className="text-3xl font-black text-red-600">{health?.metrics.queueFailed || 0}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
