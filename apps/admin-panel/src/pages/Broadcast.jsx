import { useState, useEffect } from 'react';
import { Megaphone, Send, Bell, Info, AlertTriangle, Loader2 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Broadcast() {
  const [msgType, setMsgType] = useState('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetAudience, setTargetAudience] = useState('all');
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getNotifications();
      setNotifications(data.notifications || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!title || !message) return alert('Title and message are required');
    setSubmitting(true);
    try {
      await adminApi.sendBroadcast({ title, message, type: msgType, target_audience: targetAudience });
      setTitle('');
      setMessage('');
      fetchNotifications();
      alert('Broadcast sent!');
    } catch (err) {
      alert('Failed to send broadcast');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcast & Announcements</h1>
          <p className="text-sm text-gray-500 mt-1">Push notifications, alerts, and banners directly to client terminals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-600" />
            Compose Message
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Message Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="msgType" value="info" checked={msgType === 'info'} onChange={() => setMsgType('info')} className="text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm font-medium text-gray-700">Information</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="msgType" value="warning" checked={msgType === 'warning'} onChange={() => setMsgType('warning')} className="text-orange-600 focus:ring-orange-500" />
                  <span className="text-sm font-medium text-gray-700">Warning / Alert</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="msgType" value="system" checked={msgType === 'system'} onChange={() => setMsgType('system')} className="text-red-600 focus:ring-red-500" />
                  <span className="text-sm font-medium text-gray-700">Critical System Notice</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Target Audience</label>
              <select value={targetAudience} onChange={e => setTargetAudience(e.target.value)} className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500 font-medium">
                <option value="all">All Active Users</option>
                <option value="specific_master">Specific Master Network</option>
                <option value="open_positions">Users with Open Positions</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Message Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} type="text" placeholder="e.g., Market Holiday Tomorrow" className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500" />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Message Body</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} rows="4" placeholder="Type your announcement here..." className="w-full border border-gray-300 rounded p-2 text-sm focus:ring-blue-500"></textarea>
            </div>

            <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-gray-50">
              <div>
                <h4 className="text-sm font-bold text-gray-900">Pin as Banner</h4>
                <p className="text-xs text-gray-500 mt-1">Show this persistently at the top of the trading terminal.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <button onClick={handleSend} disabled={submitting} className="w-full bg-blue-600 text-white font-bold py-3 rounded shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
              <Send className="h-4 w-4" /> {submitting ? 'Sending...' : 'Send Broadcast Now'}
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-2">
              <Bell className="h-5 w-5 text-gray-500" />
              <h2 className="text-lg font-bold text-gray-900">Recent Broadcasts</h2>
            </div>
            <div className="p-0">
              <ul className="divide-y divide-gray-100">
                {loading ? (
                  <li className="p-4 text-center text-gray-500">Loading broadcasts...</li>
                ) : notifications.length > 0 ? notifications.map(n => (
                  <li key={n.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start gap-3">
                      {n.type === 'warning' || n.type === 'alert' ? <AlertTriangle className={`h-5 w-5 mt-0.5 ${n.type==='alert' ? 'text-red-500' : 'text-orange-500'}`} /> : <Info className="h-5 w-5 text-blue-500 mt-0.5" />}
                      <div>
                        <div className="font-bold text-sm text-gray-900">{n.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{n.message}</div>
                        <div className="text-xs text-gray-400 mt-2">Sent to: {n.target_audience} • {new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  </li>
                )) : (
                  <li className="p-4 text-center text-gray-500">No broadcasts found</li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
