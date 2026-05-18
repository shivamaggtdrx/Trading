import React, { useState, useEffect, useCallback } from 'react';
import { Search, ShieldAlert, Loader2, RefreshCw, RotateCcw, CheckCircle2, Clock, Activity, Zap, XCircle } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Logs() {
  const [activeTab, setActiveTab] = useState('admin');
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Queue monitoring state
  const [queueStats, setQueueStats] = useState(null);
  const [queueLoading, setQueueLoading] = useState(false);
  const [retryingJob, setRetryingJob] = useState(null);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAuditLogs();
      setLogs(data.logs || []);
    } catch (err) {
      console.error('Failed to fetch logs', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchQueueStats = useCallback(async () => {
    try {
      setQueueLoading(true);
      const data = await adminApi.getQueueStats();
      setQueueStats(data);
    } catch (err) {
      console.error('Failed to fetch queue stats', err);
    } finally {
      setQueueLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'queue') {
      fetchQueueStats();
      const interval = setInterval(fetchQueueStats, 8000);
      return () => clearInterval(interval);
    } else {
      fetchLogs();
    }
  }, [activeTab, fetchLogs, fetchQueueStats]);

  const handleRetry = async (jobId) => {
    if (!window.confirm(`Retry job ${jobId}?`)) return;
    setRetryingJob(jobId);
    try {
      await adminApi.retryFailedJob(jobId);
      await fetchQueueStats();
    } catch (err) {
      alert('Failed to retry job: ' + err.message);
    } finally {
      setRetryingJob(null);
    }
  };

  const adminLogs = logs.filter(log => log.target_type !== 'user_auth');
  const userLogs = logs.filter(log => log.target_type === 'user_auth');
  const filteredLogs = (activeTab === 'admin' ? adminLogs : userLogs).filter(log =>
    JSON.stringify(log).toLowerCase().includes(search.toLowerCase())
  );

  const tabs = [
    { id: 'admin', label: 'Admin Audit Log' },
    { id: 'user', label: 'User Security Logs' },
    { id: 'queue', label: '⚡ Queue Monitor' },
  ];

  const queueCountCards = queueStats ? [
    { label: 'Active', value: queueStats.counts?.active || 0, color: 'text-blue-600', bg: 'bg-blue-50', icon: <Activity className="h-5 w-5 text-blue-500" /> },
    { label: 'Waiting', value: queueStats.counts?.waiting || 0, color: 'text-yellow-600', bg: 'bg-yellow-50', icon: <Clock className="h-5 w-5 text-yellow-500" /> },
    { label: 'Delayed', value: queueStats.counts?.delayed || 0, color: 'text-orange-600', bg: 'bg-orange-50', icon: <Clock className="h-5 w-5 text-orange-500" /> },
    { label: 'Completed', value: queueStats.counts?.completed || 0, color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle2 className="h-5 w-5 text-green-500" /> },
    { label: 'Failed', value: queueStats.counts?.failed || 0, color: 'text-red-600', bg: 'bg-red-50', icon: <XCircle className="h-5 w-5 text-red-500" /> },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">System Logs & Operations</h1>
          <p className="text-sm text-gray-500 mt-1">Audit trail, security logs, and real-time BullMQ queue monitoring.</p>
        </div>
        {activeTab === 'queue' && (
          <button onClick={fetchQueueStats} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <RefreshCw className={`h-4 w-4 ${queueLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        )}
      </div>

      {activeTab === 'admin' && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-red-800">Advanced Audit Logging Enabled</h3>
            <p className="text-xs text-red-700 mt-1">
              All administrative actions are permanently recorded and cannot be altered or deleted.
            </p>
          </div>
        </div>
      )}

      {/* Queue Stats Cards */}
      {activeTab === 'queue' && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {queueCountCards.map(card => (
            <div key={card.label} className={`${card.bg} p-4 rounded-lg border border-gray-200 shadow-sm flex items-center gap-3`}>
              {card.icon}
              <div>
                <div className="text-xs font-bold text-gray-500 uppercase">{card.label}</div>
                <div className={`text-2xl font-black ${card.color}`}>{(card.value || 0).toLocaleString()}</div>
              </div>
            </div>
          ))}
          {!queueStats && (
            <div className="col-span-5 p-4 text-center text-gray-500">
              <Loader2 className="animate-spin mx-auto h-6 w-6 mb-2" /> Loading queue stats…
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        <div className="border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row justify-between items-center px-4 py-3 gap-4">
          <nav className="flex space-x-2" aria-label="Tabs">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 font-medium text-sm rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white shadow-sm text-blue-700 border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {activeTab !== 'queue' && (
            <div className="relative w-full sm:max-w-xs">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search logs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Queue Monitor Tab */}
        {activeTab === 'queue' && (
          <div>
            <div className="p-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                Failed Jobs — order-execution queue
                <span className="ml-2 text-xs font-normal text-gray-400">(Last 50)</span>
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-2 font-semibold">Job ID</th>
                    <th className="px-4 py-2 font-semibold">Type</th>
                    <th className="px-4 py-2 font-semibold">Symbol</th>
                    <th className="px-4 py-2 font-semibold">Side / Qty</th>
                    <th className="px-4 py-2 font-semibold">Attempts</th>
                    <th className="px-4 py-2 font-semibold">Failure Reason</th>
                    <th className="px-4 py-2 font-semibold text-right">Time</th>
                    <th className="px-4 py-2 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {queueLoading && !queueStats ? (
                    <tr><td colSpan="8" className="px-4 py-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto h-6 w-6 mb-2" /> Loading queue data…</td></tr>
                  ) : (queueStats?.failedJobs || []).length === 0 ? (
                    <tr>
                      <td colSpan="8" className="px-4 py-10 text-center">
                        <CheckCircle2 className="h-8 w-8 text-green-400 mx-auto mb-2" />
                        <p className="text-gray-600 font-bold">No failed jobs</p>
                        <p className="text-xs text-gray-400 mt-1">The order execution queue is healthy.</p>
                      </td>
                    </tr>
                  ) : (queueStats?.failedJobs || []).map(job => (
                    <tr key={job.id} className="hover:bg-red-50/30">
                      <td className="px-4 py-2 font-mono text-xs text-gray-700">{job.id}</td>
                      <td className="px-4 py-2">
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold">{(job.name || '').replace('execute_', '')}</span>
                      </td>
                      <td className="px-4 py-2 font-bold text-gray-900">{job.data?.symbol || '—'}</td>
                      <td className="px-4 py-2 text-gray-600">{job.data?.side} x {job.data?.quantity}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${job.attemptsMade >= 3 ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                          {job.attemptsMade}/3
                        </span>
                      </td>
                      <td className="px-4 py-2 text-red-600 text-xs max-w-xs truncate" title={job.failedReason}>{(job.failedReason || '').substring(0, 60)}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs text-right">{new Date(job.timestamp).toLocaleTimeString()}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => handleRetry(job.id)}
                          disabled={retryingJob === job.id}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded border border-blue-200 hover:bg-blue-100 disabled:opacity-50"
                        >
                          <RotateCcw className={`h-3 w-3 ${retryingJob === job.id ? 'animate-spin' : ''}`} />
                          Retry
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Admin / User Log Tabs */}
        {activeTab !== 'queue' && (
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                {activeTab === 'admin' ? (
                  <tr>
                    <th className="px-4 py-2 font-semibold">Log ID</th>
                    <th className="px-4 py-2 font-semibold">Action Type</th>
                    <th className="px-4 py-2 font-semibold">Detailed Changes</th>
                    <th className="px-4 py-2 font-semibold text-right">IP Address</th>
                    <th className="px-4 py-2 font-semibold text-right">Time</th>
                  </tr>
                ) : (
                  <tr>
                    <th className="px-4 py-2 font-semibold">Log ID</th>
                    <th className="px-4 py-2 font-semibold">User</th>
                    <th className="px-4 py-2 font-semibold">Action Description</th>
                    <th className="px-4 py-2 font-semibold text-right">IP Address</th>
                    <th className="px-4 py-2 font-semibold text-right">Time</th>
                  </tr>
                )}
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500"><Loader2 className="animate-spin mx-auto h-6 w-6 mb-2" /> Loading logs...</td></tr>
                ) : filteredLogs.length === 0 ? (
                  <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-500">No logs found.</td></tr>
                ) : activeTab === 'admin' ? filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/50">
                    <td className="px-4 py-2 font-medium text-gray-900 text-xs">LOG-{log.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-2 font-medium text-gray-800">{log.action.replace(/_/g, ' ').toUpperCase()}</td>
                    <td className="px-4 py-2 text-gray-600 text-xs whitespace-normal max-w-md">{log.description}</td>
                    <td className="px-4 py-2 text-gray-500 font-mono text-[10px] text-right">{log.ip_address || '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs text-right">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                )) : filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-blue-50/50">
                    <td className="px-4 py-2 font-medium text-gray-900 text-xs">ULOG-{log.id.substring(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-2 font-medium text-blue-600">{log.profiles?.full_name || log.target_id}</td>
                    <td className="px-4 py-2 text-gray-700">{log.description}</td>
                    <td className="px-4 py-2 text-gray-500 font-mono text-[10px] text-right">{log.ip_address || '—'}</td>
                    <td className="px-4 py-2 text-gray-500 text-xs text-right">{new Date(log.created_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
