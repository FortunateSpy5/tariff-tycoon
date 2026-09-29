/**
 * Resolute Blotter Center Stage
 * The central command surface: interactive desk props, parchment directive,
 * kinetic stamp / Golden Sherpie, ink & tantrum meters, 3:00 AM YAP launcher,
 * and physical Broad Daylight Money Printer when unlocked.
 */

import React, { useState, useEffect } from 'react';
import { Send, RotateCcw, Printer, Crosshair, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { ClickerButton } from './ClickerButton';
import { ExecutiveGauges } from './ExecutiveGauges';
import { FeedbackLayer } from './FeedbackLayer';
import { DirectiveSheet } from './DirectiveSheet';
import { RedPhoneProp, GoldBoxProp, SubpoenaShredderProp } from './props';
import { generateProceduralYap } from '../../engine/systems/yapEngine';
import {
  INK_COST_PER_YAP,
  WALK_BACK_PUMP_MULTIPLIER,
  WALK_BACK_WINDOW_SECONDS,
  YAP_HEAT,
  YAP_HEAT_SHOTGUN,
  VEX_GAIN_SELECTED,
  VEX_GAIN_SHOTGUN,
} from '../../constants/balance';
import { SHOTGUN_CRASH_BONUS } from '../../engine/systems/yapShockEngine';
import { PRINTER_HEAT } from '../../store/slices/deskPropsSlice';
import { hint } from '../ui/hint';

export const ResoluteBlotterCenter: React.FC = () => {
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
  const yapCooldownSeconds = useGameStore((s) => s.yapCooldownSeconds);
  const inkLevel = useGameStore((s) => s.inkLevel);
  // Raid + crisis feedback moved to <FeedbackLayer> (see the priority note there).

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
        setYapFeedback(`INSIDER COMBO! Short hit on $${result.targetSymbol}!`);
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
    // The button is `aria-disabled` rather than `disabled` so the hover can
    // explain the cooldown (see HintTooltip). The guard is therefore the only
    // thing stopping the print, and must mirror the button's own gate.
    if (printerCooldownRemaining > 0) return;
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
    // B6: the desk IS parchment. This is the largest surface in the app
    // (~40% of the screen) and it was `from-stone-900` — default grey — which
    // meant the [Newsprint & Classified] direction existed only in the chrome
    // around it. The GDD already called this a "Parchment Directive"; now it
    // is literally paper. Everything nested inside is dark ink on cream.
    <div className="h-full min-h-0 flex flex-col gap-2 surface-desk border border-newsprint-400 rounded-xl p-3 shadow-2xl relative overflow-hidden select-none">
      
      {/* Special Counsel Raid / Asset Seizure Alert
          REDESIGN: this used to be a standalone banner competing with three
          other overlays for the same pixels. All transient feedback now resolves
          through <FeedbackLayer>, which renders exactly one message by priority. */}
      <FeedbackLayer
        yapFeedback={yapFeedback}
        printFeedback={printFeedback}
        hasWalkBackCall={hasWalkBackCall}
      />

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

      {/* Parchment Directive / Seizure Log — a stamped sheet on the blotter.
          Extracted to <DirectiveSheet>: it is a named, self-explaining wire
          with its own identity, not an anonymous slab of markup competing for
          the file's line budget. */}
      <DirectiveSheet isRecoilActive={isRecoilActive} isPulseActive={isPulseActive} />

      {/* Center Tactile Stamp / Sherpie Clicker */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center py-1">
        <ClickerButton />
      </div>

      {/* Broad Daylight Money Printer (When Unlocked) */}
      {hasMoneyPrinter && (
        <div className="shrink-0 relative">
          <button
            onClick={handlePrintMoney}
            aria-disabled={printerCooldownRemaining > 0}
            {...hint(
              printerCooldownRemaining > 0
                ? `Printer cooling down: ${printerCooldownRemaining}s. One tray, one pull a minute.`
                : `Print $100,000 of emergency cash and raise suspicion by ${PRINTER_HEAT}%. 60s between pulls. It is the loudest button in the game and the heaviest single hit of S.L.O.P. heat you will find outside a shotgun YAP.`,
            )}
            className={`w-full py-1.5 px-3 text-newsprint-950 font-black rounded-lg font-mono uppercase tracking-wider text-[11px] shadow-lg flex items-center justify-center gap-2 transition-all border border-emerald-700/60 ${printerCooldownRemaining > 0 ? 'bg-newsprint-300 text-newsprint-800 cursor-not-allowed' : 'bg-gradient-to-r from-emerald-700 via-gold-500 to-emerald-700 hover:opacity-95 text-newsprint-50 cursor-pointer active:scale-95'}`}
          >
            <Printer className={`w-3.5 h-3.5 ${printerCooldownRemaining > 0 ? '' : 'animate-bounce'}`} />
            <span>{printerCooldownRemaining > 0 ? `COOLING DOWN (${printerCooldownRemaining}s)` : 'PRINT $BRRR (+$100k, +15% S.L.O.P.)'}</span>
          </button>

        </div>
      )}

      {/* Ink Stamina & Tantrum Gauges — stacked full-width as a matched pair.
          REDESIGN: these were a grid-cols-2 where only Ink had an action, which
          read as one finished component beside one missing its button. */}
      <ExecutiveGauges />

      {/* Command Actions: Target Mode Toggle, 3:00 AM Lethal YAP & 8s Walk-Back */}
      <div className="flex shrink-0 flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
        {!hasMarketAccess ? (
          <div
            {...hint(
              `SEALED CHANNEL — BagHolder Pro. It opens on your FIRST SLAM, not on a cash threshold. The causal shorting loop (open a PUT, fire a YAP, settle the crash) is the entire game, so it cannot sit behind a grind you have to earn your way to.`
            )}
            className="flex-1 py-2 bg-newsprint-200/70 border border-newsprint-400 text-newsprint-800 font-mono text-center text-xs rounded-lg uppercase tracking-wider"
          >
            SLAM THE STAMP ONCE TO UNSEAL BAGHOLDER PRO
          </div>
        ) : isWalkBackWindowActive ? (
          <div className="flex w-full items-stretch gap-2">
            <div
              className="flex-1 border border-gold-600/50 bg-gold-500/15 px-2 py-1.5 font-mono"
              role="status"
              aria-live="polite"
            >
              <span className="block t-micro font-black text-gold-900">
                CLARIFICATION WINDOW // {Math.ceil(walkBackSecondsRemaining)}s
              </span>
              <span className="block t-micro leading-snug text-newsprint-900">
                {hasWalkBackCall
                  ? `CALL ARMED ON $${lastTargetStockSymbol}. Return the market to the desk.`
                  : `Arm a matching $${lastTargetStockSymbol} CALL in the market terminal, then walk it back.`}
              </span>
            </div>
            <button
              onClick={() => {
                if (!hasWalkBackCall) return;
                executeWalkBack();
              }}
              aria-disabled={!hasWalkBackCall}
              {...hint(
                hasWalkBackCall
                  ? `Apply the ${WALK_BACK_PUMP_MULTIPLIER}x recovery rally and settle the timed CALL on $${lastTargetStockSymbol}. This is the game's only genuinely timed skill expression: you have ${Math.ceil(walkBackSecondsRemaining)}s left to decide whether to double down. [Hotkey: W]`
                  : `The clarification window is open but no CALL is armed. Go to BagHolder Pro and arm a $${lastTargetStockSymbol} CALL within ${WALK_BACK_WINDOW_SECONDS}s — a PUT alone cannot be walked back.`,
                'Walk back the YAP'
              )}
              className={`shrink-0 px-3 py-2 font-mono t-micro font-black uppercase transition-all ${
                hasWalkBackCall
                  ? 'animate-calm-glow bg-emerald-600 text-newsprint-50 hover:bg-emerald-500 cursor-pointer'
                  : 'bg-newsprint-300 text-newsprint-800 cursor-not-allowed'
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
              aria-pressed={yapTargetMode === 'selected'}
              {...hint(
                yapTargetMode === 'selected'
                  ? `Targeted: your YAP will hit $${selectedStock}, the ticker you picked in BagHolder Pro. This is the honest way to play — you can only front-run a crash you can see coming, and only a PUT on the same ticker pays out.`
                  : `Shotgun: hits a random ticker ${Math.round((SHOTGUN_CRASH_BONUS - 1) * 100)}% harder, dumps ${YAP_HEAT_SHOTGUN} heat instead of ${YAP_HEAT}, and spikes VEX by ${VEX_GAIN_SHOTGUN} instead of ${VEX_GAIN_SELECTED}. Bigger numbers, no edge — you are firing blind and hoping your short happens to be on the stock that falls.`,
                'YAP target mode'
              )}
              className={`px-2.5 py-2 rounded-lg font-mono t-micro font-bold border flex items-center gap-1 cursor-pointer transition-all active:scale-95 shrink-0 ${
                yapTargetMode === 'selected'
                  ? 'bg-gold-500/25 border-gold-600 text-gold-900 hover:border-gold-700'
                  : 'bg-stampblue-500/20 border-stampblue-500 text-stampblue-700 hover:border-stampblue-700'
              }`}
            >
              {yapTargetMode === 'selected' ? (
                <>
                  <Crosshair className="w-3.5 h-3.5 text-gold-600" />
                  <span>Short ${selectedStock}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-stampblue-500" />
                  <span>Shotgun (+25%)</span>
                </>
              )}
            </button>

            {/* Launch Lethal YAP Button */}
            <button
              onClick={handleLaunchYap}
              aria-disabled={cooldownRemaining > 0 || inkLevel < 20}
              {...hint(
                cooldownRemaining > 0
                  ? `YAP on cooldown for ${cooldownRemaining}s. The post has to be drafted, filed, and let the tape digest it. This is the window where a PUT you are already holding is drifting.`
                  : inkLevel < 20
                  ? `A YAP is a signed order, so it costs ink: ${INK_COST_PER_YAP} needed, ${inkLevel.toFixed(0)} in the tank. Slam the stamp to sign more, or wait for the tank to refill.`
                  : `Crash ${yapTargetMode === 'selected' ? `$${selectedStock}` : 'a random ticker'} and harvest the short profits. Costs ${INK_COST_PER_YAP} ink, ${yapCooldownSeconds}s cooldown, and spikes VEX — which pays MORE on every position that is winning and burns the losing ones faster. Fire it while short; fire it holding a CALL and you are accelerating your own liquidation. [Hotkey: Y]`,
                'Launch a 3AM YAP'
              )}
              className={`flex-1 py-2 rounded-lg font-mono uppercase tracking-wider flex items-center justify-center gap-1.5 text-xs font-black transition-all shadow-lg ${
                cooldownRemaining > 0
                  ? 'bg-newsprint-300 text-newsprint-800 border border-newsprint-400 cursor-not-allowed'
                  : inkLevel < 20
                  ? 'bg-newsprint-200 text-gold-900 border border-gold-600/50 cursor-not-allowed'
                  : 'bg-gradient-to-r from-wax-600 via-wax-500 to-wax-600 hover:opacity-95 text-newsprint-50 active:scale-95 cursor-pointer'
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
          <p className="w-full min-w-0 border border-emerald-800/50 bg-emerald-700/15 px-2 py-1 text-center font-mono t-caption leading-snug text-emerald-900 break-words" role="status" aria-live="polite">
            {lastWalkBackNotice}
          </p>
        )}
      </div>
    </div>
  );
};
