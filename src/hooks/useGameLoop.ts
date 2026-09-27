/**
 * Game Loop Hook: Drives real-time ticks for passive income, market noise, and frenzy countdowns.
 * Includes visibilitychange listener to ensure offline/background tabs catch up seamlessly.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

export function useGameLoop() {
  const lastTickRef = useRef<number>(0);
  const saveCounterRef = useRef<number>(0);

  useEffect(() => {
    lastTickRef.current = Date.now();

    const handleTick = () => {
      const now = Date.now();
      const deltaSeconds = Math.min(2.0, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      const store = useGameStore.getState();
      store.tickDesk(deltaSeconds);
      store.tickMarket(deltaSeconds);

      saveCounterRef.current += deltaSeconds;
      if (saveCounterRef.current >= 5) {
        store.updateLastSaved();
        saveCounterRef.current = 0;
      }
    };

    // Catch up passive earnings and market status when tab returns from background
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = Date.now();
        const elapsedSeconds = (now - lastTickRef.current) / 1000;
        if (elapsedSeconds > 2) {
          const store = useGameStore.getState();
          store.tickDesk(elapsedSeconds);
          // Catch up market and auto-settle expired option contracts (bounded to 5s per catch-up burst)
          store.tickMarket(Math.min(5.0, elapsedSeconds));
        }
        lastTickRef.current = now;
      }
    };

    const interval = setInterval(handleTick, 100);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
