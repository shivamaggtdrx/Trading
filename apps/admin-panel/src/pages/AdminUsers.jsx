import React, { useState } from 'react';
import { Search, Plus, Shield, UserCog, MoreHorizontal, Key, Trash2, Power } from 'lucide-react';

export default function AdminUsers() {
  const [showAddModal, setShowAddModal] = useState(false);

  const admins = [
    { id: 'ADM-001', name: 'Shivam', email: 'admin@tradex.com', role: 'Super Admin', status: 'Active', lastLogin: '6 May, 11:30 AM', ip: '103.45.67.89', created: '15 Jan 2023' },
    { id: 'ADM-002', name: 'Priya Patel', email: 'risk@tradex.com', role: 'Risk Manager', status: 'Active', lastLogin: '6 May, 09:15 AM', ip: '103.45.67.102', created: '20 Mar 2023' },
    { id: 'ADM-003', name: 'Amit Singh', email: 'support@tradex.com', role: 'Support Agent', status: 'Active', lastLogin: '5 May, 04:30 PM', ip: '45.112.33.1', created: '10 Jun 2023' },
    { id: 'ADM-004', name: 'Neha Gupta', email: 'finance@tradex.com', role: 'Finance', status: 'Inactive', lastLogin: '28 Apr, 02:00 PM', ip: '182.71.25.60', created: '05 Aug 2023' },
    { id: 'ADM-005', name: 'Vikram Rao', email: 'audit@tradex.com', role: 'Compliance', status: 'Active', lastLogin: '6 May, 10:45 AM', ip: '103.45.67.95', created: '12 Sep 2023' },
  ];

  const roles = ['Super Admin', 'Risk Manager', 'Support Agent', 'Finance', 'Compliance', 'View Only'];

  const getRoleBadge = (role) => {
    const colors = {
      'Super Admin': 'bg-red-100 text-red-700 border-red-200',
      'Risk Manager': 'bg-orange-100 text-orange-700 border-orange-200',
      'Support Agent': 'bg-blue-100 text-blue-700 border-blue-200',
      'Finance': 'bg-green-100 text-green-700 border-green-200',
      'Compliance': 'bg-purple-100 text-purple-700 border-purple-200',
      'View Only': 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return colors[role] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin User Management</h1>
          <p className="text-sm text-gray-500 mt-1">Add, remove, and manage admin staff accounts and their roles.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Admin User
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <UserCog className="w-4 h-4 text-blue-500" /> Total Admins
          </div>
          <div className="text-2xl font-bold text-gray-900">{admins.length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <Power className="w-4 h-4 text-green-500" /> Active Now
          </div>
          <div className="text-2xl font-bold text-green-600">{admins.filter(a => a.status === 'Active').length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <Shield className="w-4 h-4 text-red-500" /> Super Admins
          </div>
          <div className="text-2xl font-bold text-gray-900">{admins.filter(a => a.role === 'Super Admin').length}</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium">
            <Key className="w-4 h-4 text-orange-500" /> Roles Defined
          </div>
          <div className="text-2xl font-bold text-gray-900">{roles.length}</div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search admin by name or email..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>All Roles</option>
            {roles.map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Admin</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4">Last IP</th>
                <th className="py-3 px-4">Created</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {admins.map((admin) => (
                <tr key={admin.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-bold">
                        {admin.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-bold text-gray-900">{admin.name}</div>
                        <div className="text-xs text-gray-500">{admin.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getRoleBadge(admin.role)}`}>
                      {admin.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${admin.status === 'Active' ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className={`text-xs font-medium ${admin.status === 'Active' ? 'text-green-700' : 'text-gray-500'}`}>
                        {admin.status}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{admin.lastLogin}</td>
                  <td className="py-3 px-4 font-mono text-xs text-gray-500">{admin.ip}</td>
                  <td className="py-3 px-4 text-gray-500">{admin.created}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => { if(window.confirm(`Send password reset link to ${admin.email}?`)) alert('Reset link sent successfully.'); }} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Reset Password">
                        <Key className="w-4 h-4" />
                      </button>
                      <button onClick={() => alert(`Edit role for ${admin.name}. Currently: ${admin.role}`)} className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Edit Role">
                        <UserCog className="w-4 h-4" />
                      </button>
                      {admin.role !== 'Super Admin' && (
                        <button onClick={() => { if(window.confirm(`Remove admin access for ${admin.name}? This action cannot be undone.`)) alert('Admin account removed.'); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Admin Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 mx-4">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add New Admin User</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Rahul" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input type="text" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Sharma" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="user@tradex.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign Role</label>
                <select className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {roles.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temporary Password</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono" value="Temp@12345" readOnly />
                <p className="text-xs text-gray-400 mt-1">User will be forced to reset on first login.</p>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
                Create Admin Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
