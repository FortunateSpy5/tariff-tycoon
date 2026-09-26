/**
 * Game Loop Hook: Drives real-time ticks for passive income, market noise, and frenzy countdowns.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

export function useGameLoop() {
  const tickDesk = useGameStore((s) => s.tickDesk);
  const tickMarket = useGameStore((s) => s.tickMarket);
  const updateLastSaved = useGameStore((s) => s.updateLastSaved);

  const lastTickRef = useRef<number>(Date.now());
  const saveCounterRef = useRef<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.min(1.0, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      // Tick desk and market subsystems
      tickDesk(deltaSeconds);
      tickMarket(deltaSeconds);

      // Periodically update last saved timestamp for offline persistence
      saveCounterRef.current += deltaSeconds;
      if (saveCounterRef.current >= 5) {
        updateLastSaved();
        saveCounterRef.current = 0;
      }
    }, 100);

    return () => clearInterval(interval);
  }, [tickDesk, tickMarket, updateLastSaved]);
}
