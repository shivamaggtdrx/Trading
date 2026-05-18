import { useState, useEffect } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * OfflineBanner
 * 
 * Listens to the browser's online/offline events and shows a non-blocking
 * banner at the top of the app when the network is unavailable.
 * 
 * When back online, shows a "Back online" confirmation briefly before hiding.
 */
export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showRestored, setShowRestored] = useState(false);

  useEffect(() => {
    const handleOffline = () => setIsOnline(false);
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestored(true);
      setTimeout(() => setShowRestored(false), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  if (isOnline && !showRestored) return null;

  if (showRestored) {
    return (
      <div className="bg-green-600 text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2 animate-fade-in">
        <RefreshCw className="w-3.5 h-3.5" />
        Connection restored — prices are live again
      </div>
    );
  }

  return (
    <div className="bg-red-700 text-white text-xs font-bold py-2 px-4 flex items-center justify-center gap-2">
      <WifiOff className="w-3.5 h-3.5" />
      No internet connection — showing cached data
    </div>
  );
}
