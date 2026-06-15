import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Filter, MoreVertical, Edit, Ban, RefreshCw, ChevronDown, Activity } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Users() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [searchTerm]);

  const fetchUsers = async () => {
    try {
      const data = await adminApi.getUsers(1, 50, searchTerm);
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    if (!window.confirm(`Are you sure you want to ${nextStatus === 'blocked' ? 'BLOCK' : 'UNBLOCK'} this user?`)) {
      return;
    }
    try {
      await adminApi.updateUserStatus(userId, nextStatus);
      alert(`User status updated to ${nextStatus}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status: ' + (err.message || err));
    }
  };

  const handleExport = () => {
    if (users.length === 0) return alert('No users to export.');
    const headers = ['Client ID', 'Email', 'Status', 'Balance (INR)', 'Created At'];
    const rows = users.map(user => [
      user.client_id || '',
      user.email || '',
      user.status || 'active',
      (Array.isArray(user.wallets) ? user.wallets[0] : user.wallets)?.balance || 0,
      new Date(user.created_at).toLocaleDateString()
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `users_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = users.filter(user => {
    const balance = (Array.isArray(user.wallets) ? user.wallets[0] : user.wallets)?.balance || 0;
    
    if (statusFilter && user.status !== statusFilter) return false;
    
    if (balanceFilter === 'high' && balance <= 1000000) return false;
    if (balanceFilter === 'medium' && (balance < 10000 || balance > 1000000)) return false;
    if (balanceFilter === 'low' && balance >= 10000) return false;
    
    if (activityFilter === 'high' && balance <= 100000) return false;
    if (activityFilter === 'medium' && (balance <= 10000 || balance > 100000)) return false;
    if (activityFilter === 'low' && balance > 10000) return false;
    
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
        <button onClick={handleExport} className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 h-9 px-4">
          Export Users
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Advanced Filters */}
        <div className="p-3 border-b border-gray-200 grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50/50">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search email or ID..."
              className="block w-full pl-9 pr-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 focus:outline-none"
          >
            <option value="">Status: All</option>
            <option value="active">Active</option>
            <option value="blocked">Blocked</option>
            <option value="suspended">Suspended</option>
          </select>
          
          <select 
            value={balanceFilter}
            onChange={e => setBalanceFilter(e.target.value)}
            className="block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 focus:outline-none"
          >
            <option value="">Balance: Any</option>
            <option value="high">&gt; ₹10,00,000</option>
            <option value="medium">₹10,000 - ₹10,00,000</option>
            <option value="low">&lt; ₹10,000</option>
          </select>
 
          <select 
            value={activityFilter}
            onChange={e => setActivityFilter(e.target.value)}
            className="block w-full px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-950 focus:outline-none"
          >
            <option value="">Activity: All</option>
            <option value="high">High Activity</option>
            <option value="medium">Medium Activity</option>
            <option value="low">Low/None</option>
          </select>
        </div>

        {/* Data-Dense Table */}
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left whitespace-nowrap">
            <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
              <tr>
                <th className="px-4 py-2 font-semibold">Client ID</th>
                <th className="px-4 py-2 font-semibold">Email</th>
                <th className="px-4 py-2 font-semibold">Status</th>
                <th className="px-4 py-2 font-semibold text-right">Balance (INR)</th>
                <th className="px-4 py-2 font-semibold text-center">Activity</th>
                <th className="px-4 py-2 font-semibold">Joined</th>
                <th className="px-4 py-2 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="px-4 py-2">
                    <Link to={`/users/${user.id}`} className="font-medium text-blue-600 hover:text-blue-800">
                      {user.client_id || user.id.slice(0,8)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-gray-600 truncate max-w-xs">{user.email}</td>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' :
                      user.status === 'blocked' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {user.status || 'active'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">
                    ₹{((Array.isArray(user.wallets) ? user.wallets[0] : user.wallets)?.balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <Activity className={`h-4 w-4 inline-block ${
                      ((Array.isArray(user.wallets) ? user.wallets[0] : user.wallets)?.balance || 0) > 100000 ? 'text-green-500' : 
                      ((Array.isArray(user.wallets) ? user.wallets[0] : user.wallets)?.balance || 0) > 10000 ? 'text-yellow-500' : 'text-gray-300'
                    }`} />
                  </td>
                  <td className="px-4 py-2 text-xs text-gray-500">{new Date(user.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate(`/users/${user.id}`)} 
                        className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-white" 
                        title="Edit / View Details"
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(user.id, user.status)} 
                        className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-white" 
                        title={user.status === 'blocked' ? 'Activate' : 'Block'}
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </button>
                    </div>
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
