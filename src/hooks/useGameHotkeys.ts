/**
 * Hook: useGameHotkeys
 * Global desktop keyboard shortcut dispatcher.
 * Supports ergonomic two-handed controls for rapid simulation play without mouse fatigue.
 */

import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { generateProceduralYap } from '../engine/systems/yapEngine';

export function useGameHotkeys() {
  const clickDesk = useGameStore((s) => s.clickDesk);
  const setActiveLeftTab = useGameStore((s) => s.setActiveLeftTab);
  const setActiveRightTab = useGameStore((s) => s.setActiveRightTab);
  const triggerYapMarketShock = useGameStore((s) => s.triggerYapMarketShock);
  const executeWalkBack = useGameStore((s) => s.executeWalkBack);
  const isWalkBackWindowActive = useGameStore((s) => s.isWalkBackWindowActive);
  const shredSubpoenas = useGameStore((s) => s.shredSubpoenas);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const toggleScreenShake = useGameStore((s) => s.toggleScreenShake);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        clickDesk();
      } else if (e.key === '1') {
        setActiveLeftTab('stocks');
      } else if (e.key === '2') {
        setActiveLeftTab('polygrift');
      } else if (e.key === '3') {
        setActiveLeftTab('radar');
      } else if (e.key === 'd' || e.key === 'D') {
        setActiveRightTab('dump');
      } else if (e.key === 'u' || e.key === 'U') {
        setActiveRightTab('unlocks');
      } else if (e.key === 't' || e.key === 'T') {
        setActiveRightTab('tariffs');
      } else if (e.key === 'c' || e.key === 'C') {
        setActiveRightTab('caymans');
      } else if (e.key === 'y' || e.key === 'Y') {
        e.preventDefault();
        const yap = generateProceduralYap();
        triggerYapMarketShock(yap);
      } else if (e.key === 'w' || e.key === 'W') {
        if (isWalkBackWindowActive) {
          e.preventDefault();
          executeWalkBack();
        }
      } else if (e.key === 's' || e.key === 'S') {
        shredSubpoenas();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'z' || e.key === 'Z') {
        toggleScreenShake();
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
  }, [
    clickDesk,
    setActiveLeftTab,
    setActiveRightTab,
    triggerYapMarketShock,
    executeWalkBack,
    isWalkBackWindowActive,
    shredSubpoenas,
    toggleMute,
    toggleScreenShake,
  ]);
}
