/**
 * Desk Slice: Manages manual clicker, ink stamina, tantrum meter, CAPS LOCK frenzy,
 * interactive desk props (Red Phone, Gold Box, Shredder), and Crony Tech Tree upgrades.
 */

import type { StateCreator } from 'zustand';
import type { DeskState, GamePhase } from '../../types/desk';
import type { LeftChannelTab, RightChannelTab } from '../../types/unlocks';
import type { GameStore } from '../useGameStore';
import {
  calculateClickValue,
  calculateInkRefillCost,
  calculateOfflineEarnings,
} from '../../engine/math/formulas';
import { INITIAL_CRONY_UPGRADES } from '../../constants/unlocks';
import { PARODY_NATIONS } from '../../constants/nations';
import { TUTORIAL_CHAIN } from '../../constants/onboarding';
import {
  CRISIS_BOOK,
  CRISIS_HEAT_PER_TIER,
  CRISIS_INTERVAL_BY_PHASE,
  CRISIS_TANTRUM_REWARD,
  CRISIS_TIER_MULTIPLIERS,
  CRISIS_WINDOW_SECONDS,
  crisisBasePayoutForPhase,
  crisisTierForElapsed,
} from '../../constants/crisis';
import {
  INK_PER_CLICK,
  INK_REGEN_PER_SECOND,
  INKED_TANTRUM_PER_CLICK,
  DIET_SODA_TANTRUM_PER_CLICK,
  DRY_TANTRUM_PER_CLICK,
  FRENZY_DURATION_SECONDS,
  FRENZY_COOLDOWN_BY_PHASE,
  FRENZY_COOLDOWN_TANTRUM_DECAY_PER_SECOND,
  DRY_CLICK_JAM_THRESHOLD,
  INK_REFILL_TREASURY_RATIO,
  CRONY_FAVOR_PASSIVE_PER_SECOND,
  CRONY_FAVOR_MAX,
  TANTRUM_VENT_CONSUME_RATIO,
  TANTRUM_VENT_VEX_RELIEF,
  TANTRUM_VENT_MIN_TANTRUM,
  VEX_BASELINE,
} from '../../constants/balance';
import { sound } from '../../audio/soundEngine';
import { formatCurrency } from '../../engine/math/bigNumber';

/** Compact cash for short desk notices (e.g. "+$6.00K TREASURY"). */
function formatCompactCash(value: number): string {
  return formatCurrency(value);
}

export interface DeskSlice extends DeskState {
  treasuryCash: number;
  passiveCashPerSecond: number;
  lastTickTimestamp: number;

  /** Lifetime treasury cash accumulated this run (drives the Tier 1 prestige SIS formula). */
  lifetimeCashEarned: number;

  // Active Channel Tabs
  activeLeftTab: LeftChannelTab;
  activeRightTab: RightChannelTab;
  setActiveLeftTab: (tab: LeftChannelTab) => void;
  setActiveRightTab: (tab: RightChannelTab) => void;

  // Upgrades
  activeUpgrades: string[];
  buyUpgrade: (upgradeId: string) => boolean;

  /** Advance the onboarding chain. Clamped at the end; never wraps. */
  advanceTutorial: () => void;
  /** Skip onboarding permanently (players who already know the loop). */
  skipTutorial: () => void;

  // Interactive Desk Props
  triggerRedPhoneBailout: () => boolean;
  sellClassifiedSecrets: () => boolean;
  shredSubpoenas: () => boolean;
  printEmergencyCash: () => boolean;

  // Crisis Call (Red Rotary Phone dial)
  swearInCrisis: () => boolean;
  suppressCrisis: () => boolean;
  dismissCrisisOutcome: () => void;

  // Bilateral Tariffs state
  tariffRates: Record<string, number>;
  setTariffRate: (nationId: string, rate: number) => void;

  clickDesk: () => boolean;
  refillInk: () => boolean;
  /**
   * VENT THE TANTRUM: burn all accumulated tantrum for a burst of VEX relief.
   * Never optimal (see TANTRUM_VENT_CONSUME_RATIO) — it exists as a panic
   * button for calm options pricing, and as the Tantrum meter's counterpart
   * to the Ink meter's refill action.
   */
  ventTantrum: () => boolean;
  tickDesk: (deltaSeconds: number) => void;
  creditOfflineEarnings: (elapsedSeconds: number) => number;
  setGamePhase: (phase: GamePhase) => void;
}

