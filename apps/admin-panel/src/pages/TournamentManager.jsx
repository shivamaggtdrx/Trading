import React, { useState } from 'react';
import { Search, Trophy, Users, Calendar, Plus, Target, DollarSign, X } from 'lucide-react';

export default function TournamentManager() {
  const [showCreate, setShowCreate] = useState(false);

  const tournaments = [
    { id: 'T-101', name: 'Diwali Options Trading League', status: 'Active', participants: 450, prizePool: '₹5,00,000', end: '15 Nov 2023', minBalance: '₹50,000' },
    { id: 'T-102', name: 'Weekly Scalping Challenge', status: 'Registration', participants: 120, prizePool: '₹50,000', end: '30 Oct 2023', minBalance: '₹10,000' },
    { id: 'T-103', name: 'NIFTY Kings September', status: 'Completed', participants: 850, prizePool: '₹2,50,000', end: '30 Sep 2023', minBalance: '₹25,000' },
  ];

  const handleManage = (t) => alert(`Managing "${t.name}"\n\nStatus: ${t.status}\nParticipants: ${t.participants}\nPrize Pool: ${t.prizePool}\nEnds: ${t.end}`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tournament Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Create trading competitions with leaderboards, prizes, and rules to drive engagement.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" />
            Create Tournament
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-gray-500 font-medium">Active Tournaments</div><div className="text-2xl font-bold mt-1">{tournaments.filter(t => t.status !== 'Completed').length}</div></div>
            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600"><Trophy className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-gray-500 font-medium">Total Participants</div><div className="text-2xl font-bold mt-1">{tournaments.reduce((s, t) => s + t.participants, 0).toLocaleString('en-IN')}</div></div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600"><Users className="w-6 h-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
            <div><div className="text-sm text-gray-500 font-medium">Total Prize Distributed</div><div className="text-2xl font-bold mt-1">₹12.5L</div></div>
            <div className="w-12 h-12 bg-yellow-50 rounded-full flex items-center justify-center text-yellow-600"><DollarSign className="w-6 h-6" /></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search tournaments..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Status</option><option>Active</option><option>Registration Open</option><option>Completed</option>
          </select>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Tournament</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Participants</th>
                <th className="py-3 px-4">Prize Pool</th>
                <th className="py-3 px-4">Min. Balance</th>
                <th className="py-3 px-4">End Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tournaments.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4"><div className="font-bold text-gray-900">{item.name}</div><div className="text-gray-500 text-xs mt-0.5">{item.id}</div></td>
                  <td className="py-3 px-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'Active' ? 'bg-green-100 text-green-700' : item.status === 'Registration' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{item.status}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-medium"><div className="flex items-center justify-center gap-1"><Users className="w-3 h-3 text-gray-400"/> {item.participants}</div></td>
                  <td className="py-3 px-4 font-bold text-yellow-600">{item.prizePool}</td>
                  <td className="py-3 px-4 text-gray-600">{item.minBalance}</td>
                  <td className="py-3 px-4 text-gray-600"><div className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {item.end}</div></td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleManage(item)} className="text-blue-600 hover:underline font-medium text-xs">Manage</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Tournament Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create Tournament</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tournament Name</label>
                <input type="text" placeholder="e.g. Weekly Options Challenge" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prize Pool (₹)</label>
                  <input type="number" placeholder="50000" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min. Balance (₹)</label>
                  <input type="number" placeholder="10000" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label><input type="date" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { alert('Tournament created!'); setShowCreate(false); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">Create Tournament</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
