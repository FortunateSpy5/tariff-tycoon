/**
 * Game Loop Hook: Drives real-time ticks for passive income, market noise, and frenzy countdowns.
 * Includes visibilitychange listener to ensure offline/background tabs catch up seamlessly.
 */

import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

export function useGameLoop() {
  const lastTickRef = useRef<number>(0);
  const hiddenAtRef = useRef<number | null>(null);
  const saveCounterRef = useRef<number>(0);

  useEffect(() => {
    lastTickRef.current = Date.now();
    if (document.visibilityState === 'hidden') hiddenAtRef.current = lastTickRef.current;

    const handleTick = () => {
      if (document.visibilityState !== 'visible') return;
      const now = Date.now();
      const deltaSeconds = Math.min(2.0, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;

      const store = useGameStore.getState();
      store.tickDesk(deltaSeconds);
      store.tickMarket(deltaSeconds);
      // AFTER `tickMarket`, so the 401(k) match values the book the settlement
      // just left standing rather than one that is mid-expiry.
      store.tickPerks();

      saveCounterRef.current += deltaSeconds;
      if (saveCounterRef.current >= 5) {
        store.updateLastSaved();
        saveCounterRef.current = 0;
      }
    };

    // Catch up passive earnings and market status when tab returns from background
    const handleVisibilityChange = () => {
      const now = Date.now();
      if (document.visibilityState === 'hidden') {
        hiddenAtRef.current = now;
        return;
      }

      const hiddenAt = hiddenAtRef.current;
      if (hiddenAt === null) return;

      const elapsedSeconds = (now - hiddenAt) / 1000;
      const store = useGameStore.getState();
      store.creditOfflineEarnings(elapsedSeconds);
      store.extendActiveTradesForOffline(elapsedSeconds);
      store.updateLastSaved();
      lastTickRef.current = now;
      saveCounterRef.current = 0;
      hiddenAtRef.current = null;
    };

    const interval = setInterval(handleTick, 100);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);
}
