/**
 * Hook: useDesktopViewport
 * Manages desktop fullscreen responsive containment and sub-1080p scaling.
 * If vertical height is below 840px (common on laptops), calculates a gentle
 * scale factor so all panels and controls remain 100% visible with zero scrolling.
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
      scaleFactor: h < 840 ? Math.max(0.75, Math.min(1, h / 860)) : 1,
      isCompactHeight: h < 840,
    };
  });

  useEffect(() => {
    const handleResize = () => {
      const h = window.innerHeight;
      const w = window.innerWidth;
      const scale = h < 840 ? Math.max(0.75, Math.min(1, h / 860)) : 1;

      setMetrics({
        width: w,
        height: h,
        scaleFactor: scale,
        isCompactHeight: h < 840,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return metrics;
}
