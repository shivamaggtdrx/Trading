import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X } from 'lucide-react';

/**
 * PWAUpdatePrompt
 * 
 * When vite-plugin-pwa detects a new service worker version, this component
 * shows a non-intrusive bottom notification asking the user to reload.
 */
export default function PWAUpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('✅ Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.warn('⚠️ SW registration error:', error);
    },
  });

  const dismiss = () => setNeedRefresh(false);

  useEffect(() => {
    if (needRefresh) {
      console.log('🔄 New version detected! Auto-reloading to apply update...');
      updateServiceWorker(true);
    }
  }, [needRefresh, updateServiceWorker]);

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-4 left-4 right-4 lg:left-auto lg:right-4 lg:w-80 z-[95] animate-slide-up">
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 shadow-2xl flex items-start gap-3">
        <div className="p-2 bg-[#f06428]/10 rounded-lg flex-shrink-0">
          <RefreshCw className="w-5 h-5 text-[#f06428]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-sm">Update Available</p>
          <p className="text-gray-400 text-xs mt-0.5">A new version of Stocks Lab is ready.</p>
          <button
            onClick={() => updateServiceWorker(true)}
            className="mt-2 text-xs font-bold text-[#f06428] hover:underline"
          >
            Reload to update →
          </button>
        </div>
        <button onClick={dismiss} className="text-gray-500 hover:text-gray-300 flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