export const createDeskSlice: StateCreator<GameStore, [], [], DeskSlice> = (set, get) => ({
  phase: 1,
  hasMarketAccess: false,
  tutorialStepIndex: 0,
  hasRadarAccess: false,
  hasPolyGriftAccess: false,
  hasCronyUnlocksAccess: false,
  hasTariffAccess: false,
  hasPrestigeAccess: false,
  totalClicks: 0,
  inkLevel: 100,
  maxInk: 100,
  inkRefillCount: 0,
  tantrumMeter: 0,
  isCapsFrenzy: false,
  capsFrenzySecondsRemaining: 0,
  totalFrenziesTriggered: 0,
  frenzyCooldownSecondsRemaining: 0,
  dryClicksCount: 0,
  lastClickTimestamp: 0,
  lastShredTimestamp: 0,
  lastSecretSaleTimestamp: 0,
  lastPrinterTimestamp: 0,
  tariffRevenuePerSecond: 0,
  treasuryCash: 100.0, // Starting seed cash
  passiveCashPerSecond: 0,
  lastTickTimestamp: Date.now(),
  lifetimeCashEarned: 100.0,

  activeLeftTab: 'stocks',
  activeRightTab: 'dump',
  setActiveLeftTab: (tab) => {
    const state = get();
    const isUnlocked =
      (tab === 'stocks' && state.hasMarketAccess) ||
      (tab === 'radar' && state.hasRadarAccess) ||
      (tab === 'polygrift' && state.hasPolyGriftAccess);
    if (isUnlocked) set({ activeLeftTab: tab });
  },
  setActiveRightTab: (tab) => {
    const state = get();
    const isUnlocked =
      (tab === 'dump' && state.phase >= 2) ||
      (tab === 'unlocks' && state.hasCronyUnlocksAccess) ||
      (tab === 'tariffs' && state.hasTariffAccess) ||
      (tab === 'caymans' && state.hasPrestigeAccess);
    if (isUnlocked) set({ activeRightTab: tab });
  },

  activeUpgrades: [],
  activeCrisis: null,
  crisisCooldownSeconds: 8,
  totalCrisesAnswered: 0,
  totalCrisesSuppressed: 0,
  lastCrisisOutcome: undefined,
  tariffRates: {
    north_annex: 125,
    nearshore_fed: 150,
    strike_republic: 200,
    overthinker_union: 100,
    red_factory: 175,
    silicon_archipelago: 75,
  },
  setTariffRate: (nationId, rate) =>
    set((state) => {
      if (state.phase < 2 || !state.hasTariffAccess) return state;
      return {
        tariffRates: { ...state.tariffRates, [nationId]: rate },
        hasPrestigeAccess: state.hasPrestigeAccess || state.tariffRates[nationId] !== rate,
      };
    }),

  /**
   * ADVANCE TUTORIAL: clamps at the end of the chain so a completed tutorial
   * can never wrap back to step 0. A function (not a raw setter) so no caller
   * can corrupt the index into a negative or out-of-range state.
   */
  advanceTutorial: () =>
    set((state) => ({
      tutorialStepIndex: Math.min(TUTORIAL_CHAIN.length, state.tutorialStepIndex + 1),
    })),

  skipTutorial: () => set({ tutorialStepIndex: TUTORIAL_CHAIN.length }),

  buyUpgrade: (upgradeId: string) => {
    const state = get();
    if (state.phase < 2 || !state.hasCronyUnlocksAccess) return false;
    if (state.activeUpgrades.includes(upgradeId)) return false;

    const def = INITIAL_CRONY_UPGRADES.find((u) => u.id === upgradeId);
    if (!def || state.treasuryCash < def.cost) return false;

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash - def.cost,
      activeUpgrades: [...state.activeUpgrades, upgradeId],
      hasTariffAccess: true,
    });
    return true;
  },

  triggerRedPhoneBailout: () => {
    const state = get();
    // Only available when broke (< $10)
    if (state.treasuryCash >= 10) return false;

    const bailoutAmount = 5000 * (1 + state.phase);
    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + bailoutAmount,
    });
    return true;
  },

  sellClassifiedSecrets: () => {
    const state = get();
    const now = Date.now();
    // Cooldown check: max 1 sale every 8 seconds, unless broke (< $50) emergency bailout
    const elapsed = now - (state.lastSecretSaleTimestamp || 0);
    if (elapsed < 8000 && state.treasuryCash >= 50) return false;

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + 500,
      slopSuspicion: Math.min(100, state.slopSuspicion + 8),
      lastSecretSaleTimestamp: now,
    });
    return true;
  },

  shredSubpoenas: () => {
    const state = get();
    const now = Date.now();

    // INVARIANT: Phase gate — shredder only available in Oval Office (Phase >= 2)
    if (state.phase < 2) return false;

    // INVARIANT: Cooldown enforcement (5-second shredder cooldown)
    if (now - (state.lastShredTimestamp || 0) < 5000) return false;

    // INVARIANT: Cost gate — Requires 10 Crony Favor (political capital to shred federal subpoenas)
    if (state.cronyFavor < 10) return false;

    sound.playDeskThud();
    set({
      cronyFavor: state.cronyFavor - 10,
      slopSuspicion: Math.max(0, state.slopSuspicion - 25),
      lastShredTimestamp: now,
    });
    return true;
  },

  printEmergencyCash: () => {
    const state = get();
    const now = Date.now();
    if (!state.activeUpgrades.includes('broad_daylight_printer')) return false;
    if (now - state.lastPrinterTimestamp < 60000) return false;

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + 100000,
      slopSuspicion: Math.min(100, state.slopSuspicion + 15),
      lastPrinterTimestamp: now,
    });
    return true;
  },

  // ===================================================================
  // THE CRISIS CALL — Red Rotary Phone dial
  // ===================================================================

  swearInCrisis: () => {
    const state = get();
    const crisis = state.activeCrisis;
    if (!crisis) return false;

    const def = CRISIS_BOOK.find((c) => c.id === crisis.id);
    if (!def) return false;

    const tier = crisisTierForElapsed(crisis.elapsedSeconds);
    const tierDef = def.tiers[tier];
    const payout = Math.round(
      crisisBasePayoutForPhase(state.phase) * CRISIS_TIER_MULTIPLIERS[tier]
    );
    const heat = CRISIS_HEAT_PER_TIER * (tier + 1);

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + payout,
      lifetimeCashEarned: state.lifetimeCashEarned + payout,
      slopSuspicion: Math.min(100, state.slopSuspicion + heat),
      tantrumMeter: Math.min(100, state.tantrumMeter + CRISIS_TANTRUM_REWARD),
      activeCrisis: null,
      crisisCooldownSeconds: CRISIS_INTERVAL_BY_PHASE[state.phase] ?? 45,
      totalCrisesAnswered: state.totalCrisesAnswered + 1,
      lastCrisisOutcome: `SWEAR IN // ${tierDef.severity} // +${formatCompactCash(payout)} TREASURY // +${heat}% HEAT`,
    });
    return true;
  },

  suppressCrisis: () => {
    const state = get();
    if (!state.activeCrisis) return false;

    // INVARIANT: suppression is always a legal escape hatch, but it forfeits the
    // crisis tantrum and resets the phone, so it is a real (if passive) choice.
    sound.playDeskThud();
    set({
      activeCrisis: null,
      crisisCooldownSeconds: CRISIS_INTERVAL_BY_PHASE[state.phase] ?? 45,
      totalCrisesSuppressed: state.totalCrisesSuppressed + 1,
      lastCrisisOutcome: 'SUPPRESSED // Statement issued. Nothing improved. Tantrum wasted.',
    });
    return true;
  },

  dismissCrisisOutcome: () => set({ lastCrisisOutcome: undefined }),

  /**
   * VENT THE TANTRUM.
   *
   * INVARIANT: [Venting Must Never Be Optimal]
   * Burns the entire meter — including any overflow past 100% that a FRENZY
   * would have consumed for free — and buys VEX relief that is clamped to the
   * VEX baseline. Taking a frenzy to 100% is therefore always worth more than
   * venting at 99%, so this is a deliberate trade, not an upgrade path.
   * Blocked during FRENZY and during the post-frenzy cooldown, so it cannot be
   * used to dodge the Cooling-Off Protocol.
   */
  ventTantrum: () => {
    const state = get();
    if (state.isCapsFrenzy) return false;
    if (state.frenzyCooldownSecondsRemaining > 0) return false;
    if (state.tantrumMeter < TANTRUM_VENT_MIN_TANTRUM) return false;

    const burned = state.tantrumMeter * TANTRUM_VENT_CONSUME_RATIO;
    // Relieve VEX proportionally to how much pressure was released, capped so
    // it can never push volatility below the market's natural floor.
    const relief = Math.min(TANTRUM_VENT_VEX_RELIEF * (burned / 100), VEX_BASELINE);

    sound.playDeskThud();
    set({
      tantrumMeter: Math.max(0, state.tantrumMeter - burned),
      vexVolatility: Math.max(VEX_BASELINE, state.vexVolatility - relief),
      lastCrisisOutcome: `VENTED // Tantrum purged. VEX cooled by ${relief.toFixed(1)} points.`,
    });
    return true;
  },

  clickDesk: () => {
    const state = get();
    const now = Date.now();

    // INVARIANT: Rate-limit manual clicks to max ~20 clicks/sec to prevent autoclicker exploits
    if (now - (state.lastClickTimestamp || 0) < 45) {
      return false;
    }

    const isDry = state.inkLevel <= 0 && !state.isCapsFrenzy;
    const currentDryClicks = isDry ? (state.dryClicksCount || 0) + 1 : 0;
    // INVARIANT: After DRY_CLICK_JAM_THRESHOLD consecutive dry scratches the nib jams,
    // collapsing dry yield further (but never below the bankruptcy floor).
    const isJammed = isDry && currentDryClicks >= DRY_CLICK_JAM_THRESHOLD;

    // Sound feedback
    if (state.phase === 1) {
      sound.playDeskThud();
    } else if (isDry) {
      sound.playDryScratch();
    } else {
      sound.playSharpieSqueak();
    }

    // Cash calculation with dry clicks penalty
    let earnedCash = calculateClickValue(
      state.phase,
      5.0,
      state.isCapsFrenzy ? 100 : state.inkLevel,
      state.isCapsFrenzy,
      state.sovereignImmunitySlips || 0,
      isJammed
    );

    // Apply Heavy Tungsten Nib multiplier (+100%)
    if (state.activeUpgrades.includes('heavy_tungsten_nib')) {
      earnedCash *= 2;
    }

    // Tantrum gain:
    // INVARIANT: [The Cooling-Off Protocol]
    // Tantrum does NOT accumulate during an active FRENZY, and cannot accumulate
    // at all while the post-frenzy cooldown is running. Without this gate the meter
    // is already >100% the moment the frenzy timer expires, so frenzy re-triggers
    // on the same frame and uptime approaches 100%.
    let tantrumDelta = 0;
    if (state.isCapsFrenzy || state.frenzyCooldownSecondsRemaining > 0) {
      // No accumulation during frenzy or while cooling off.
      tantrumDelta = 0;
    } else if (isDry) {
      tantrumDelta = DRY_TANTRUM_PER_CLICK;
    } else {
      tantrumDelta = state.activeUpgrades.includes('diet_soda_drip')
        ? DIET_SODA_TANTRUM_PER_CLICK
        : INKED_TANTRUM_PER_CLICK;
    }

    let nextTantrum = state.tantrumMeter + tantrumDelta;
    let shouldTriggerFrenzy = state.isCapsFrenzy;
    let frenzyRemaining = state.capsFrenzySecondsRemaining;
    let frenziesCount = state.totalFrenziesTriggered;
    let nextCooldown = state.frenzyCooldownSecondsRemaining;
    // Ink consumption: normal clicks consume INK_PER_CLICK; during frenzy ink is infinite
    let nextInkLevel = state.isCapsFrenzy ? state.inkLevel : Math.max(0, state.inkLevel - INK_PER_CLICK);
    let nextRefillCount = state.inkRefillCount;

    // Trigger CAPS LOCK FRENZY only when legitimate ink was used AND the
    // post-frenzy cooldown has elapsed.
    if (
      nextTantrum >= 100 &&
      !state.isCapsFrenzy &&
      !isDry &&
      state.frenzyCooldownSecondsRemaining <= 0
    ) {
      shouldTriggerFrenzy = true;
      nextTantrum = 0;
      frenzyRemaining = FRENZY_DURATION_SECONDS;
      nextCooldown = 0;
      frenziesCount += 1;
      // INVARIANT: Frenzy does NOT grant free 100% ink refills. Current ink is preserved.
      nextInkLevel = state.inkLevel;
      nextRefillCount = Math.max(0, nextRefillCount - 1);
    }

    const nextCash = state.treasuryCash + earnedCash;
    let nextPhase = state.phase;
    if (state.phase === 1 && nextCash >= 1000000) {
      nextPhase = 2;
      sound.playChaChing();
    } else if (state.phase === 2 && nextCash >= 100000000000) {
      nextPhase = 3;
      sound.playChaChing();
    } else if (state.phase === 3 && nextCash >= 1e18) {
      nextPhase = 4;
      sound.playChaChing();
    }

    // REDESIGN: [The Ten-Minute Wall]
    // BagHolder Pro + YAP now unlock on the VERY FIRST SLAM, not at $10,000.
    // The causal shorting loop IS the game's subject; hiding it behind 2,000
    // clicks of the weakest verb meant most players never saw the premise.
    // `hasMarketAccess` used to be a cash threshold — it is now an event.
    //
    // INVARIANT: onboarding gates on the tutorial index, NEVER on
    // `totalClicks === 0`. A save that already contains clicks (an interrupted
    // session, a migrated save, a player who skipped onboarding) would
    // otherwise be permanently stuck on step 1 with no way forward. Keying off
    // the index makes every advance idempotent and self-healing.
    const isFirstSlam = state.tutorialStepIndex === 0;

    // INVARIANT: [Onboarding Must Always Terminate]
    // The final tutorial step is manual ("Seal It"). If a player simply ignores
    // it, the directive card would sit above the objectives forever. Reaching
    // the Oval Office is proof the player understood the loop, so promote them
    // past onboarding automatically. Never nag a player who has demonstrably
    // graduated.
    const tutorialStepIndex =
      nextPhase >= 2 && state.tutorialStepIndex < TUTORIAL_CHAIN.length
        ? TUTORIAL_CHAIN.length
        : isFirstSlam
          ? 1
          : state.tutorialStepIndex;

    set({
      treasuryCash: nextCash,
      lifetimeCashEarned: state.lifetimeCashEarned + earnedCash,
      phase: nextPhase,
      hasMarketAccess: state.hasMarketAccess || isFirstSlam,
      tutorialStepIndex,
      totalClicks: state.totalClicks + 1,
      inkLevel: nextInkLevel,
      dryClicksCount: currentDryClicks,
      inkRefillCount: nextRefillCount,
      tantrumMeter: Math.min(100, nextTantrum),
      isCapsFrenzy: shouldTriggerFrenzy,
      capsFrenzySecondsRemaining: frenzyRemaining,
      totalFrenziesTriggered: frenziesCount,
      frenzyCooldownSecondsRemaining: nextCooldown,
      lastClickTimestamp: now,
    });
    return true;
  },

  refillInk: () => {
    const state = get();
    const baseCost = calculateInkRefillCost(state.inkRefillCount);

    // INVARIANT: [Ink Is A Cost Center]
    // Refills cost a flat escalating term PLUS a percentage of treasury, so ink
    // is a real ongoing tax on earnings at every stage rather than a rounding error.
    const treasuryTax = state.treasuryCash * INK_REFILL_TREASURY_RATIO;
    const cost = Math.min(baseCost + treasuryTax, baseCost * 4);

    if (state.treasuryCash < cost) {
      return false;
    }

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash - cost,
      inkLevel: state.maxInk,
      dryClicksCount: 0,
      inkRefillCount: state.inkRefillCount + 1,
    });
    return true;
  },

  tickDesk: (deltaSeconds: number) => {
    const state = get();

    // 1. Passive agency cash accrual
    let passiveGain = state.passiveCashPerSecond * deltaSeconds;

    // AI Autopen Interns passive clicks (5 taps/sec)
    if (state.activeUpgrades.includes('autopen_army')) {
      const autopenBase = state.phase === 1 ? 5.0 : 50.0;
      const autopenPerSec = autopenBase * 5;
      passiveGain += autopenPerSec * deltaSeconds;
    }

    // 2. Bilateral Tariffs passive export duties (Laffer curve with diminishing returns above 250%)
    let calculatedTariffRev = 0;
    let retaliatoryHeat = 0;

    PARODY_NATIONS.forEach((nation) => {
      const rate = state.tariffRates[nation.id] ?? nation.defaultTariffRate;
      let rateMultiplier = 0;

      if (rate <= 250) {
        // Linear export revenue up to 250% tariff
        rateMultiplier = rate / 100;
      } else {
        // Diminishing returns & smuggling above 250%
        rateMultiplier = Math.max(0.3, 2.5 - ((rate - 250) / 100) * 0.4);
        // Extreme trade war sanctions generate Inflation Heat
        retaliatoryHeat += 0.08 * deltaSeconds;
      }

      const baseDuty = nation.baseExportYield || 10.0;
      calculatedTariffRev += baseDuty * rateMultiplier * (state.phase === 1 ? 0.3 : state.phase * 0.9);
    });

    const totalTariffIncome = calculatedTariffRev * deltaSeconds;

    // Frenzy timer countdown
    let isFrenzy = state.isCapsFrenzy;
    let frenzyRemaining = state.capsFrenzySecondsRemaining;
    // INVARIANT: [The Cooling-Off Protocol] starting a lockout the moment frenzy ends.
    let frenzyCooldown = state.frenzyCooldownSecondsRemaining;
    let tantrumAfterTick = state.tantrumMeter;

    if (isFrenzy) {
      frenzyRemaining -= deltaSeconds;
      if (frenzyRemaining <= 0) {
        isFrenzy = false;
        frenzyRemaining = 0;
        // INVARIANT: [The Cooling-Off Protocol] scales with phase so early game
        // stays snappy and late game makes frenzy genuinely precious.
        frenzyCooldown = FRENZY_COOLDOWN_BY_PHASE[state.phase] ?? 15;
      }
    } else if (frenzyCooldown > 0) {
      // Cool down the tantrum meter while locked out so the player is not
      // sitting on a full meter the instant the lockout expires.
      frenzyCooldown -= deltaSeconds;
      if (frenzyCooldown <= 0) {
        frenzyCooldown = 0;
        tantrumAfterTick = 0;
      } else {
        tantrumAfterTick = Math.max(
          0,
          tantrumAfterTick - FRENZY_COOLDOWN_TANTRUM_DECAY_PER_SECOND * deltaSeconds
        );
      }
    }

    // Natural ink passive regeneration (0.5 units / sec)
    const regeneratedInk = isFrenzy
      ? state.inkLevel
      : Math.min(state.maxInk, state.inkLevel + INK_REGEN_PER_SECOND * deltaSeconds);

    // Crony Favor passive drip: holding power accrues political capital over time.
    const favorGain = CRONY_FAVOR_PASSIVE_PER_SECOND * deltaSeconds;

    // INVARIANT: [Integer Crony Favor]
    // The passive faucet grants a fractional trickle (0.05/s). Carrying the
    // fractional part in `cronyFavorRemainder` and only ever promoting whole
    // units keeps the displayed counter a clean integer while preserving the
    // exact 0.05/s rate — no favour is lost to rounding, and the player never
    // sees "🤝 82.34520000000012" on a currency spent in discrete bribes.
    const favorPool = favorGain + state.cronyFavorRemainder;
    const favorWholeUnits = Math.floor(favorPool);
    const favorRemainder = favorPool - favorWholeUnits;

    // ===================================================================
    // THE CRISIS CALL — spawn / age / auto-suppress
    // ===================================================================
    let activeCrisis = state.activeCrisis;
    let crisisCooldown = state.crisisCooldownSeconds;
    let totalCrisesSuppressed = state.totalCrisesSuppressed;
    let crisisOutcome = state.lastCrisisOutcome;

    if (activeCrisis) {
      const nextElapsed = activeCrisis.elapsedSeconds + deltaSeconds;
      if (nextElapsed >= CRISIS_WINDOW_SECONDS) {
        // INVARIANT: an ignored crisis resolves as a suppression — no payout and
        // no heat, but the tantrum it would have fed is forfeited.
        totalCrisesSuppressed += 1;
        activeCrisis = null;
        crisisCooldown = CRISIS_INTERVAL_BY_PHASE[state.phase] ?? 45;
        crisisOutcome = 'SUPPRESSED // The crisis passed. The tantrum is gone.';
      } else {
        activeCrisis = { ...activeCrisis, elapsedSeconds: nextElapsed };
      }
    } else {
      crisisCooldown -= deltaSeconds;
      if (crisisCooldown <= 0) {
        const def = CRISIS_BOOK[Math.floor(Math.random() * CRISIS_BOOK.length)];
        activeCrisis = { id: def.id, elapsedSeconds: 0 };
        crisisCooldown = CRISIS_INTERVAL_BY_PHASE[state.phase] ?? 45;
      }
    }

    const nextCash = state.treasuryCash + passiveGain + totalTariffIncome;
    let nextPhase = state.phase;
    if (state.phase === 1 && nextCash >= 1000000) {
      nextPhase = 2;
      sound.playChaChing();
    } else if (state.phase === 2 && nextCash >= 100000000000) {
      nextPhase = 3;
      sound.playChaChing();
    } else if (state.phase === 3 && nextCash >= 1e18) {
      nextPhase = 4;
      sound.playChaChing();
    }

    set({
      treasuryCash: nextCash,
      lifetimeCashEarned: state.lifetimeCashEarned + passiveGain + totalTariffIncome,
      phase: nextPhase,
      // REDESIGN: the cash gate is gone — the market now unlocks on the first slam.
      // Passive income must never be what opens the terminal, or a player who
      // idles to $10k would get a surprise market they never learned to use.
      hasMarketAccess: state.hasMarketAccess,
      // Same invariant as clickDesk: onboarding ends for good at Phase 2.
      tutorialStepIndex:
        nextPhase >= 2 && state.tutorialStepIndex < TUTORIAL_CHAIN.length
          ? TUTORIAL_CHAIN.length
          : state.tutorialStepIndex,
      inkLevel: regeneratedInk,
      tariffRevenuePerSecond: calculatedTariffRev,
      slopSuspicion: Math.min(100, state.slopSuspicion + retaliatoryHeat),
      cronyFavor: Math.min(CRONY_FAVOR_MAX, state.cronyFavor + favorWholeUnits),
      cronyFavorRemainder: favorRemainder,
      isCapsFrenzy: isFrenzy,
      capsFrenzySecondsRemaining: Math.max(0, frenzyRemaining),
      frenzyCooldownSecondsRemaining: Math.max(0, frenzyCooldown),
      tantrumMeter: Math.max(0, Math.min(100, tantrumAfterTick)),
      activeCrisis,
      crisisCooldownSeconds: Math.max(0, crisisCooldown),
      totalCrisesSuppressed,
      lastCrisisOutcome: crisisOutcome,
      lastTickTimestamp: Date.now(),
    });
  },

  creditOfflineEarnings: (elapsedSeconds) => {
    const state = get();
    const totalPassiveRate = state.passiveCashPerSecond + state.tariffRevenuePerSecond;
    const { cashEarned } = calculateOfflineEarnings(totalPassiveRate, elapsedSeconds);
    if (cashEarned <= 0) return 0;

    set({
      treasuryCash: state.treasuryCash + cashEarned,
      lifetimeCashEarned: state.lifetimeCashEarned + cashEarned,
      // Offline earnings can cross the Phase 2 threshold while the tab is shut.
      // Onboarding must terminate on that path too, or a returning player who
      // idled overnight comes back to a tutorial they finished days ago.
      tutorialStepIndex:
        state.phase >= 2 && state.tutorialStepIndex < TUTORIAL_CHAIN.length
          ? TUTORIAL_CHAIN.length
          : state.tutorialStepIndex,
    });
    return cashEarned;
  },

  setGamePhase: (phase: GamePhase) => set({ phase }),
});
