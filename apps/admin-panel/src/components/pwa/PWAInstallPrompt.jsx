import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

/**
 * PWAInstallPrompt
 * 
 * Shows a native-feeling bottom sheet to prompt users to install the PWA.
 * - Android Chrome / Desktop Chrome: captures the `beforeinstallprompt` event for install.
 * - iOS Safari: shows manual install instructions (no programmatic install API).
 * 
 * Dismissed state is persisted in localStorage for 7 days.
 */
export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed as PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
      || window.navigator.standalone === true;
    if (isPWA) { setIsInstalled(true); return; }

    // Check if dismissed recently (7-day cooldown)
    const dismissed = localStorage.getItem('pwa_admin_prompt_dismissed');
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Capture install prompt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Show after 3 seconds to not be intrusive
      setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // iOS: show instructions after 5 seconds (only in Safari)
    if (ios && !isPWA) {
      const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS/.test(navigator.userAgent);
      if (isSafari) {
        setTimeout(() => setShowBanner(true), 5000);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  useEffect(() => {
    const handleTriggerPrompt = () => {
      const isPWA = window.matchMedia('(display-mode: standalone)').matches
        || window.navigator.standalone === true;
      if (isPWA) {
        alert('Admin Panel is already installed!');
        return;
      }
      setShowBanner(true);
    };

    window.addEventListener('trigger-pwa-install-prompt', handleTriggerPrompt);
    return () => window.removeEventListener('trigger-pwa-install-prompt', handleTriggerPrompt);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_admin_prompt_dismissed', Date.now().toString());
  };

  if (!showBanner || isInstalled) return null;

  return (
    <>
      {/* Backdrop for mobile devices */}
      <div
        className="fixed inset-0 bg-gray-900/30 z-[90] md:hidden"
        onClick={handleDismiss}
      />

      {/* Bottom Sheet / Toast */}
      <div className="fixed bottom-0 left-0 right-0 z-[91] md:bottom-6 md:right-6 md:left-auto md:w-96 md:rounded-2xl shadow-2xl border border-gray-200 bg-white p-5 animate-slide-up">
        {/* Mobile handle bar */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden" />

        <div className="flex items-start gap-4">
          <img
            src="/icon-192.png"
            alt="Stocks Lab Admin"
            className="w-12 h-12 rounded-xl shadow-md flex-shrink-0 border border-gray-100"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-gray-900 font-bold text-base">Install Admin Panel</h3>
            <p className="text-gray-600 text-sm mt-1 leading-snug">
              Install the Stocks Lab Admin Panel for a faster, offline-capable dashboard.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-gray-600 text-sm text-center flex items-center justify-center gap-2">
              Tap <Share className="w-4 h-4 text-blue-500 inline" /> then
              <strong className="text-gray-900">"Add to Home Screen"</strong>
            </p>
          </div>
        ) : deferredPrompt ? (
          <button
            onClick={handleInstall}
            className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-sm"
          >
            <Download className="w-4.5 h-4.5" />
            Install App
          </button>
        ) : (
          <div className="mt-4 bg-gray-50 border border-gray-100 rounded-xl p-3">
            <p className="text-gray-600 text-sm text-center">
              Select <strong className="text-gray-900">"Install"</strong> in your browser's address bar to install.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
