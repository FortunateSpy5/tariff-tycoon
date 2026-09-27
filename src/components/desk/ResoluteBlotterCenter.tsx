/**
 * Resolute Blotter Center Stage
 * The central command surface: interactive desk props, parchment directive,
 * kinetic stamp / Golden Sherpie, ink & tantrum meters, and 3:00 AM YAP launcher.
 */

import React, { useState } from 'react';
import { FileText, Send, RotateCcw } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { ClickerButton } from './ClickerButton';
import { InkMeter } from './InkMeter';
import { TantrumMeter } from './TantrumMeter';
import { RedPhoneProp } from './props/RedPhoneProp';
import { GoldBoxProp } from './props/GoldBoxProp';
import { SubpoenaShredderProp } from './props/SubpoenaShredderProp';
import { generateProceduralYap } from '../../engine/systems/yapEngine';

export const ResoluteBlotterCenter: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const totalClicks = useGameStore((s) => s.totalClicks);
  const triggerYapMarketShock = useGameStore((s) => s.triggerYapMarketShock);
  const executeWalkBack = useGameStore((s) => s.executeWalkBack);
  const isWalkBackWindowActive = useGameStore((s) => s.isWalkBackWindowActive);
  const walkBackSecondsRemaining = useGameStore((s) => s.walkBackSecondsRemaining);
  const screenShakeEnabled = useGameStore((s) => s.screenShakeEnabled);
  const tantrumMeter = useGameStore((s) => s.tantrumMeter);
  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);

  const [activeDirectiveText, setActiveDirectiveText] = useState<string>(
    phase === 1
      ? '"Foreign brie and uninspected produce confiscated for emergency redistribution."'
      : '"By authority vested in the Dealmaker-in-Chief, international trade is officially canceled."'
  );

  const handleLaunchYap = () => {
    const newYap = generateProceduralYap();
    setActiveDirectiveText(`"${newYap.rawText}"`);
    triggerYapMarketShock(newYap);
  };

  const isRecoilActive = screenShakeEnabled && (isCapsFrenzy || tantrumMeter > 85);

  return (
    <div className="h-full flex flex-col justify-between bg-gradient-to-b from-stone-900 via-stone-900/95 to-amber-950/20 border border-amber-900/40 rounded-xl p-3 shadow-2xl relative overflow-hidden select-none">
      
      {/* Top Interactive Prop Tray */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        <RedPhoneProp />
        <GoldBoxProp />
        <SubpoenaShredderProp />
      </div>

      {/* Parchment Directive / Seizure Log */}
      <div
        className={`bg-amber-50/5 border border-amber-500/20 rounded-lg p-2.5 text-center shadow-inner my-1.5 transition-transform duration-100 ${
          isRecoilActive ? 'animate-recoil' : ''
        }`}
      >
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
          <FileText className="w-3.5 h-3.5" />
          <span>
            {phase === 1
              ? 'CUSTOMS SEIZURE LOG // AGENT 412'
              : `EXECUTIVE ORDER #${8400 + totalClicks} // 3:00 AM DIRECTIVE`}
          </span>
        </div>
        <p className="text-stone-300 italic text-xs mt-1 line-clamp-2 font-serif px-2">
          {activeDirectiveText}
        </p>
      </div>

      {/* Center Tactile Stamp / Sherpie Clicker */}
      <div className="flex-1 flex flex-col items-center justify-center my-auto py-1">
        <ClickerButton />
      </div>

      {/* Ink Stamina & Tantrum Gauges */}
      <div className="grid grid-cols-2 gap-2 my-1 shrink-0">
        <InkMeter />
        <TantrumMeter />
      </div>

      {/* Command Actions: 3:00 AM Lethal YAP & 8s Walk-Back Straddle Pump */}
      <div className="flex items-center gap-2 mt-1 shrink-0">
        <button
          onClick={handleLaunchYap}
          title="Crash targeted stock and harvest short profits [Hotkey: Y]"
          className="flex-1 py-2 bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:opacity-95 text-stone-950 font-black rounded-lg font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg text-xs cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Launch 3:00 AM Lethal Yap [Y]</span>
        </button>

        {isWalkBackWindowActive && (
          <button
            onClick={executeWalkBack}
            title="Pump market +35% during relief rally [Hotkey: W]"
            className="px-3.5 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 text-stone-950 font-black rounded-lg font-mono uppercase tracking-wider flex items-center gap-1.5 active:scale-95 animate-bounce shadow-lg text-xs cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Walk-Back ({Math.ceil(walkBackSecondsRemaining)}s) +35% [W]</span>
          </button>
        )}
      </div>
    </div>
  );
};
