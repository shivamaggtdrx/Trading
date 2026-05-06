import { Activity, Database, Server, Zap, RefreshCw, Cpu, HardDrive } from 'lucide-react';

export default function SystemHealth() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Health & Uptime</h1>
          <p className="text-sm text-gray-500 mt-1">Live monitoring of infrastructure, APIs, and database performance.</p>
        </div>
        <button onClick={() => alert('Action triggered. Backend integration pending.')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 h-10 px-4 py-2 shadow-sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Stats
        </button>
      </div>

      {/* Core Services */}
      <h2 className="text-lg font-bold text-gray-900 mb-2">Core Services</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm border-t-4 border-t-green-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-900">Trading Engine</span>
            </div>
            <span className="flex h-2.5 w-2.5 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span>
          </div>
          <div className="text-xs text-green-600 font-bold bg-green-50 inline-block px-2 py-0.5 rounded">Operational</div>
          <div className="text-xs text-gray-500 mt-2 font-mono">Uptime: 99.99%</div>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm border-t-4 border-t-green-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-900">Supabase DB</span>
            </div>
            <span className="flex h-2.5 w-2.5 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span>
          </div>
          <div className="text-xs text-green-600 font-bold bg-green-50 inline-block px-2 py-0.5 rounded">Operational</div>
          <div className="text-xs text-gray-500 mt-2 font-mono">Lat: 12ms | Conn: 142</div>
        </div>

        <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm border-t-4 border-t-yellow-500">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-bold text-gray-900">Market Data Feed</span>
            </div>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-yellow-500"></span>
          </div>
          <div className="text-xs text-yellow-700 font-bold bg-yellow-50 inline-block px-2 py-0.5 rounded">Degraded (High Latency)</div>
          <div className="text-xs text-gray-500 mt-2 font-mono">Lat: 450ms (Expected &lt;100ms)</div>
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
          <div className="text-xs text-gray-500 mt-2 font-mono">Hit Rate: 98.4%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resource Usage */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-6 flex items-center gap-2"><Cpu className="h-4 w-4"/> Render Node Resources</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">CPU Usage</span>
                <span className="text-xs font-bold text-gray-900">42%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{width: '42%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">Memory (RAM)</span>
                <span className="text-xs font-bold text-orange-600">85% (3.4GB / 4GB)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{width: '85%'}}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-bold text-gray-700">Storage <HardDrive className="inline h-3 w-3"/></span>
                <span className="text-xs font-bold text-gray-900">28% (14GB / 50GB)</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{width: '28%'}}></div>
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
              <div className="text-3xl font-black text-gray-900">1,245</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase mb-1">Order TPS</div>
              <div className="text-3xl font-black text-gray-900">42 <span className="text-xs font-medium text-gray-400 normal-case">/ sec</span></div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase mb-1">Pending Webhooks</div>
              <div className="text-3xl font-black text-green-600">0</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 font-bold uppercase mb-1">Error Rate (5xx)</div>
              <div className="text-3xl font-black text-gray-900">0.01%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
