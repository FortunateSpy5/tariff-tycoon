/**
 * Dual-Phase Clicker Button
 * Phase 1: Heavy Blue Rubber Stamp [CONFISCATED - BY ORDER OF AGENT 412] at the
 *   Deeply Terminal Annex.
 * Phase 2+: Oversized 24k Golden Sherpie signing executive orders on the Resolute
 *   blotter.
 * Compact fluid layout guarantees zero overflow on 720p/768p laptop viewports.
 *
 * INVARIANT: [The Verb On The Stamp Must Be True]
 * The Phase 2+ face read `SIGN TARIFF`, but clicking it set no tariff — the YAP
 * button does that. Two buttons, one verb, one of them lying. It now reads
 * `SIGN ORDER`, which is exactly what the click does: cash, plus tantrum.
 */

import React, { useState, useRef } from 'react';
import { PenTool, Stamp, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../../store/useGameStore';
import { calculateInkRefillTotal } from '../../engine/math/formulas';
import { resolveClickPayout, TUNGSTEN_NIB_MULTIPLIER } from '../../engine/systems/clickPayout';
import { hasPerk } from '../../engine/systems/perkEngine';
import { formatCurrency } from '../../engine/math/bigNumber';
import {
  INK_PER_CLICK,
  INK_REGEN_PER_SECOND,
  FRENZY_DURATION_SECONDS,
  FRENZY_CLICK_MULTIPLIER,
  DRY_CLICK_YIELD_MULTIPLIER,
  DRY_CLICK_JAM_YIELD_MULTIPLIER,
  DRY_CLICK_JAM_THRESHOLD,
} from '../../constants/balance';
import {
  FLASH_DIP_CHANCE,
  FLASH_DIP_DURATION_SECONDS,
  FLASH_DIP_VALUATION_MULTIPLIER,
  SHELL_COMPANY_TAP_MULTIPLIER,
} from '../../constants/perks';
import { CUSTOMS_STAMP_NAME } from '../../constants/setting';
import { hint } from '../ui/hint';

interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  text: string;
}

/** Ink splatter droplet. One-shot, self-cleaning on animation end. */
interface InkSplatter {
  id: number;
  x: number;
  y: number;
  size: number;
  /** Phase 1 stamps blue; the Golden Sherpie bleeds gold. */
  color: string;
}

