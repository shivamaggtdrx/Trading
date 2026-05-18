import { useState, useEffect } from 'react';
import { Download, X, Share } from 'lucide-react';

/**
 * PWAInstallPrompt
 * 
 * Shows a native-feeling bottom sheet to prompt users to install the PWA.
 * - Android Chrome: captures the `beforeinstallprompt` event for one-click install.
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
    const dismissed = localStorage.getItem('pwa_prompt_dismissed');
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < 7 * 24 * 60 * 60 * 1000) return;
    }

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Android: Capture install prompt
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
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (!showBanner || isInstalled) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[90] lg:hidden"
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[91] lg:hidden animate-slide-up">
        <div className="bg-[#161b22] border-t border-[#30363d] rounded-t-2xl p-5 pb-8 shadow-2xl">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-gray-600 rounded-full mx-auto mb-4" />

          <div className="flex items-start gap-4">
            <img
              src="/icon-192.png"
              alt="Stocks Lab"
              className="w-14 h-14 rounded-2xl shadow-lg flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base">Add to Home Screen</h3>
              <p className="text-gray-400 text-sm mt-1 leading-snug">
                Install Stocks Lab for a faster, app-like experience with offline access.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-gray-500 hover:text-gray-300 p-1 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {isIOS ? (
            <div className="mt-4 bg-[#0d1117] border border-[#30363d] rounded-xl p-3">
              <p className="text-gray-300 text-sm text-center flex items-center justify-center gap-2">
                Tap <Share className="w-4 h-4 text-blue-400 inline" /> then
                <strong className="text-white">"Add to Home Screen"</strong>
              </p>
            </div>
          ) : (
            <button
              onClick={handleInstall}
              className="mt-4 w-full bg-[#f06428] hover:bg-[#d4541f] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-[0.98]"
            >
              <Download className="w-5 h-5" />
              Install App
            </button>
          )}
        </div>
      </div>
    </>
  );
}
