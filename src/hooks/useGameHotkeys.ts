/**
 * Hook: useGameHotkeys
 * Global desktop keyboard shortcut dispatcher.
 * Uses imperative store access to prevent event listener churn and App-level re-render cascades.
 */

import { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { generateProceduralYap } from '../engine/systems/yapEngine';

/** Shared dev-only flag for the debug inspector; mutated by the `~` hotkey. */
let debugOpen = false;
const debugListeners = new Set<(open: boolean) => void>();
function setDebugOpen(next: boolean) {
  debugOpen = next;
  debugListeners.forEach((fn) => fn(next));
}
export function useDebugOpen(): [boolean, () => void] {
  const [open, setOpen] = useState(debugOpen);
  useEffect(() => {
    const listener = (v: boolean) => setOpen(v);
    debugListeners.add(listener);
    return () => {
      debugListeners.delete(listener);
    };
  }, []);
  return [open, () => setDebugOpen(!debugOpen)];
}

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
      } else if (e.key === 'v' || e.key === 'V') {
        // [V] Vent the tantrum: burn the meter for VEX relief. The counterpart
        // to [R] refill. Deliberately NOT the frenzy path — see
        // [Venting Must Never Be Optimal] in constants/balance.ts.
        store.ventTantrum();
      } else if (e.key === 'p' || e.key === 'P') {
        // [P] Answer the ringing 3:00 AM crisis call. Equivalent to SWEAR IN.
        if (store.activeCrisis) {
          e.preventDefault();
          store.swearInCrisis();
        }
      } else if (e.key === 'i' || e.key === 'I') {
        // [I] Ignore / suppress the ringing crisis call.
        if (store.activeCrisis) {
          e.preventDefault();
          store.suppressCrisis();
        }
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
      } else if (e.key === '`' || e.key === '~' || e.code === 'Backquote') {
        // DEV ONLY: toggle the state-inspection panel. Guarded so it can never
        // activate in a production bundle.
        if (import.meta.env.DEV) {
          e.preventDefault();
          setDebugOpen(!debugOpen);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
