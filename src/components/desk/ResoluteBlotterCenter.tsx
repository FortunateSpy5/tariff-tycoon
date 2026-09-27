/**
 * Resolute Blotter Center Stage
 * The central command surface: interactive desk props, parchment directive,
 * kinetic stamp / Golden Sherpie, ink & tantrum meters, 3:00 AM YAP launcher,
 * and physical Broad Daylight Money Printer when unlocked.
 */

import React, { useState } from 'react';
import { FileText, Send, RotateCcw, Printer } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { ClickerButton } from './ClickerButton';
import { InkMeter } from './InkMeter';
import { TantrumMeter } from './TantrumMeter';
import { RedPhoneProp, GoldBoxProp, SubpoenaShredderProp } from './props';
import { generateProceduralYap } from '../../engine/systems/yapEngine';

export const ResoluteBlotterCenter: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const triggerYapMarketShock = useGameStore((s) => s.triggerYapMarketShock);
  const executeWalkBack = useGameStore((s) => s.executeWalkBack);
  const isWalkBackWindowActive = useGameStore((s) => s.isWalkBackWindowActive);
  const walkBackSecondsRemaining = useGameStore((s) => s.walkBackSecondsRemaining);
  const screenShakeEnabled = useGameStore((s) => s.screenShakeEnabled);
  const isHighTantrum = useGameStore((s) => s.tantrumMeter > 85);
  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);
  const printEmergencyCash = useGameStore((s) => s.printEmergencyCash);

  const [activeDirectiveText, setActiveDirectiveText] = useState<string>(
    phase === 1
      ? '"Foreign brie and uninspected produce confiscated for emergency redistribution."'
      : '"By authority vested in the Dealmaker-in-Chief, international trade is officially canceled."'
  );
  const [printFeedback, setPrintFeedback] = useState<string | null>(null);

  const handleLaunchYap = () => {
    const newYap = generateProceduralYap();
    setActiveDirectiveText(`"${newYap.rawText}"`);
    triggerYapMarketShock(newYap);
  };

  const handlePrintMoney = () => {
    const success = printEmergencyCash();
    if (success) {
      setPrintFeedback('BRRR! +$100,000 CASH (+10% HEAT)');
      setTimeout(() => setPrintFeedback(null), 2000);
    }
  };

  const isRecoilActive = screenShakeEnabled && (isCapsFrenzy || isHighTantrum);
  const isPulseActive = !screenShakeEnabled && (isCapsFrenzy || isHighTantrum);
  const hasMoneyPrinter = activeUpgrades.includes('broad_daylight_printer');

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
        className={`bg-amber-50/5 border border-amber-500/20 rounded-lg p-2.5 text-center shadow-inner my-1.5 transition-all duration-100 ${
          isRecoilActive ? 'animate-recoil' : ''
        } ${isPulseActive ? 'ring-2 ring-amber-400/80 animate-pulse' : ''}`}
      >
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase">
          <FileText className="w-3.5 h-3.5" />
          <span>
            {phase === 1
              ? 'CUSTOMS SEIZURE LOG // AGENT 412 // GATE 99B'
              : 'EXECUTIVE ORDER // 3:00 AM UNILATERAL DIRECTIVE'}
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

      {/* Broad Daylight Money Printer (When Unlocked) */}
      {hasMoneyPrinter && (
        <div className="my-1 shrink-0 relative">
          <button
            onClick={handlePrintMoney}
            className="w-full py-1.5 px-3 bg-gradient-to-r from-emerald-600 via-yellow-500 to-emerald-600 hover:opacity-95 text-stone-950 font-black rounded-lg font-mono uppercase tracking-wider text-[11px] shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all border border-emerald-400/60"
          >
            <Printer className="w-3.5 h-3.5 animate-bounce" />
            <span>PRINT $BRRR (+ $100k Cash, +10% Heat)</span>
          </button>
          {printFeedback && (
            <div className="absolute inset-0 bg-stone-950/95 flex items-center justify-center font-mono text-[10px] font-bold text-emerald-400 rounded-lg">
              {printFeedback}
            </div>
          )}
        </div>
      )}

      {/* Ink Stamina & Tantrum Gauges */}
      <div className="grid grid-cols-2 gap-2 my-1 shrink-0">
        <InkMeter />
        <TantrumMeter />
      </div>

      {/* Command Actions: 3:00 AM Lethal YAP & 8s Walk-Back Straddle Pump */}
      <div className="flex items-center gap-2 mt-1 shrink-0">
        {phase === 1 ? (
          <div className="flex-1 py-2 bg-stone-950/80 border border-stone-800 text-stone-500 font-mono text-center text-xs rounded-lg uppercase tracking-wider">
            🔒 3:00 AM YAP UNLOCKS AT PHASE 2 ($10,000 SEED)
          </div>
        ) : (
          <button
            onClick={handleLaunchYap}
            title="Crash targeted stock and harvest short profits [Hotkey: Y]"
            className="flex-1 py-2 bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:opacity-95 text-stone-950 font-black rounded-lg font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-lg text-xs cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Launch 3:00 AM Lethal Yap [Y]</span>
          </button>
        )}

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
