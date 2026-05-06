import React, { useState } from 'react';
import { Mail, Plus, Send, BarChart2, Users } from 'lucide-react';

export default function CampaignManager() {
  const campaigns = [
    { id: 1, name: 'Diwali Zero Brokerage Offer', audience: 'All Active Clients', sent: 12500, openRate: '45%', clickRate: '12%', status: 'Active' },
    { id: 2, name: 'Onboarding Welcome Drip', audience: 'New Signups', sent: 450, openRate: '68%', clickRate: '25%', status: 'Automated' },
    { id: 3, name: 'Inactive Account Reminder', audience: 'Dormant (>60 days)', sent: 3200, openRate: '18%', clickRate: '2%', status: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Campaign Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Create, schedule, and track automated marketing & onboarding emails.</p>
        </div>
        <button onClick={() => alert('Opening Campaign Builder...')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
          <Plus className="w-4 h-4" />
          Create Campaign
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600"><Send className="w-6 h-6" /></div>
            <div><div className="text-sm font-medium text-gray-500">Emails Sent (MTD)</div><div className="text-2xl font-bold text-gray-900">45,280</div></div>
         </div>
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600"><BarChart2 className="w-6 h-6" /></div>
            <div><div className="text-sm font-medium text-gray-500">Avg. Open Rate</div><div className="text-2xl font-bold text-gray-900">32.4%</div></div>
         </div>
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600"><Users className="w-6 h-6" /></div>
            <div><div className="text-sm font-medium text-gray-500">Subscribed Contacts</div><div className="text-2xl font-bold text-gray-900">18,450</div></div>
         </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
           <h3 className="text-sm font-bold text-gray-900">Recent Campaigns</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white text-gray-500 font-medium border-b border-gray-200 text-xs uppercase">
              <tr>
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Audience</th>
                <th className="py-3 px-4 text-center">Sent</th>
                <th className="py-3 px-4 text-center">Open Rate</th>
                <th className="py-3 px-4 text-center">Click Rate</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {campaigns.map(c => (
                 <tr key={c.id} className="hover:bg-gray-50">
                   <td className="py-4 px-4 font-bold text-gray-900">{c.name}</td>
                   <td className="py-4 px-4 text-gray-600">{c.audience}</td>
                   <td className="py-4 px-4 text-center font-medium">{c.sent.toLocaleString()}</td>
                   <td className="py-4 px-4 text-center font-bold text-green-600">{c.openRate}</td>
                   <td className="py-4 px-4 text-center font-bold text-blue-600">{c.clickRate}</td>
                   <td className="py-4 px-4 text-center">
                     <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                        c.status === 'Active' ? 'bg-green-50 text-green-700 border-green-200' : 
                        c.status === 'Automated' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                        'bg-gray-100 text-gray-600 border-gray-200'
                     }`}>{c.status}</span>
                   </td>
                   <td className="py-4 px-4 text-right">
                      <button onClick={() => alert('View full report')} className="text-blue-600 hover:underline text-xs font-bold">Report</button>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
