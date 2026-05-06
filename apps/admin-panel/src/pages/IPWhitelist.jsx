import React, { useState } from 'react';
import { Shield, Search, MapPin, Monitor, Globe, Ban, CheckCircle, Plus, X } from 'lucide-react';

export default function IPWhitelist() {
  const [showAddRule, setShowAddRule] = useState(false);
  const [logins, setLogins] = useState([
    { id: 1, client: 'TDX-101', ip: '103.45.67.89', location: 'Mumbai, IN', device: 'Chrome / Windows', time: '2 mins ago', status: 'Allowed' },
    { id: 2, client: 'TDX-102', ip: '185.20.10.5', location: 'London, UK', device: 'Safari / macOS', time: '15 mins ago', status: 'Flagged' },
    { id: 3, client: 'TDX-103', ip: '45.112.33.1', location: 'Delhi, IN', device: 'App / Android', time: '1 hour ago', status: 'Allowed' },
    { id: 4, client: 'TDX-104', ip: '92.38.176.2', location: 'Moscow, RU', device: 'Firefox / Linux', time: '3 hours ago', status: 'Flagged' },
  ]);

  const handleAllow = (id) => {
    setLogins(logins.map(l => l.id === id ? { ...l, status: 'Allowed' } : l));
  };

  const handleBlock = (id, ip) => {
    if (window.confirm(`Block IP ${ip}? This client will be unable to login from this address.`)) {
      setLogins(logins.map(l => l.id === id ? { ...l, status: 'Blocked' } : l));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">IP & Device Whitelisting</h1>
          <p className="text-sm text-gray-500 mt-1">Track client logins, set geo-restrictions, and monitor suspicious activity.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowAddRule(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Add IP Rule
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Globe className="w-5 h-5" /></div>
               <div>
                  <div className="text-sm text-gray-500 font-medium">Active Countries</div>
                  <div className="text-xl font-bold">12</div>
               </div>
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Monitor className="w-5 h-5" /></div>
               <div>
                  <div className="text-sm text-gray-500 font-medium">Suspicious Logins</div>
                  <div className="text-xl font-bold">{logins.filter(l => l.status === 'Flagged').length} flagged today</div>
               </div>
            </div>
         </div>
         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600"><CheckCircle className="w-5 h-5" /></div>
               <div>
                  <div className="text-sm text-gray-500 font-medium">Blocked IPs</div>
                  <div className="text-xl font-bold">{logins.filter(l => l.status === 'Blocked').length}</div>
               </div>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search by IP, Client ID..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>All Status</option>
              <option>Allowed</option>
              <option>Flagged</option>
              <option>Blocked</option>
            </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Client ID</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Device / Browser</th>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {logins.map((item) => (
                <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${item.status === 'Blocked' ? 'opacity-50' : ''}`}>
                  <td className="py-3 px-4 font-medium text-gray-900">{item.client}</td>
                  <td className="py-3 px-4 font-mono text-xs">{item.ip}</td>
                  <td className="py-3 px-4">
                     <span className="flex items-center gap-1 text-gray-600"><MapPin className="w-3 h-3"/> {item.location}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{item.device}</td>
                  <td className="py-3 px-4 text-gray-500">{item.time}</td>
                  <td className="py-3 px-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                       item.status === 'Allowed' ? 'bg-green-100 text-green-700' :
                       item.status === 'Blocked' ? 'bg-red-100 text-red-700' :
                       'bg-orange-100 text-orange-700'
                     }`}>
                        {item.status}
                     </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                     {item.status === 'Flagged' && (
                        <>
                           <button onClick={() => handleAllow(item.id)} className="text-green-600 hover:underline font-medium text-xs">Allow</button>
                           <button onClick={() => handleBlock(item.id, item.ip)} className="text-red-600 hover:underline font-medium text-xs">Block IP</button>
                        </>
                     )}
                     {item.status === 'Allowed' && (
                        <button onClick={() => handleBlock(item.id, item.ip)} className="text-red-600 hover:underline font-medium text-xs">Block IP</button>
                     )}
                     {item.status === 'Blocked' && (
                        <button onClick={() => handleAllow(item.id)} className="text-blue-600 hover:underline font-medium text-xs">Unblock</button>
                     )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add IP Rule Modal */}
      {showAddRule && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add IP Rule</h2>
              <button onClick={() => setShowAddRule(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IP Address or CIDR Range</label>
                <input type="text" placeholder="e.g. 103.45.67.0/24" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
                <select className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Allow (Whitelist)</option>
                  <option>Block (Blacklist)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
                <input type="text" placeholder="e.g. Office VPN" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setShowAddRule(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { alert('IP rule created successfully.'); setShowAddRule(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">Add Rule</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
