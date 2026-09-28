/**
 * Hotkey Footer HUD
 * Fixed-height bottom dock showing tactical keyboard shortcuts and engine status.
 */

import React from 'react';
import { Maximize2, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export const HotkeyFooterHUD: React.FC = () => {
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const screenShakeEnabled = useGameStore((s) => s.screenShakeEnabled);
  const toggleScreenShake = useGameStore((s) => s.toggleScreenShake);
  const phase = useGameStore((s) => s.phase);
  const hasMarketAccess = useGameStore((s) => s.hasMarketAccess);
  const hasPolyGriftAccess = useGameStore((s) => s.hasPolyGriftAccess);
  const hasRadarAccess = useGameStore((s) => s.hasRadarAccess);
  const hasCronyUnlocksAccess = useGameStore((s) => s.hasCronyUnlocksAccess);
  const hasTariffAccess = useGameStore((s) => s.hasTariffAccess);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);
  const isWalkBackWindowActive = useGameStore((s) => s.isWalkBackWindowActive);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <footer className="h-9 w-full bg-stone-950 border-t border-stone-800 px-3 flex items-center justify-between font-mono t-micro text-stone-400 select-none shrink-0 z-30">
      
      {/* Left Hotkey Guides */}
      <div className="flex items-center gap-3 overflow-x-hidden whitespace-nowrap">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">SPACE</kbd>
          <span>Stamp</span>
        </span>
        {hasMarketAccess && <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">1</kbd><span>Stocks</span></span>}
        {hasRadarAccess && <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">2</kbd><span>S.L.O.P.</span></span>}
        {hasPolyGriftAccess && <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">3</kbd><span>PolyGrift</span></span>}
        {phase >= 2 && <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">D</kbd><span>D.U.M.P.</span></span>}
        {hasCronyUnlocksAccess && <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">U</kbd><span>Upgrades</span></span>}
        {hasTariffAccess && <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">T</kbd><span>Tariffs</span></span>}
        {hasPrestigeAccess && <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">C</kbd><span>Caymans</span></span>}
        {hasMarketAccess && <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">Y</kbd><span>YAP</span></span>}
        {isWalkBackWindowActive && <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">W</kbd><span>Walk-Back</span></span>}
      </div>

      {/* Right Controls & Tagline */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={toggleScreenShake}
          title="Toggle Screen Shake [Hotkey: Z]"
          className={`p-1 rounded transition-colors cursor-pointer ${
            screenShakeEnabled ? 'text-amber-400' : 'text-stone-600'
          }`}
        >
          <Vibrate className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleMute}
          title="Toggle Sound [Hotkey: M]"
          className="p-1 rounded text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen [Hotkey: F]"
          className="p-1 rounded text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        <span className="t-caption text-stone-600 hidden md:inline">
          100% TRANSFORMATIVE SATIRE
        </span>
      </div>
    </footer>
  );
};
