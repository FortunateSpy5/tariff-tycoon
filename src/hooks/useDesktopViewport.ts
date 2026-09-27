/**
 * Hook: useDesktopViewport
 * Manages desktop fullscreen responsive containment and sub-1080p metrics.
 * Uses requestAnimationFrame throttling to prevent unnecessary re-render churn during window resizing.
 */

import { useState, useEffect } from 'react';

export interface ViewportMetrics {
  width: number;
  height: number;
  scaleFactor: number;
  isCompactHeight: boolean;
}

export function useDesktopViewport(): ViewportMetrics {
  const [metrics, setMetrics] = useState<ViewportMetrics>(() => {
    const h = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const w = typeof window !== 'undefined' ? window.innerWidth : 1920;
    return {
      width: w,
      height: h,
      scaleFactor: h < 700 ? Math.max(0.85, h / 720) : 1,
      isCompactHeight: h < 840,
    };
  });

  useEffect(() => {
    let rafId: number | null = null;

    const handleResize = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const h = window.innerHeight;
        const w = window.innerWidth;
        const scale = h < 700 ? Math.max(0.85, h / 720) : 1;
        const isCompact = h < 840;

        setMetrics((prev) => {
          if (prev.scaleFactor === scale && prev.isCompactHeight === isCompact && Math.abs(prev.height - h) < 10) {
            return prev;
          }
          return {
            width: w,
            height: h,
            scaleFactor: scale,
            isCompactHeight: isCompact,
          };
        });
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return metrics;
}
