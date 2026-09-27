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
      const target = e.target as HTMLElement | null;
      if (!target || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) {
        return;
      }

      // INVARIANT: Prevent holding down keys from auto-firing repeat events
      if (e.repeat) {
        return;
      }

      const store = useGameStore.getState();

      if (e.code === 'Space' || e.key === 'Enter') {
        if (target.closest('button, a, [role="button"]')) return;
        e.preventDefault();
        store.clickDesk();
      } else if (e.key === '1') {
        if (store.hasMarketAccess) store.setActiveLeftTab('stocks');
      } else if (e.key === '2') {
        if (store.hasRadarAccess) store.setActiveLeftTab('radar');
      } else if (e.key === '3') {
        if (store.hasPolyGriftAccess) store.setActiveLeftTab('polygrift');
      } else if (e.key === 'd' || e.key === 'D') {
        if (store.phase >= 2) store.setActiveRightTab('dump');
      } else if (e.key === 'u' || e.key === 'U') {
        if (store.hasCronyUnlocksAccess) store.setActiveRightTab('unlocks');
      } else if (e.key === 't' || e.key === 'T') {
        if (store.hasTariffAccess) store.setActiveRightTab('tariffs');
      } else if (e.key === 'c' || e.key === 'C') {
        if (store.hasPrestigeAccess) store.setActiveRightTab('caymans');
      } else if (e.key === 'y' || e.key === 'Y') {
        if (store.hasMarketAccess) {
          e.preventDefault();
          const preferredStock = store.yapTargetMode === 'selected' ? store.selectedStock : undefined;
          const yap = generateProceduralYap(preferredStock);
          store.triggerYapMarketShock(yap);
        }
      } else if (e.key === 'w' || e.key === 'W') {
        if (store.isWalkBackWindowActive) {
          e.preventDefault();
          store.executeWalkBack();
        }
      } else if (e.key === 's' || e.key === 'S') {
        store.shredSubpoenas();
      } else if (e.key === 'r' || e.key === 'R') {
        store.refillInk();
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
