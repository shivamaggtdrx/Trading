import { useState, useRef, useCallback } from 'react';

/**
 * usePullToRefresh
 * 
 * A lightweight pull-to-refresh hook for touch devices.
 * 
 * Usage:
 *   const { containerProps, isRefreshing, pullProgress } = usePullToRefresh(onRefresh);
 *   <div {...containerProps}>...</div>
 *
 * @param {Function} onRefresh - async function called when pull threshold is reached
 * @param {Object}   options
 * @param {number}   options.threshold  - pull distance (px) to trigger refresh (default: 80)
 * @param {boolean}  options.enabled    - disable on desktop (default: true)
 */
export function usePullToRefresh(onRefresh, { threshold = 80, enabled = true } = {}) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(null);
  const isTouching = useRef(false);

  const pullProgress = Math.min(pullDistance / threshold, 1);

  const handleTouchStart = useCallback((e) => {
    if (!enabled || isRefreshing) return;
    // Only activate when scrolled to top
    const el = e.currentTarget;
    if (el.scrollTop > 0) return;
    startY.current = e.touches[0].clientY;
    isTouching.current = true;
  }, [enabled, isRefreshing]);

  const handleTouchMove = useCallback((e) => {
    if (!isTouching.current || startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy < 0) {
      // User is scrolling down — reset
      startY.current = null;
      isTouching.current = false;
      setPullDistance(0);
      return;
    }
    // Apply resistance (square root feel)
    setPullDistance(Math.sqrt(dy) * 6);
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (!isTouching.current) return;
    isTouching.current = false;
    startY.current = null;

    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(0);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    } else {
      setPullDistance(0);
    }
  }, [pullDistance, threshold, onRefresh]);

  const containerProps = {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    style: {
      transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance, threshold)}px)` : undefined,
      transition: isTouching.current ? 'none' : 'transform 0.3s ease',
    },
  };

  return { containerProps, isRefreshing, pullProgress };
}

/**
 * PullIndicator — the spinning/loading indicator shown during pull
 */
export function PullIndicator({ progress, pullProgress, isRefreshing }) {
  const actualProgress = progress !== undefined ? progress : (pullProgress !== undefined ? pullProgress : 0);
  if (actualProgress === 0 && !isRefreshing) return null;

  return (
    <div
      className="absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-10"
      style={{
        height: 48,
        transform: `translateY(${isRefreshing ? 0 : (actualProgress - 1) * 48}px)`,
        transition: isRefreshing ? 'none' : 'transform 0.3s ease',
      }}
    >
      <div
        className={`w-7 h-7 rounded-full border-2 border-gray-300 border-t-[#f06428] ${isRefreshing ? 'animate-spin' : ''}`}
        style={{
          transform: isRefreshing ? undefined : `rotate(${actualProgress * 360}deg)`,
        }}
      />
    </div>
  );
}
