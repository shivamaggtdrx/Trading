import React from 'react';
import { Search, Monitor, LogOut, Clock, Shield, Smartphone, Globe, Settings } from 'lucide-react';

export default function SessionManager() {
  const adminSessions = [
    { id: 'S-001', user: 'Shivam', type: 'Admin', role: 'Super Admin', device: 'Chrome / Windows', ip: '103.45.67.89', location: 'Mumbai', started: '6 May, 09:00 AM', lastActive: '2 mins ago', status: 'Active' },
    { id: 'S-002', user: 'Priya Patel', type: 'Admin', role: 'Risk Manager', device: 'Firefox / macOS', ip: '103.45.67.102', location: 'Delhi', started: '6 May, 09:15 AM', lastActive: '5 mins ago', status: 'Active' },
  ];

  const clientSessions = [
    { id: 'S-101', user: 'TDX-101 (John Doe)', type: 'Client', device: 'App / Android', ip: '45.112.33.1', location: 'Mumbai', started: '6 May, 09:30 AM', lastActive: '1 min ago', status: 'Active' },
    { id: 'S-102', user: 'TDX-102 (Alice Smith)', type: 'Client', device: 'Safari / iOS', ip: '185.20.10.5', location: 'Bangalore', started: '6 May, 10:00 AM', lastActive: '10 mins ago', status: 'Idle' },
    { id: 'S-103', user: 'TDX-105 (Bob Jones)', type: 'Client', device: 'Chrome / Windows', ip: '103.78.45.12', location: 'Pune', started: '6 May, 08:45 AM', lastActive: '25 mins ago', status: 'Idle' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Session Manager</h1>
          <p className="text-sm text-gray-500 mt-1">View all active sessions, force logout remotely, and configure idle timeouts.</p>
        </div>
        <button onClick={() => alert('Action triggered. Backend integration pending.')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 shadow-sm">
          <LogOut className="w-4 h-4" /> Terminate All Client Sessions
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Monitor className="w-4 h-4 text-blue-500" /> Admin Sessions</div>
          <div className="text-2xl font-bold text-gray-900">{adminSessions.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Smartphone className="w-4 h-4 text-green-500" /> Client Sessions</div>
          <div className="text-2xl font-bold text-gray-900">{clientSessions.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Clock className="w-4 h-4 text-orange-500" /> Idle Timeout</div>
          <div className="text-2xl font-bold text-gray-900">30 min</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Globe className="w-4 h-4 text-purple-500" /> Unique IPs</div>
          <div className="text-2xl font-bold text-gray-900">5</div>
        </div>
      </div>

      {/* Timeout Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><Settings className="w-5 h-5 text-blue-600" /></div>
            <div>
              <h3 className="font-bold text-gray-900">Idle Timeout Configuration</h3>
              <p className="text-sm text-gray-500">Auto-logout sessions after inactivity period.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Admin:</label>
              <select className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white">
                <option>15 min</option><option selected>30 min</option><option>60 min</option><option>120 min</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-600">Client:</label>
              <select className="border border-gray-300 rounded-lg text-sm px-3 py-1.5 bg-white">
                <option>5 min</option><option selected>15 min</option><option>30 min</option><option>60 min</option>
              </select>
            </div>
            <button onClick={() => alert('Action triggered. Backend integration pending.')} className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Save</button>
          </div>
        </div>
      </div>

      {/* Admin Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <h3 className="font-bold text-gray-900">Admin Sessions</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">IP / Location</th>
                <th className="py-3 px-4">Started</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {adminSessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4"><div className="font-medium text-gray-900">{s.user}</div><div className="text-xs text-gray-400">{s.role}</div></td>
                  <td className="py-3 px-4 text-gray-600">{s.device}</td>
                  <td className="py-3 px-4"><div className="font-mono text-xs text-gray-500">{s.ip}</div><div className="text-xs text-gray-400">{s.location}</div></td>
                  <td className="py-3 px-4 text-gray-500">{s.started}</td>
                  <td className="py-3 px-4 text-gray-500">{s.lastActive}</td>
                  <td className="py-3 px-4"><span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full"></span><span className="text-xs font-medium text-green-700">Active</span></span></td>
                  <td className="py-3 px-4 text-right"><button onClick={() => alert('Action triggered. Backend integration pending.')} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 text-xs font-medium">Force Logout</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Sessions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-green-600" />
            <h3 className="font-bold text-gray-900">Client Sessions</h3>
          </div>
          <div className="relative max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search clients..." className="w-full pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Device</th>
                <th className="py-3 px-4">IP / Location</th>
                <th className="py-3 px-4">Started</th>
                <th className="py-3 px-4">Last Active</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {clientSessions.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{s.user}</td>
                  <td className="py-3 px-4 text-gray-600">{s.device}</td>
                  <td className="py-3 px-4"><div className="font-mono text-xs text-gray-500">{s.ip}</div><div className="text-xs text-gray-400">{s.location}</div></td>
                  <td className="py-3 px-4 text-gray-500">{s.started}</td>
                  <td className="py-3 px-4 text-gray-500">{s.lastActive}</td>
                  <td className="py-3 px-4">
                    <span className={`flex items-center gap-1.5`}>
                      <span className={`w-2 h-2 rounded-full ${s.status === 'Active' ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      <span className={`text-xs font-medium ${s.status === 'Active' ? 'text-green-700' : 'text-yellow-700'}`}>{s.status}</span>
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right"><button onClick={() => alert('Action triggered. Backend integration pending.')} className="text-red-600 hover:bg-red-50 px-2 py-1 rounded border border-red-200 text-xs font-medium">Force Logout</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
