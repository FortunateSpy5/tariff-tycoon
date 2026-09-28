/**
 * Resolute Blotter Center Stage
 * The central command surface: interactive desk props, parchment directive,
 * kinetic stamp / Golden Sherpie, ink & tantrum meters, 3:00 AM YAP launcher,
 * and physical Broad Daylight Money Printer when unlocked.
 */

import React, { useState, useEffect } from 'react';
import { FileText, Send, RotateCcw, Printer, Crosshair, Sparkles, X, ShieldAlert } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { ClickerButton } from './ClickerButton';
import { InkMeter } from './InkMeter';
import { TantrumMeter } from './TantrumMeter';
import { RedPhoneProp, GoldBoxProp, SubpoenaShredderProp } from './props';
import { generateProceduralYap } from '../../engine/systems/yapEngine';

export const ResoluteBlotterCenter: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const hasMarketAccess = useGameStore((s) => s.hasMarketAccess);
  const triggerYapMarketShock = useGameStore((s) => s.triggerYapMarketShock);
  const executeWalkBack = useGameStore((s) => s.executeWalkBack);
  const isWalkBackWindowActive = useGameStore((s) => s.isWalkBackWindowActive);
  const walkBackSecondsRemaining = useGameStore((s) => s.walkBackSecondsRemaining);
  const lastTargetStockSymbol = useGameStore((s) => s.lastTargetStockSymbol);
  const activeTrades = useGameStore((s) => s.activeTrades);
  const lastWalkBackNotice = useGameStore((s) => s.lastWalkBackNotice);
  const screenShakeEnabled = useGameStore((s) => s.screenShakeEnabled);
  const isHighTantrum = useGameStore((s) => s.tantrumMeter > 85);
  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);
  const printEmergencyCash = useGameStore((s) => s.printEmergencyCash);

  // YAP & Raid State
  const yapTargetMode = useGameStore((s) => s.yapTargetMode);
  const setYapTargetMode = useGameStore((s) => s.setYapTargetMode);
  const selectedStock = useGameStore((s) => s.selectedStock);
  const lastYapTimestamp = useGameStore((s) => s.lastYapTimestamp);
  const lastPrinterTimestamp = useGameStore((s) => s.lastPrinterTimestamp);
  const lastYapPost = useGameStore((s) => s.lastYapPost);
  const yapCooldownSeconds = useGameStore((s) => s.yapCooldownSeconds);
  const inkLevel = useGameStore((s) => s.inkLevel);
  const lastRaidMessage = useGameStore((s) => s.lastRaidMessage);
  const dismissRaidAlert = useGameStore((s) => s.dismissRaidAlert);
  const lastCrisisOutcome = useGameStore((s) => s.lastCrisisOutcome);
  const dismissCrisisOutcome = useGameStore((s) => s.dismissCrisisOutcome);

  const [printFeedback, setPrintFeedback] = useState<string | null>(null);
  const [yapFeedback, setYapFeedback] = useState<string | null>(null);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [printerCooldownRemaining, setPrinterCooldownRemaining] = useState<number>(0);

  // Track cooldown countdown dynamically
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      const elapsed = (now - lastYapTimestamp) / 1000;
      const remaining = Math.max(0, Math.ceil(yapCooldownSeconds - elapsed));
      setCooldownRemaining(remaining);
      setPrinterCooldownRemaining(Math.max(0, Math.ceil((lastPrinterTimestamp + 60000 - now) / 1000)));
    }, 200);
    return () => clearInterval(timer);
  }, [lastYapTimestamp, lastPrinterTimestamp, yapCooldownSeconds]);

  const handleLaunchYap = () => {
    if (cooldownRemaining > 0) {
      setYapFeedback(`YAP on Cooldown (${cooldownRemaining}s)!`);
      setTimeout(() => setYapFeedback(null), 1500);
      return;
    }
    if (inkLevel < 20) {
      setYapFeedback('Needs at least 20 Ink to sign!');
      setTimeout(() => setYapFeedback(null), 1500);
      return;
    }

    const preferred = yapTargetMode === 'selected' ? selectedStock : undefined;
    const newYap = generateProceduralYap(preferred);
    const result = triggerYapMarketShock(newYap);

    if (result.success) {
      if (result.combo) {
        setYapFeedback(`🔥 INSIDER COMBO! Short hit on $${result.targetSymbol}!`);
      } else {
        setYapFeedback(`CRASHED $${result.targetSymbol}!`);
      }
      setTimeout(() => setYapFeedback(null), 2500);
    } else if (result.reason) {
      setYapFeedback(result.reason);
      setTimeout(() => setYapFeedback(null), 1800);
    }
  };

  const handlePrintMoney = () => {
    const success = printEmergencyCash();
    if (success) {
      setPrintFeedback('BRRR! +$100,000 CASH (+15 S.L.O.P. SUSPICION)');
      setTimeout(() => setPrintFeedback(null), 2000);
    }
  };

  const isRecoilActive = screenShakeEnabled && (isCapsFrenzy || isHighTantrum);
  const isPulseActive = !screenShakeEnabled && (isCapsFrenzy || isHighTantrum);
  const hasMoneyPrinter = activeUpgrades.includes('broad_daylight_printer');
  const hasWalkBackCall = activeTrades.some(
    (trade) => trade.isWalkBackCombo && trade.symbol === lastTargetStockSymbol
  );

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 bg-gradient-to-b from-stone-900 via-stone-900/95 to-amber-950/20 border border-amber-900/40 rounded-xl p-3 shadow-2xl relative overflow-hidden select-none">
      
      {/* Special Counsel Raid / Asset Seizure Alert Banner */}
      {lastRaidMessage && (
        <div className="bg-red-950/95 border border-red-500 rounded-lg p-2 t-micro font-mono font-bold text-red-200 flex items-center justify-between shadow-xl animate-pulse shrink-0 z-20">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{lastRaidMessage}</span>
          </div>
          <button
            onClick={dismissRaidAlert}
            title="Dismiss notification"
            className="text-stone-400 hover:text-stone-100 p-0.5 cursor-pointer ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Interactive Prop Tray
          The Crisis Call owns a full-width row because it is the primary
          Phase 1 mechanic and expands substantially while a crisis is ringing.
          Gold Box and Shredder share the second row. */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        <div className="col-span-2">
          <RedPhoneProp />
        </div>
        <GoldBoxProp />
        <SubpoenaShredderProp />
      </div>

      {/* Parchment Directive / Seizure Log */}
      <div
        className={`bg-amber-50/5 border border-amber-500/20 rounded-lg p-2.5 text-center shadow-inner shrink-0 transition-all duration-100 relative ${
          isRecoilActive ? 'animate-recoil' : ''
        } ${isPulseActive ? 'ring-2 ring-amber-400/80 animate-pulse' : ''}`}
      >
        <div className="flex items-center justify-center gap-1.5 t-micro font-mono font-bold tracking-widest text-amber-400 uppercase">
          <FileText className="w-3.5 h-3.5" />
          <span>
            {phase === 1
              ? 'CUSTOMS SEIZURE LOG // AGENT 412 // GATE 99B'
              : 'EXECUTIVE ORDER // 3:00 AM UNILATERAL DIRECTIVE'}
          </span>
        </div>
        <p className="text-stone-300 italic text-xs mt-1 line-clamp-2 font-serif px-2">
          {lastYapPost?.rawText ??
            (phase === 1
              ? '"Foreign brie and uninspected produce confiscated for emergency redistribution."'
              : '"By authority vested in the Dealmaker-in-Chief, international trade is officially canceled."')}
        </p>

        {lastYapPost && (
          <div className="mt-1 flex items-center justify-center gap-2 t-micro font-mono text-amber-500/80">
            <span>Tariff {lastYapPost.tariffPercentage}%</span>
            <span className="text-stone-500">·</span>
            <span>Impact ×{lastYapPost.impactMultiplier.toFixed(2)}</span>
            <span className="text-stone-500">·</span>
            <span>{lastYapPost.viralQuotesCount.toLocaleString()} viral quotes</span>
          </div>
        )}

        {yapFeedback && (
          <div className="absolute inset-0 bg-stone-950/95 flex items-center justify-center font-mono text-[11px] font-black text-amber-400 rounded-lg animate-pulse z-10 px-2 text-center">
            {yapFeedback}
          </div>
        )}
      </div>

      {/* Center Tactile Stamp / Sherpie Clicker */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-1">
        <ClickerButton />
      </div>

      {/* Broad Daylight Money Printer (When Unlocked) */}
      {hasMoneyPrinter && (
        <div className="shrink-0 relative">
          <button
            onClick={handlePrintMoney}
            disabled={printerCooldownRemaining > 0}
            title={printerCooldownRemaining > 0 ? `Printer cooling down: ${printerCooldownRemaining}s` : 'Print $100,000 and raise suspicion by 15%'}
            className={`w-full py-1.5 px-3 text-stone-950 font-black rounded-lg font-mono uppercase tracking-wider text-[11px] shadow-lg flex items-center justify-center gap-2 transition-all border border-emerald-400/60 ${printerCooldownRemaining > 0 ? 'bg-stone-700 cursor-not-allowed opacity-70' : 'bg-gradient-to-r from-emerald-600 via-yellow-500 to-emerald-600 hover:opacity-95 cursor-pointer active:scale-95'}`}
          >
            <Printer className={`w-3.5 h-3.5 ${printerCooldownRemaining > 0 ? '' : 'animate-bounce'}`} />
            <span>{printerCooldownRemaining > 0 ? `COOLING DOWN (${printerCooldownRemaining}s)` : 'PRINT $BRRR (+$100k, +15% S.L.O.P.)'}</span>
          </button>
          {printFeedback && (
            <div className="absolute inset-0 bg-stone-950/95 flex items-center justify-center font-mono t-micro font-bold text-emerald-400 rounded-lg">
              {printFeedback}
            </div>
          )}
        </div>
      )}

      {/* Ink Stamina & Tantrum Gauges */}
      <div className="grid grid-cols-2 gap-2 shrink-0">
        <InkMeter />
        <TantrumMeter />
      </div>

      {/* Crisis Call outcome notice */}
      {lastCrisisOutcome && (
        <div
          role="status"
          aria-live="polite"
          className="shrink-0 flex items-center gap-2 rounded border border-red-900/70 bg-red-950/70 px-2 py-1"
        >
          <span className="t-micro font-mono font-bold text-red-300 truncate">
            {lastCrisisOutcome}
          </span>
          <button
            onClick={dismissCrisisOutcome}
            className="ml-auto shrink-0 text-stone-400 hover:text-stone-100 t-micro font-mono px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Command Actions: Target Mode Toggle, 3:00 AM Lethal YAP & 8s Walk-Back */}
      <div className="flex shrink-0 flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
        {!hasMarketAccess ? (
          <div className="flex-1 py-2 bg-stone-950/80 border border-stone-800 text-stone-500 font-mono text-center text-xs rounded-lg uppercase tracking-wider">
            🔒 BAGHOLDER PRO & YAP UNLOCK AT $10,000
          </div>
        ) : isWalkBackWindowActive ? (
          <div className="flex w-full items-stretch gap-2">
            <div
              className="flex-1 border border-amber-500/50 bg-amber-950/40 px-2 py-1.5 font-mono"
              role="status"
              aria-live="polite"
            >
              <span className="block t-micro font-black text-amber-300">
                CLARIFICATION WINDOW // {Math.ceil(walkBackSecondsRemaining)}s
              </span>
              <span className="block t-micro leading-snug text-stone-200">
                {hasWalkBackCall
                  ? `CALL ARMED ON $${lastTargetStockSymbol}. Return the market to the desk.`
                  : `Arm a matching $${lastTargetStockSymbol} CALL in the market terminal, then walk it back.`}
              </span>
            </div>
            <button
              onClick={executeWalkBack}
              disabled={!hasWalkBackCall}
              title={hasWalkBackCall
                ? 'Apply the recovery rally and settle the timed CALL [Hotkey: W]'
                : `Arm a matching $${lastTargetStockSymbol} CALL before the window closes`}
              className={`shrink-0 px-3 py-2 font-mono t-micro font-black uppercase transition-all ${
                hasWalkBackCall
                  ? 'animate-pulse bg-emerald-500 text-stone-950 hover:bg-emerald-400 cursor-pointer'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
            >
              <RotateCcw className="mx-auto mb-0.5 h-4 w-4" />
              {hasWalkBackCall ? 'WALK-BACK [W]' : 'CALL NEEDED'}
            </button>
          </div>
        ) : (
          <>
            {/* Target Mode Toggle */}
            <button
              onClick={() => setYapTargetMode(yapTargetMode === 'selected' ? 'shotgun' : 'selected')}
              title="Toggle: Short the stock selected on BagHolder Pro vs Unhinged Random Shotgun"
              className={`px-2.5 py-2 rounded-lg font-mono t-micro font-bold border flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 ${
                yapTargetMode === 'selected'
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-300 hover:border-amber-400'
                  : 'bg-purple-950/80 border-purple-500/80 text-purple-300 hover:border-purple-400'
              }`}
            >
              {yapTargetMode === 'selected' ? (
                <>
                  <Crosshair className="w-3.5 h-3.5 text-amber-400" />
                  <span>Short ${selectedStock}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Shotgun (+25%)</span>
                </>
              )}
            </button>

            {/* Launch Lethal YAP Button */}
            <button
              onClick={handleLaunchYap}
              disabled={cooldownRemaining > 0 || inkLevel < 20}
              title="Crash targeted stock and harvest short profits [Hotkey: Y] (Costs 20 Ink, 10s cooldown)"
              className={`flex-1 py-2 rounded-lg font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 text-xs font-black transition-all shadow-lg ${
                cooldownRemaining > 0
                  ? 'bg-stone-800 text-stone-400 border border-stone-700 cursor-not-allowed opacity-80'
                  : inkLevel < 20
                  ? 'bg-stone-900 text-amber-500 border border-amber-800/80 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 via-amber-600 to-red-600 hover:opacity-95 text-stone-950 active:scale-95 cursor-pointer'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>
                {cooldownRemaining > 0
                  ? `Lethal Yap (${cooldownRemaining}s)`
                  : inkLevel < 20
                  ? 'Needs 20 Ink'
                  : 'Launch 3:00 AM Lethal Yap [Y]'}
              </span>
            </button>
          </>
        )}
        </div>

        {lastWalkBackNotice && !isWalkBackWindowActive && (
          <p className="w-full min-w-0 border border-emerald-900/60 bg-stone-950/90 px-2 py-1 text-center font-mono t-caption leading-snug text-emerald-300 break-words" role="status" aria-live="polite">
            {lastWalkBackNotice}
          </p>
        )}
      </div>
    </div>
  );
};
