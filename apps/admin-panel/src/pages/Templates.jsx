import { useState, useEffect } from 'react';
import { Mail, MessageSquare, Save, Settings, Variable, Edit3 } from 'lucide-react';
import { adminApi } from '../services/adminApi';

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [activeTemplate, setActiveTemplate] = useState(null);
  const [content, setContent] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getNotificationTemplates()
      .then(res => {
        const tpls = res.templates || res.data || [];
        setTemplates(tpls);
        if (tpls.length > 0) {
          setActiveTemplate(tpls[0]);
          setContent(tpls[0].body_template || '');
          setSubject(tpls[0].subject_template || '');
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleTemplateSelect = (tpl) => {
    setActiveTemplate(tpl);
    setContent(tpl.body_template || '');
    setSubject(tpl.subject_template || '');
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-medium">Loading Templates...</div>;
  if (!activeTemplate) return <div className="p-8 text-center text-gray-500 font-medium">No templates found.</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">SMS / Email Templates</h1>
          <p className="text-sm text-gray-500 mt-1">Manage automated communication sent to clients.</p>
        </div>
        <button onClick={() => alert('Save coming soon')} className="inline-flex items-center justify-center rounded-md text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 h-10 px-6 py-2 shadow-sm">
          <Save className="h-4 w-4 mr-2" />
          Save Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-bold text-gray-900">System Templates</h2>
            <button onClick={() => alert('New coming soon')} className="text-xs font-bold text-blue-600 hover:text-blue-800">+ New</button>
          </div>
          <div className="divide-y divide-gray-100">
            {templates.map(tpl => (
              <button 
                key={tpl.id} 
                onClick={() => handleTemplateSelect(tpl)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${activeTemplate.id === tpl.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`font-bold text-sm ${activeTemplate.id === tpl.id ? 'text-blue-900' : 'text-gray-900'}`}>{tpl.name}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${tpl.type === 'email' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-green-700'}`}>
                    {tpl.type === 'email' ? <Mail className="h-3 w-3 inline mr-1"/> : <MessageSquare className="h-3 w-3 inline mr-1"/>}
                    {tpl.type}
                  </span>
                </div>
                <div className="text-xs text-gray-500 truncate">ID: {tpl.id.slice(0,8)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 pb-4">
              <Edit3 className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Edit Template: <span className="text-blue-600">{activeTemplate.name}</span></h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Template ID</label>
                  <input type="text" value={activeTemplate.id} disabled className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded text-sm text-gray-500 font-mono" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Channel</label>
                  <select value={activeTemplate.type} disabled className="w-full px-3 py-2 border border-gray-300 bg-gray-50 rounded text-sm font-medium">
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>
              </div>

              {activeTemplate.type === 'email' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Email Subject</label>
                  <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded text-sm font-medium focus:ring-blue-500" />
                </div>
              )}

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-bold text-gray-700">Message Body</label>
                </div>
                <textarea 
                  rows="10" 
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:ring-blue-500 font-mono" 
                />
              </div>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg border border-gray-200 shadow-sm p-4">
            <h3 className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-2"><Variable className="h-4 w-4"/> Available Variables</h3>
            <div className="flex flex-wrap gap-2">
              {['{{client_name}}', '{{client_id}}', '{{margin_usage}}', '{{available_balance}}', '{{utr_number}}', '{{amount}}'].map(v => (
                <span key={v} className="px-2 py-1 bg-white border border-gray-300 rounded text-xs font-mono text-blue-600 cursor-pointer hover:bg-blue-50">{v}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
