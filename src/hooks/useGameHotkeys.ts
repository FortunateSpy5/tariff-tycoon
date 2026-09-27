/**
 * Hook: useGameHotkeys
 * Global desktop keyboard shortcut dispatcher.
 * Uses imperative store access to prevent event listener churn and App-level re-render cascades.
 */

import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { generateProceduralYap } from '../engine/systems/yapEngine';

export function useGameHotkeys() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      const store = useGameStore.getState();

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        store.clickDesk();
      } else if (e.key === '1') {
        if (store.phase >= 2) store.setActiveLeftTab('stocks');
      } else if (e.key === '2') {
        if (store.phase >= 2) store.setActiveLeftTab('polygrift');
      } else if (e.key === '3') {
        if (store.phase >= 2) store.setActiveLeftTab('radar');
      } else if (e.key === 'd' || e.key === 'D') {
        if (store.phase >= 2) store.setActiveRightTab('dump');
      } else if (e.key === 'u' || e.key === 'U') {
        if (store.phase >= 2) store.setActiveRightTab('unlocks');
      } else if (e.key === 't' || e.key === 'T') {
        if (store.phase >= 2) store.setActiveRightTab('tariffs');
      } else if (e.key === 'c' || e.key === 'C') {
        if (store.phase >= 2) store.setActiveRightTab('caymans');
      } else if (e.key === 'y' || e.key === 'Y') {
        if (store.phase >= 2) {
          e.preventDefault();
          const yap = generateProceduralYap();
          store.triggerYapMarketShock(yap);
        }
      } else if (e.key === 'w' || e.key === 'W') {
        if (store.isWalkBackWindowActive) {
          e.preventDefault();
          store.executeWalkBack();
        }
      } else if (e.key === 's' || e.key === 'S') {
        store.shredSubpoenas();
      } else if (e.key === 'm' || e.key === 'M') {
        store.toggleMute();
      } else if (e.key === 'z' || e.key === 'Z') {
        store.toggleScreenShake();
      } else if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
