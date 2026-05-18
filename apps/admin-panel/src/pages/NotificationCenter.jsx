import React, { useState, useEffect } from 'react';
import { Bell, Search, AlertCircle, ArrowDownCircle, ShieldAlert, Settings, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getAlerts();
      setNotifications(data.alerts.map(a => ({
        id: a.id,
        title: a.type,
        message: a.description,
        type: a.severity?.toLowerCase() === 'critical' ? 'critical' : a.severity?.toLowerCase() === 'high' ? 'warning' : 'info',
        time: a.created_at,
        read: a.status === 'resolved'
      })) || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAsRead = async (id) => {
    try {
      await adminApi.resolveAlert(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = () => {
    notifications.filter(n => !n.read).forEach(n => markAsRead(n.id));
  };
  
  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'critical') return n.type === 'critical';
    if (activeFilter === 'withdrawals') return n.title && n.title.toLowerCase().includes('withdrawal');
    return true;
  });

  const getIcon = (type) => {
    switch(type) {
      case 'critical': return <ShieldAlert className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'info': return <CheckCircle2 className="w-5 h-5 text-blue-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const filters = [
    { key: 'all', label: 'All Notifications', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'critical', label: 'Critical Alerts', count: notifications.filter(n => n.type === 'critical').length },
    { key: 'withdrawals', label: 'Withdrawals', count: notifications.filter(n => n.title.toLowerCase().includes('withdrawal')).length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notification Center</h1>
          <p className="text-sm text-gray-500 mt-1">Unified inbox of all system alerts, margin calls, and requests.</p>
        </div>
        <div className="flex gap-3">
           <button onClick={markAllRead} disabled={unreadCount === 0} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
            <CheckCircle2 className="w-4 h-4" />
            Mark all as read
          </button>
          <button onClick={() => alert('Alert settings panel coming soon.')} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Settings className="w-4 h-4" />
            Alert Settings
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex h-[600px]">
        {/* Sidebar Filters */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 flex flex-col gap-2">
           <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Filters</div>
           {filters.map(f => (
             <button key={f.key} onClick={() => setActiveFilter(f.key)} className={`flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeFilter === f.key ? 'bg-blue-100 text-blue-700' : 'text-gray-700 hover:bg-gray-200'}`}>
               <span>{f.label}</span>
               <span className={`py-0.5 px-2 rounded-full text-xs ${activeFilter === f.key ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'}`}>{f.count}</span>
             </button>
           ))}
        </div>

        {/* Notifications List */}
        <div className="flex-1 flex flex-col overflow-hidden">
           <div className="p-4 border-b border-gray-200">
             <div className="relative">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input type="text" placeholder="Search alerts..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
             </div>
           </div>
           
           <div className="flex-1 overflow-y-auto">
              <div className="divide-y divide-gray-100">
                 {filteredNotifications.map((notif) => (
                    <div key={notif.id} className={`p-4 flex gap-4 transition-colors hover:bg-gray-50 cursor-pointer ${!notif.read ? 'bg-blue-50/50' : 'bg-white'}`}>
                       <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                          ${notif.type === 'critical' ? 'bg-red-100' : notif.type === 'warning' ? 'bg-orange-100' : 'bg-blue-100'}`}>
                          {getIcon(notif.type)}
                       </div>
                       <div className="flex-1">
                          <div className="flex justify-between items-start">
                             <h4 className={`text-sm font-medium ${!notif.read ? 'text-gray-900 font-bold' : 'text-gray-800'}`}>{notif.title}</h4>
                             <span className="text-xs text-gray-500 whitespace-nowrap">{new Date(notif.time).toLocaleString([], {month:'short', day:'numeric', hour:'2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                          <div className="mt-2 flex gap-3">
                             <button onClick={() => alert(`Viewing details for: ${notif.title}`)} className="text-xs font-medium text-blue-600 hover:underline">View Details</button>
                             {!notif.read && <button onClick={() => markAsRead(notif.id)} className="text-xs font-medium text-gray-500 hover:underline">Mark as read</button>}
                          </div>
                       </div>
                       {!notif.read && (
                          <div className="flex-shrink-0 w-2.5 h-2.5 bg-blue-500 rounded-full mt-2"></div>
                       )}
                    </div>
                 ))}
                 {filteredNotifications.length === 0 && (
                   <div className="p-8 text-center text-gray-400">No notifications match this filter.</div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
