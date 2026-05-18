import { useState, useEffect } from 'react';
import { Image, Target, Calendar, Play, Pause, Trash2, Plus, X, Loader2 } from 'lucide-react';
import { adminApi } from '../../services/adminApi';

export default function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: '', image_url: '', target_url: '', status: 'active' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBanners();
  }, []);

  const fetchBanners = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getCrmModule('banners');
      setBanners(res.banners || []);
    } catch (err) {
      console.error('Failed to fetch banners:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      await adminApi.updateCrmModule('banners', id, { status: newStatus });
      setBanners(banners.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (err) {
      console.error('Failed to update banner status:', err);
      alert('Failed to update banner status');
    }
  };

  const deleteBanner = async (id, title) => {
    if (window.confirm(`Delete banner "${title}"? This cannot be undone.`)) {
      try {
        await adminApi.deleteCrmModule('banners', id);
        setBanners(banners.filter(b => b.id !== id));
      } catch (err) {
        console.error('Failed to delete banner:', err);
        alert('Failed to delete banner');
      }
    }
  };

  const handleCreate = async () => {
    if (!newBanner.title) return alert('Title is required');
    try {
      setCreating(true);
      const res = await adminApi.createCrmModule('banners', newBanner);
      if (res.data) {
        setBanners([res.data, ...banners]);
      }
      setShowCreate(false);
      setNewBanner({ title: '', image_url: '', target_url: '', status: 'active' });
    } catch (err) {
      console.error('Failed to create banner:', err);
      alert('Failed to create banner');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Banner Management</h1>
          <p className="text-sm text-gray-500 mt-1">Control promotional and informational banners shown in the trader app.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-4 py-2 shadow-sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Banner
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden md:col-span-2">
          <div className="p-4 border-b border-gray-200 bg-gray-50/50">
            <h2 className="text-sm font-bold text-gray-900">Active & Scheduled Banners</h2>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8 text-gray-500">
                <Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading banners...
              </div>
            ) : (
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead className="text-[11px] text-gray-500 uppercase bg-gray-100 border-b border-gray-200 tracking-wider">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Preview</th>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Target URL</th>
                    <th className="px-4 py-3 font-semibold text-center">Priority</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {banners.map(b => (
                    <tr key={b.id} className={`hover:bg-gray-50 ${b.status === 'paused' ? 'opacity-60' : ''}`}>
                      <td className="px-4 py-3">
                        {b.image_url ? (
                          <div className="w-16 h-8 rounded border border-gray-200 overflow-hidden">
                            <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-16 h-8 bg-blue-100 border border-blue-200 rounded flex items-center justify-center text-blue-500">
                            <Image className="h-4 w-4" />
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-gray-900">{b.title}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {b.target_url || <span className="text-gray-400 italic">No URL</span>}
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-gray-700">{b.priority || 0}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wide ${
                          b.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' :
                          b.status === 'scheduled' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <button onClick={() => toggleStatus(b.id, b.status)} className={`p-1.5 rounded ${b.status === 'active' ? 'hover:bg-orange-50 text-orange-600' : 'hover:bg-green-50 text-green-600'}`} title={b.status === 'active' ? 'Pause' : 'Activate'}>
                            {b.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                          </button>
                          <button onClick={() => deleteBanner(b.id, b.title)} className="p-1.5 rounded hover:bg-red-50 text-red-600" title="Delete">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {banners.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No banners created yet.</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Create Banner Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Create Banner</h2>
              <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banner Title</label>
                <input type="text" value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} placeholder="e.g. Summer Trading Offer" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                <input type="text" value={newBanner.image_url} onChange={(e) => setNewBanner({ ...newBanner, image_url: e.target.value })} placeholder="https://..." className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target URL</label>
                <input type="text" value={newBanner.target_url} onChange={(e) => setNewBanner({ ...newBanner, target_url: e.target.value })} placeholder="/trade/NIFTY" className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
              <button onClick={() => setShowCreate(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleCreate} disabled={creating} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50 flex items-center">
                {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                {creating ? 'Creating...' : 'Create Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
