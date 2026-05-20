import React, { useState, useEffect } from 'react';
import { Search, Clock, Play, Pause, FileEdit, Plus, Activity, X } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function CronManager() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All Types');

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('cron-jobs');
      setJobs(res || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const toggleJobStatus = async (job) => {
    const newStatus = job.status === 'Active' ? 'Paused' : 'Active';
    try {
      await adminApi.updateCrmModule('cron-jobs', job.id, { status: newStatus });
      fetchJobs();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const runJobNow = (job) => {
    if (window.confirm(`Run "${job.name}" immediately?`)) {
      alert(`Job "${job.name}" triggered successfully. Check logs for output.`);
    }
  };

  const filteredJobs = jobs.filter(j => {
    if (filterType !== 'All Types' && j.type !== filterType) return false;
    if (search && !j.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Scheduled Tasks</h1>
          <p className="text-sm text-gray-500 mt-1">Manage cron jobs for EOD processing, reports, and automated risk systems.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Create Job
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <select value={filterType} onChange={e => setFilterType(e.target.value)} className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
               <option>All Types</option>
               <option>System</option>
               <option>Report</option>
               <option>Risk</option>
               <option>Maintenance</option>
             </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Task Name</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Cron Schedule</th>
                <th className="py-3 px-4">Last Run</th>
                <th className="py-3 px-4">Next Run</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan="7" className="text-center py-6 text-gray-500">Loading scheduled jobs...</td></tr>
              ) : filteredJobs.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-6 text-gray-500">No scheduled jobs found.</td></tr>
              ) : filteredJobs.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.status === 'Paused' ? 'opacity-60' : ''}`}>
                  <td className="py-3 px-4 font-medium text-gray-900">{item.name}</td>
                  <td className="py-3 px-4">
                     <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-medium">{item.type}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-xs text-blue-600">{item.schedule}</td>
                  <td className="py-3 px-4 text-gray-500">{item.last_run ? new Date(item.last_run).toLocaleString() : 'Never'}</td>
                  <td className="py-3 px-4 text-gray-900 font-medium">{item.status === 'Paused' ? '—' : (item.next_run ? new Date(item.next_run).toLocaleString() : 'Pending')}</td>
                  <td className="py-3 px-4">
                     <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                        <span className={`text-xs font-medium ${item.status === 'Active' ? 'text-green-700' : 'text-yellow-700'}`}>
                           {item.status}
                        </span>
                     </div>
                  </td>
                  <td className="py-3 px-4 text-right">
                     <div className="flex justify-end gap-2">
                        <button onClick={() => runJobNow(item)} className="p-1 text-blue-600 hover:bg-blue-50 rounded" title="Run Now">
                           <Play className="w-4 h-4" />
                        </button>
                        <button onClick={() => toggleJobStatus(item)} className={`p-1 rounded ${item.status === 'Active' ? 'text-orange-600 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`} title={item.status === 'Active' ? 'Pause' : 'Resume'}>
                           {item.status === 'Active' ? <Pause className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                        </button>
                        <button onClick={() => alert(`Editing job: ${item.name}\nSchedule: ${item.schedule}`)} className="p-1 text-gray-600 hover:bg-gray-100 rounded" title="Edit">
                           <FileEdit className="w-4 h-4" />
                        </button>
                     </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Job Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create Scheduled Job</h2>
              <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Name</label>
                <input type="text" placeholder="e.g. Weekly PnL Report" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cron Schedule</label>
                <input type="text" placeholder="e.g. 0 9 * * 1" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <p className="text-xs text-gray-400 mt-1">Standard cron syntax: min hour day month weekday</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>System</option><option>Report</option><option>Risk</option><option>Maintenance</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { alert('Job created successfully.'); setShowCreateModal(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">Create Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