export const ClickerButton: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const clickDesk = useGameStore((s) => s.clickDesk);
  const inkLevel = useGameStore((s) => s.inkLevel);
  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);
  const screenShakeEnabled = useGameStore((s) => s.screenShakeEnabled);
  const isHighTantrum = useGameStore((s) => s.tantrumMeter > 85);
  const sovereignImmunitySlips = useGameStore((s) => s.sovereignImmunitySlips);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const tutorialStepIndex = useGameStore((s) => s.tutorialStepIndex);

  const [isPressed, setIsPressed] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [splatters, setSplatters] = useState<InkSplatter[]>([]);
  // Bumped on every successful slam. React restarts the CSS animation when the
  // animation *name* changes, so we alternate between two identical keyframe
  // names to force a replay — the standard trick for retriggering one-shot CSS.
  const [slamNonce, setSlamNonce] = useState(0);
  const nextIdRef = useRef(0);

  const dryClicksCount = useGameStore((s) => s.dryClicksCount || 0);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const flashDipSecondsRemaining = useGameStore((s) => s.flashDipSecondsRemaining);

  // The CHARGED yield, from the same function `clickDesk` charges with. This used
  // to call `calculateClickValue` directly and so silently omitted the Heavy
  // Tungsten Nib's doubling — the hero number in the game was understated by
  // 100% for anyone who owned the cheapest upgrade in the shop. See
  // `engine/systems/clickPayout.ts`.
  const { earnedCash: clickValue } = resolveClickPayout({
    phase,
    baseValue: 5.0,
    inkLevel,
    isCapsFrenzy,
    sisCount: sovereignImmunitySlips || 0,
    dryClicksCount,
    hasTungstenNib: activeUpgrades.includes('heavy_tungsten_nib'),
    perks: unlockedPerks,
    treasuryCash,
  });

  const isDry = inkLevel <= 0 && !isCapsFrenzy;

  // The hint states the whole contract of the button: cost, yield, and the
  // thing the player is actually chasing (the tantrum meter behind it). The
  // hero control had NO hover text at all, which meant its two real rules —
  // ink is a stamina bar, and a dry nib pays almost nothing — were invisible.
  //
  // INVARIANT: the hint must describe the SAME verb the stamp face shows.
  // Phase 1's face reads CONFISCATE, so a hint that said "issue an executive
  // order" would be the same lie `SIGN TARIFF` was — a second control using a
  // different verb, with the hover contradicting the label this time.
  const verb = phase === 1 ? 'Confiscate contraband' : 'Sign an executive order';
  // INVARIANT: the dry branch must state the JAMMED yield too. "10% of the inked
  // yield" is only true for the first 30 dry clicks; after that the nib jams and
  // the engine pays 2%. The player who has been dry long enough to read this
  // tooltip is the one reading a number that has already stopped being true.
  // What is actually multiplying this slam. The stamp's `+X / tap` tag is the
  // one number the player plans around, so the hover has to be able to account
  // for it — and the multipliers are read from the engine's own inputs, never
  // re-typed, because a figure in copy is a figure that rots.
  const tapSources = [
    activeUpgrades.includes('heavy_tungsten_nib')
      ? ` Heavy Tungsten Nib x${TUNGSTEN_NIB_MULTIPLIER}.`
      : '',
    hasPerk(unlockedPerks, 'shell_company_inception')
      ? ` Shell Company Inception x${SHELL_COMPANY_TAP_MULTIPLIER} on top of it.`
      : '',
  ].join('');
  const flashDipClause = hasPerk(unlockedPerks, 'macro_wreck_280')
    ? ` The 280-Character Macro Wreck rolls ${FLASH_DIP_CHANCE * 100}% on every slam: a Flash Dip multiplies options valuation by ${FLASH_DIP_VALUATION_MULTIPLIER} for ${FLASH_DIP_DURATION_SECONDS}s, signed — it burns a losing CALL as fast as it pays a winning PUT.`
    : '';

  const clickerHint = isDry
    ? `DRY NIB. Empty tank: ${Math.round(DRY_CLICK_YIELD_MULTIPLIER * 100)}% yield, no tantrum — and after ${DRY_CLICK_JAM_THRESHOLD} consecutive dry clicks the nib JAMS and it drops to ${Math.round(
        DRY_CLICK_JAM_YIELD_MULTIPLIER * 100
      )}%. Refill at ${formatCurrency(calculateInkRefillTotal(0, treasuryCash))}, or wait out ${INK_REGEN_PER_SECOND}/s.`
    : isCapsFrenzy
    ? `${verb}. CAPS LOCK FRENZY — ${FRENZY_CLICK_MULTIPLIER}x for ${FRENZY_DURATION_SECONDS} more seconds. Ink is held, not topped up, so the tank you brought is the tank you get back.`
    : `${verb}. Costs ${INK_PER_CLICK} ink and regains ${INK_REGEN_PER_SECOND}/s. Every inked slam builds Tantrum — 100% triggers CAPS LOCK FRENZY, ${FRENZY_CLICK_MULTIPLIER}x yield for ${FRENZY_DURATION_SECONDS}s.${tapSources}${flashDipClause}`;
  const clickerName = isDry ? 'Dry stamp' : verb;

  // C1: the recoil used to fire on BOTH the stamp face and the directive card
  // at 100% tantrum, and the slam travelled 14px. During CAPS LOCK FRENZY the
  // player clicks many times a second, so the impacts overlapped into a
  // continuous judder. At high tantrum we now swap to the damped slam and halve
  // the recoil: the impact still reads, but it no longer fights the cursor.
  const isRecoilActive = screenShakeEnabled && (isCapsFrenzy || isHighTantrum);
  const slamClass = isHighTantrum
    ? 'animate-stamp-slam-calm'
    : slamNonce % 2 === 0
    ? 'animate-stamp-slam'
    : 'animate-stamp-slam-alt';
  const inkColor = isCapsFrenzy ? '#ef4444' : phase === 1 ? '#3b82f6' : '#fbbf24';

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!clickDesk()) return;

    // Retrigger the one-shot slam animation.
    setSlamNonce((n) => n + 1);

    // Trigger celebratory confetti burst during Frenzy
    if (isCapsFrenzy) {
      confetti({
        particleCount: 15,
        spread: 45,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#dc2626'],
      });
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Spawn floating cash number at click coordinates
    const newFloater: FloatingNumber = {
      id: ++nextIdRef.current,
      x,
      y,
      text: `+${formatCurrency(clickValue)}`,
    };

    setFloatingNumbers((prev) => [...prev.slice(-5), newFloater]);

    // INVARIANT: [The Stamp Must Bleed]
    // AGENTS.md mandates "ink splatters" as part of the tactile feedback contract.
    // Before this, the hero object emitted nothing but a number — the single
    // most screenshot-worthy asset in a game about slamming a rubber stamp was
    // inert. Three droplets per slam, deterministic offsets so a fast clicker
    // doesn't produce visual noise, capped so the array never grows unbounded.
    if (!isDry) {
      const angles = [0.6, 2.7, 4.4];
      setSplatters((prev) => {
        const next = angles.map((a, i) => ({
          id: ++nextIdRef.current,
          x: x + Math.cos(a) * (18 + i * 9),
          y: y + Math.sin(a) * (18 + i * 9),
          size: 5 + ((nextIdRef.current + i) % 4) * 2.5,
          color: inkColor,
        }));
        return [...prev, ...next].slice(-18);
      });
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-1.5 select-none my-auto">
      {/* Ink splatter — physical feedback that the stamp actually bleeds */}
      {splatters.map((s) => (
        <span
          key={s.id}
          onAnimationEnd={() => setSplatters((prev) => prev.filter((i) => i.id !== s.id))}
          className="absolute rounded-full pointer-events-none animate-ink-bloom z-20"
          style={{
            left: `${s.x}px`,
            top: `${s.y}px`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            backgroundColor: s.color,
            boxShadow: `0 0 ${s.size}px ${s.color}`,
          }}
        />
      ))}

      {/* Floating Cash Indicators with pure onAnimationEnd cleanup */}
      {floatingNumbers.map((floater) => (
        <span
          key={floater.id}
          onAnimationEnd={() => {
            setFloatingNumbers((prev) => prev.filter((item) => item.id !== floater.id));
          }}
          className="absolute font-black text-xs sm:text-sm pointer-events-none animate-float-fade font-mono text-emerald-400 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-30"
          style={{ left: `${floater.x}px`, top: `${floater.y - 15}px` }}
        >
          {floater.text}
        </span>
      ))}

      {/* Main Interactive Button */}
      <button
        onClick={handleClick}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        onMouseLeave={() => setIsPressed(false)}
        onTouchStart={() => setIsPressed(true)}
        onTouchEnd={() => setIsPressed(false)}
        {...hint(clickerHint, clickerName)}
        className={`relative group w-44 h-44 sm:w-52 sm:h-52 md:w-60 md:h-60 rounded-full flex flex-col items-center justify-center cursor-pointer stamp-face transition-[transform,box-shadow] duration-75 ${
          isPressed ? 'scale-95' : 'hover:scale-[1.02]'
        } ${slamClass} ${
          isCapsFrenzy
            ? 'bg-gradient-to-br from-red-600 via-amber-600 to-red-700 ring-4 ring-red-500/40 animate-calm-glow'
            : phase === 1
            ? 'bg-gradient-to-br from-blue-700 via-indigo-800 to-blue-950 ring-4 ring-blue-500/30'
            : 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 ring-4 ring-amber-400/40'
        }`}
      >
        {/* Glow backdrop */}
        <div
          className={`absolute inset-0 rounded-full blur-lg opacity-25 ${
            isCapsFrenzy ? 'bg-red-500' : phase === 1 ? 'bg-blue-400' : 'bg-amber-300'
          }`}
        />

        {/* Inner Stamp / Pen Surface */}
        <div className="relative z-10 flex flex-col items-center text-center p-2">
          {phase === 1 ? (
            <>
              <Stamp className={`w-10 h-10 sm:w-12 sm:h-12 text-blue-200 mb-1 drop-shadow-md group-hover:rotate-6 transition-transform ${isRecoilActive ? 'animate-recoil' : ''}`} />
              <span className="font-mono t-micro font-black tracking-widest text-blue-300 uppercase">
                {CUSTOMS_STAMP_NAME}
              </span>
              <span className="text-lg sm:text-xl font-black text-white tracking-wider uppercase mt-0.5">
                CONFISCATE
              </span>
              <span className="t-micro font-mono text-blue-200/80 mt-0.5">
                [BY AGENT 412]
              </span>
            </>
          ) : (
            <>
              <PenTool className={`w-10 h-10 sm:w-12 sm:h-12 text-newsprint-950 mb-1 drop-shadow group-hover:-rotate-12 transition-transform ${isRecoilActive ? 'animate-recoil' : ''}`} />
              <span className="font-mono t-micro font-black tracking-widest text-newsprint-900 uppercase">
                Resolute Desk
              </span>
              <span className="text-lg sm:text-xl font-black text-newsprint-950 tracking-wider uppercase mt-0.5">
                {isDry ? 'DRY SCRATCH' : 'SIGN ORDER'}
              </span>
              <span className="t-micro font-mono text-newsprint-900/80 mt-0.5">
                24k Golden Sherpie
              </span>
            </>
          )}

          {/* Current Yield Tag */}
          <div className="theme-allow mt-2 px-2.5 py-0.5 rounded-full bg-newsprint-950/70 backdrop-blur-sm border border-newsprint-800/40 flex items-center gap-1 font-mono text-[11px] font-bold text-emerald-300 shadow">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>+{formatCurrency(clickValue)} / tap</span>
          </div>
        </div>
      </button>

      {/* Helper caption — copy must never lie about the economy (see audit: UI vs
          code drift). In Phase 1 it names the actual location, because "the
          customs desk" is not a place a player can picture. */}
      <span className="mt-1.5 t-caption font-mono text-newsprint-800 text-center">
        {phase === 1
          ? tutorialStepIndex < 1
            ? 'Slam the stamp to seize contraband. One tap unseals BagHolder Pro.'
            : 'BagHolder Pro is live. Open a PUT, fire a YAP, settle the crash.'
          : isCapsFrenzy
          ? `CAPS LOCK FRENZY: ${FRENZY_CLICK_MULTIPLIER}x REVENUE // CLICK AS FAST AS POSSIBLE`
          : 'Slam Sherpie to issue executive orders & build tantrum'}
      </span>

      {/* 280-Character Macro Wreck. It has to be visible or it is not a mechanic —
          a perk that fires silently every 25 slams is indistinguishable from the
          rounding error it actually is. The countdown, not a claim about the
          odds, is what the player can act on: an eight-second window they can
          open a PUT inside. */}
      {flashDipSecondsRemaining > 0 && (
        <div
          role="status"
          aria-live="polite"
          {...hint(
            `FLASH DIP — ${Math.ceil(flashDipSecondsRemaining)}s of ${FLASH_DIP_VALUATION_MULTIPLIER}x options valuation left. It is applied to the SIGNED return, so a PUT you opened before it fired is paying enormously and a CALL is dying six times as fast. It expires on a timer whether or not you use it.`
          )}
          className="mt-1 px-2 py-0.5 rounded bg-wax-500/20 border border-wax-600/70 text-center font-mono t-caption font-black text-wax-600 animate-calm-glow"
        >
          FLASH DIP {Math.ceil(flashDipSecondsRemaining)}s · {FLASH_DIP_VALUATION_MULTIPLIER}x OPTIONS
        </div>
      )}
    </div>
  );
};
