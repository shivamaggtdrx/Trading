import React, { useState } from 'react';
import { Search, Star, MessageSquare, ThumbsUp, ThumbsDown, Filter, X } from 'lucide-react';

export default function ClientFeedback() {
  const [ratingFilter, setRatingFilter] = useState('All Ratings');
  const [showFollowUp, setShowFollowUp] = useState(null);

  const feedbacks = [
    { id: 1, client: 'TDX-101', agent: 'Support Jane', rating: 5, category: 'Withdrawal', comment: 'Fast resolution of my withdrawal issue. Thanks!', date: '2023-10-25 14:30' },
    { id: 2, client: 'TDX-105', agent: 'Support Mike', rating: 2, category: 'App Bug', comment: 'App keeps crashing on options chain page.', date: '2023-10-25 11:15' },
    { id: 3, client: 'TDX-112', agent: 'Support Sarah', rating: 4, category: 'KYC', comment: 'Good support but took 2 days for verification.', date: '2023-10-24 16:45' },
    { id: 4, client: 'TDX-089', agent: 'Support Jane', rating: 1, category: 'Trade Execution', comment: 'Slippage was too high on my market order.', date: '2023-10-24 09:20' },
  ];

  const filteredFeedbacks = feedbacks.filter(f => {
    if (ratingFilter === '5 Stars') return f.rating === 5;
    if (ratingFilter === '4 Stars') return f.rating === 4;
    if (ratingFilter === '3 Stars') return f.rating === 3;
    if (ratingFilter === '1-2 Stars (Critical)') return f.rating <= 2;
    return true;
  });

  const avgRating = (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1);

  const renderStars = (rating) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`w-4 h-4 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Feedback</h1>
          <p className="text-sm text-gray-500 mt-1">Collect and track client satisfaction after support interactions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><Star className="w-4 h-4 text-yellow-500" /> Avg Satisfaction</div>
          <div className="text-2xl font-bold text-gray-900">{avgRating} / 5.0</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><MessageSquare className="w-4 h-4 text-blue-500" /> Total Reviews</div>
          <div className="text-2xl font-bold text-gray-900">1,248</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><ThumbsUp className="w-4 h-4 text-green-500" /> Positive (4-5)</div>
          <div className="text-2xl font-bold text-green-600">{Math.round(feedbacks.filter(f => f.rating >= 4).length / feedbacks.length * 100)}%</div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-2 text-gray-500 mb-2 text-sm font-medium"><ThumbsDown className="w-4 h-4 text-red-500" /> Critical (1-2)</div>
          <div className="text-2xl font-bold text-red-600">{Math.round(feedbacks.filter(f => f.rating <= 2).length / feedbacks.length * 100)}%</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search comments or Client ID..." className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex items-center gap-3">
             <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="border border-gray-300 rounded-lg text-sm px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
               <option>All Ratings</option>
               <option>5 Stars</option>
               <option>4 Stars</option>
               <option>3 Stars</option>
               <option>1-2 Stars (Critical)</option>
             </select>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Support Agent</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4 w-1/3">Comment</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredFeedbacks.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-500 whitespace-nowrap">{item.date}</td>
                  <td className="py-3 px-4 font-medium text-gray-900">{item.client}</td>
                  <td className="py-3 px-4 text-gray-600">{item.agent}</td>
                  <td className="py-3 px-4">
                     <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{item.category}</span>
                  </td>
                  <td className="py-3 px-4">{renderStars(item.rating)}</td>
                  <td className="py-3 px-4 text-gray-600 truncate max-w-xs">{item.comment}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => setShowFollowUp(item)} className="text-blue-600 hover:underline font-medium text-xs">Follow Up</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Follow Up Modal */}
      {showFollowUp && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Follow Up — {showFollowUp.client}</h2>
              <button onClick={() => setShowFollowUp(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="text-xs text-gray-500">Original Comment ({showFollowUp.category})</div>
                <div className="text-sm text-gray-800 mt-1">"{showFollowUp.comment}"</div>
                <div className="mt-2">{renderStars(showFollowUp.rating)}</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Message</label>
                <textarea rows="3" placeholder="Type your follow-up response..." className="w-full border border-gray-300 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
              <button onClick={() => setShowFollowUp(null)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={() => { alert(`Follow-up sent to ${showFollowUp.client}`); setShowFollowUp(null); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Send Follow Up</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
