import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

/**
 * PWAUpdatePrompt
 * 
 * When vite-plugin-pwa detects a new service worker version, this component
 * shows a non-intrusive notification asking the admin to reload.
 */
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Admin SW registered:', r);
    },
    onRegisterError(error) {
      console.warn('⚠️ Admin SW registration error:', error);
    },
  });

  const dismiss = () => setNeedRefresh(false);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-80 z-[95] animate-slide-up">
      <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-2xl flex items-start gap-3">
        <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900 font-bold text-sm">Update Available</p>
          <p className="text-gray-500 text-xs mt-0.5">A new version of the Admin Panel is ready.</p>
          <button
            onClick={() => updateServiceWorker(true)}
            className="mt-2 text-xs font-bold text-blue-600 hover:underline"
          >
            Reload to update →
          </button>
        </div>
        <button onClick={dismiss} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
