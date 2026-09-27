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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <footer className="h-9 w-full bg-stone-950 border-t border-stone-800 px-3 flex items-center justify-between font-mono text-[10px] text-stone-400 select-none shrink-0 z-30">
      
      {/* Left Hotkey Guides */}
      <div className="flex items-center gap-3 overflow-x-hidden whitespace-nowrap">
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">SPACE</kbd>
          <span>Stamp</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">1-3</kbd>
          <span>Left Channels</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">D/U/T/C</kbd>
          <span>Right Channels</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">Y</kbd>
          <span>YAP</span>
        </span>
        <span className="flex items-center gap-1">
          <kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-200 font-bold">W</kbd>
          <span>Walk-Back</span>
        </span>
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

        <span className="text-[9px] text-stone-600 hidden md:inline">
          100% TRANSFORMATIVE SATIRE
        </span>
      </div>
    </footer>
  );
};
