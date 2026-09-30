/**
 * Dual-Phase Clicker Button — the hero tap target.
 * Phase 1: a rubber stamp at the Deeply Terminal Annex. Phase 2+: the 24k Golden
 * Sherpie signing on the Resolute blotter. Fluid layout, zero overflow at 720p.
 *
 * INVARIANT: [The Verb On The Stamp Must Be True]
 * The Phase 2+ face read `SIGN TARIFF`, but clicking it set no tariff — the YAP
 * button does that. Two buttons, one verb, one of them lying. It now reads
 * `SIGN ORDER`, which is exactly what the click does: cash, plus tantrum.
 */

import React, { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useGameStore } from '../../store/useGameStore';
import { calculateInkRefillTotal } from '../../engine/math/formulas';
import { resolveClickPayout, TUNGSTEN_NIB_MULTIPLIER } from '../../engine/systems/clickPayout';
import { isFirstSlam } from '../../engine/systems/onboardingEngine';
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
import { hint } from '../ui/hint';
import { StampIllustration } from './StampIllustration';
import { StampFaceLabel } from './StampFaceLabel';
import { InkParticles, type FloatingNumber, type InkSplatter } from './InkParticles';

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
  /* The ink splatters and floating numbers are `position: absolute` children of
     this component's root, but the click's coordinates are naturally relative to
     the BUTTON. Those are two different boxes: the root is as wide as the wider of
     the stamp and the caption, so once the stamp shrinks (a ringing crisis takes
     the desk from ~300px to ~130px) the root stays wide and every droplet lands
     displaced from the click that made it — 11px at 1080p, and it grows from
     there. Measuring against this ref instead of the button's rect makes the two
     boxes the same box in every state. */
  const rootRef = useRef<HTMLDivElement>(null);

  const dryClicksCount = useGameStore((s) => s.dryClicksCount || 0);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const flashDipSecondsRemaining = useGameStore((s) => s.flashDipSecondsRemaining);

  // The CHARGED yield, from the same function `clickDesk` charges with. This used
  // to call `calculateClickValue` directly, silently omitting the Heavy Tungsten
  // Nib's doubling — the hero number was understated by 100% for anyone owning the
  // cheapest upgrade. See `engine/systems/clickPayout.ts`.
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

  /* ISSUE-002 [First-Frame Guidance]. Keyed off the TUTORIAL INDEX, not
     `totalClicks === 0`, for the reason `onboardingEngine` documents at length:
     an interrupted session, a migrated save, or a player who skipped onboarding
     all have clicks and no first slam, and a click-count test would either
     re-nag a returning player or strand them. `isFirstSlam` is the predicate the
     engine itself uses to open the market, so "before your first slam" means
     one thing everywhere in the app. */
  const isFirstSlamPending = isFirstSlam(tutorialStepIndex);

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
  // What is actually multiplying this slam. The `+X / tap` tag is the number the
  // player plans around, so the hover must account for it — and the multipliers
  // are read from the engine's inputs, never re-typed: a figure in copy rots.
  //
  // INVARIANT: the dry branch states the JAMMED yield too. "10% of the inked
  // yield" is true only for the first 30 dry clicks; after that the nib jams and
  // the engine pays 2%. A player dry long enough to read this tooltip is the one
  // reading a number that has already stopped being true.
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

  /* INVARIANT: [The Tag Explains The Number It Sits Under]
     The yield tag is the one element on the object that is a HUD rather than
     scenery — it is the figure the player plans a session around — so it
     carries its own hint instead of relying on the whole button's. The tag's
     figure comes from the same `resolveClickPayout` the tick charges with, so
     what it says and what it pays cannot drift apart. */
  const yieldTagHint = `THIS SLAM PAYS ${formatCurrency(clickValue)}. ${
    isDry
      ? `Your nib is dry, so this is the ${Math.round(
          dryClicksCount >= DRY_CLICK_JAM_THRESHOLD
            ? DRY_CLICK_JAM_YIELD_MULTIPLIER
            : DRY_CLICK_YIELD_MULTIPLIER
        )}% dry rate, not the inked one — and it builds no Tantrum.`
      : isCapsFrenzy
      ? `FRENZY IS LIVE, so this is ${FRENZY_CLICK_MULTIPLIER}x the inked rate. Ink is held, not topped up, so the tank you brought is the tank you get back.`
      : `This is the inked rate for one slam, after every multiplier you own. It is the number the shop's Tungsten Nib, the Sovereign Immunity Slips and the Shell Company perk all scale.`
  }`;

  // C1: the recoil used to fire on BOTH the stamp face and the directive card at
  // 100% tantrum, and the slam travelled 14px. During FRENZY the player clicks
  // many times a second, so the impacts overlapped into a continuous judder. At
  // high tantrum we swap to the damped slam and halve the recoil: it still reads,
  // but it no longer fights the cursor.
  const isRecoilActive = screenShakeEnabled && (isCapsFrenzy || isHighTantrum);
  const slamClass = isHighTantrum
    ? 'animate-stamp-slam-calm'
    : slamNonce % 2 === 0
    ? 'animate-stamp-slam'
    : 'animate-stamp-slam-alt';
  const inkColor = isCapsFrenzy ? 'var(--color-dead)' : phase === 1 ? 'var(--color-signal)' : 'var(--color-accent-soft)';

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
        colors: ['var(--color-dead)', 'var(--color-accent)', 'var(--color-dead-ink)'],
      });
    }

    /* INVARIANT: [Particles Are Measured Against The Box They Render In]
       The splatters and floating numbers are absolutely positioned in the ROOT,
       so their coordinates must be relative to the root — not to `e.currentTarget`,
       which is the button. The two boxes differ whenever the caption is wider
       than the stamp, which is exactly the cramped-crisis case. */
    const host = rootRef.current ?? e.currentTarget;
    const rect = host.getBoundingClientRect();
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
    // AGENTS.md mandates ink splatters as tactile feedback. Before this the hero
    // emitted nothing but a number. Three droplets per slam, deterministic offsets
    // so a fast clicker produces no noise, capped so the array stays bounded.
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
    /* INVARIANT: [The Stamp Takes The Space It Is Given, And Only That Space]
       The root is `h-full`; the button is sized off a wrapper definite on both
       axes. This was a hard-coded `w-44 sm:w-52 md:w-60` circle on a zero-scroll
       flex column, so height and available space came from two unrelated numbers:
       134px of room against a 240px button, and 69px while a crisis rang. It
       overflowed by up to 95px and painted over the directive sheet. `my-auto`
       made it worse, pushing the overflow out of BOTH ends of the column. */
    <div
      ref={rootRef}
      className="relative h-full min-h-0 flex flex-col items-center justify-center gap-1 p-1 select-none"
    >
      {/* THE SQUARE. The stamp's size is derived here, not from its own
          contents, and that indirection is load-bearing: the button cannot be
          its own `container-type: size`, because as a centred flex item its
          width would be fit-content — the width of its own `cqw` lettering —
          and the browser resolves that cycle to ZERO. An earlier draft did
          exactly that and the stamp collapsed to a 4px sliver.

          This wrapper is `flex-1 min-h-0 w-full` in the desk column, so it is
          definite on both axes and does not depend on the button at all. The
          side comes from `100cqh` rather than `cqw` because height is always
          the scarce axis here: the desk column is ~470px wide and the leftover
          strip for the stamp is 130-370px tall, so height always binds first. */}
      <div
        className="relative flex-1 min-h-0 w-full flex items-center justify-center"
        style={{ containerType: 'size' }}
      >
        {/* [FIRST SLAM] The attention ring — ISSUE-002. Progressive disclosure
            exists at the CHANNEL level here (sealed dossiers) but not at the
            ELEMENT level, so on frame one the stamp and the props are all lit
            equally and nothing says which is the verb. This is the one signal
            that closes that gap without stacking an overlay on top of the
            tutorial directive, which is already in the right deck.

            A SIBLING of the button, not a class on it: the button carries a
            one-shot `animate-stamp-slam*` shorthand and both utilities set
            `animation` on the same element, so a second class there would be a
            coin toss over which wins. Sized off the same `100cqh` as the stamp
            from the same container, so the ring tracks the object at every
            viewport instead of drifting when the desk column shrinks. */}
        {isFirstSlamPending && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute rounded-full animate-attention-ring"
            style={{ width: 'min(100cqh, 320px)', height: 'min(100cqh, 320px)' }}
          />
        )}
        <button
          onClick={handleClick}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          onMouseLeave={() => setIsPressed(false)}
          onTouchStart={() => setIsPressed(true)}
          onTouchEnd={() => setIsPressed(false)}
          {...hint(clickerHint, clickerName)}
          /* The button is now its OWN typographic viewport, which is what the
             `t-stamp-*` tiers measure against — the one control in the app
             whose size is not fixed by the viewport. */
          /* The cap is the stamp's natural size, not a layout constraint: it only
             binds when the desk column is roomy (a 980px desk leaves 369px of
             stage), and it stops the hero object swallowing the whole blotter on
             a tall display. Below the cap the stamp is always the leftover.

             `containerName: 'stamp'` is what lets the face's small-stamp
             fallback in `index.css` target THIS button and nothing else — an
             unnamed `@container` would match the nearest container for every
             component in the app. */
          style={{
            containerType: 'size',
            containerName: 'stamp',
            width: 'min(100cqh, 320px)',
            height: 'min(100cqh, 320px)',
          }}
          className={`relative group shrink-0 max-w-full rounded-full flex flex-col items-center justify-center cursor-pointer stamp-face transition-[transform,box-shadow] duration-75 ${
            isPressed ? 'scale-95' : 'hover:scale-[1.02]'
          } ${slamClass} ${
            /* INVARIANT: [There Is No Disc. There Is An Object On A Desk.]
               The button used to carry a 320px fill of its own — first
               `from-blue-700 via-indigo-800 to-blue-950`, then a dark neutral
               radial. Both were wrong for the same reason: a filled circle
               behind the illustration is a second, larger shape competing with
               the thing it is supposed to contain, and at L* 15 it measured
               almost exactly the terminal's L* 16.6. Two large dark masses,
               side by side, one of them the hero control.

               So the button has no background at all. `StampIllustration`
               already draws everything the object needs — a metal barrel, a dark
               ink-stained rubber, a lit rim, and a cast shadow that puts it ON
               the desk rather than in front of it. The desk surface shows
               through the corners, which is what a stamp lying on a blotter
               actually looks like, and the darkest large area on screen goes
               back to being the machine, where it belongs.

               FRENZY IS THE ONE EXCEPTION, and it keeps a fill on purpose:
               being alarming at a glance is that state's entire job, and it is
               the only state permitted to shout. */
            isCapsFrenzy
              ? 'bg-[radial-gradient(circle_at_34%_26%,var(--color-dead),var(--color-dead-ink)_58%,var(--color-ink-1))] ring-4 ring-dead-ink/40 animate-calm-glow'
              : phase === 1
              ? ''
              : 'bg-[radial-gradient(circle_at_34%_26%,color-mix(in_srgb,var(--color-accent)_22%,transparent),transparent_72%)]'
          }`}
        >
          {/* Halo only in frenzy. On a still disc it re-saturated the one
              surface the object was finally allowed to sit quietly on. */}
          {isCapsFrenzy && <div className="absolute inset-0 rounded-full blur-lg opacity-25 bg-dead" />}

          {/* [2.3] The object. Drawn behind the lettering: on a real rubber
              stamp the text is printed ON the rubber, so the face has to be
              under the type, not around it. */}
          <StampIllustration face={phase === 1 ? 'customs' : 'sherpie'} isFrenzy={isCapsFrenzy} />

          <StampFaceLabel
            clickValue={clickValue}
            isPhase1={phase === 1}
            isDry={isDry}
            isRecoilActive={isRecoilActive}
            yieldHint={yieldTagHint}
          />
        </button>
      </div>
      <InkParticles
        splatters={splatters}
        floatingNumbers={floatingNumbers}
        /* Ids come from ONE shared counter, so an id belongs to at most one of
           the two lists and this needs no `kind` argument. Both are filtered
           anyway: they are capped at 6 and 18, and a stale id in the wrong list
           is a no-op rather than a leak. */
        onAnimationEnd={(id) => {
          setSplatters((prev) => prev.filter((s) => s.id !== id));
          setFloatingNumbers((prev) => prev.filter((f) => f.id !== id));
        }}
      />

      {/* Helper caption — copy must never lie about the economy (see audit: UI vs
          code drift). In Phase 1 it names the actual location, because "the
          customs desk" is not a place a player can picture. */}
      <span className="shrink-0 t-caption font-mono text-ink-3 text-center leading-snug">
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
          className="shrink-0 mt-1 px-2 py-0.5 rounded bg-dead/20 border border-dead-ink/70 text-center font-mono t-caption font-black text-dead-ink animate-calm-glow"
        >
          FLASH DIP {Math.ceil(flashDipSecondsRemaining)}s · {FLASH_DIP_VALUATION_MULTIPLIER}x OPTIONS
        </div>
      )}
    </div>
  );
};
