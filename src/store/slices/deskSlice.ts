/**
 * Desk Slice: Manages manual clicker, ink stamina, tantrum meter, CAPS LOCK frenzy,
 * interactive desk props (Red Phone, Gold Box, Shredder), and Crony Tech Tree upgrades.
 */

import type { StateCreator } from 'zustand';
import type { DeskSliceContract } from '../../types/store';
import type { GameStore } from '../useGameStore';
import {
  calculateClickValue,
  calculateInkRefillTotal,
  calculateOfflineEarnings,
} from '../../engine/math/formulas';
import { INITIAL_CRONY_UPGRADES } from '../../constants/unlocks';
import { tickCrisis } from '../../engine/systems/crisisEngine';
import { clickInkFrenzy, tickInkFrenzy } from '../../engine/systems/inkFrenzyEngine';
import { tickTariffRevenue } from '../../engine/systems/tariffEngine';
import { isPhasePromotion, nextPhaseFor } from '../../engine/systems/phaseEngine';
import { tickPassiveEconomy } from '../../engine/systems/passiveEngine';
import { clampCronyFavor } from '../../engine/systems/slopEngine';
import {
  advanceTutorialIndex,
  completedTutorialIndex,
  resolveMarketAccess,
  resolveTutorialIndex,
  resolvePassiveTutorialIndex,
} from '../../engine/systems/onboardingEngine';
import {
  canBuyUpgrades,
  canSetTariff,
} from '../../engine/systems/unlockEngine';
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
  CRONY_FAVOR_PASSIVE_PER_SECOND,
  TANTRUM_VENT_CONSUME_RATIO,
  TANTRUM_VENT_VEX_RELIEF,
  TANTRUM_VENT_MIN_TANTRUM,
  VEX_BASELINE,
} from '../../constants/balance';
import { sound } from '../../audio/soundEngine';

export interface DeskSlice extends DeskSliceContract {}

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

  // Cockpit channel selection lives in `channelSlice` — see [The Seal Is a
  // Promise, Not a Wall] there for why selection is not gated on unlock.

  activeUpgrades: [],
  // INVARIANT: [No Free Lunch At Customs] — every dial starts at ZERO, not at
  // `defaultTariffRate`. Pre-set dials paid ~$40/s from the first frame of a new
  // run (8x a $5.00 slam) before the player had the dials, so the clicker was
  // dominated by idling. `canSetTariff` gates the dial behind Phase 2 + access,
  // so revenue can only start once the player turns them. See `deskSlice` history.
  tariffRates: {
    north_annex: 0,
    nearshore_fed: 0,
    strike_republic: 0,
    overthinker_union: 0,
    red_factory: 0,
    silicon_archipelago: 0,
  },
  setTariffRate: (nationId, rate) =>
    set((state) => {
      if (!canSetTariff(state)) return state;
      return {
        tariffRates: { ...state.tariffRates, [nationId]: rate },
        hasPrestigeAccess: state.hasPrestigeAccess || state.tariffRates[nationId] !== rate,
      };
    }),

  /**
   * ADVANCE TUTORIAL: clamps at the end of the chain so a completed tutorial
   * can never wrap back to step 0. A function (not a raw setter) so no caller
   * can corrupt the index into a negative or out-of-range state.
   * See `onboardingEngine`.
   */
  advanceTutorial: () =>
    set((state) => ({ tutorialStepIndex: advanceTutorialIndex(state.tutorialStepIndex) })),

  skipTutorial: () => set({ tutorialStepIndex: completedTutorialIndex() }),

  buyUpgrade: (upgradeId: string) => {
    const state = get();
    if (!canBuyUpgrades(state)) return false;
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

  // ===================================================================
  // THE DESK PROPS live in `deskPropsSlice`.
  // ===================================================================

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

    // INVARIANT: [Ink & Frenzy live in the engine] — see `inkFrenzyEngine` for
    // the dry-nib, ink-freeze and Cooling-Off Protocol rules.
    const ink = clickInkFrenzy({
      inkLevel: state.inkLevel,
      tantrumMeter: state.tantrumMeter,
      isCapsFrenzy: state.isCapsFrenzy,
      capsFrenzySecondsRemaining: state.capsFrenzySecondsRemaining,
      frenzyCooldownSecondsRemaining: state.frenzyCooldownSecondsRemaining,
      totalFrenziesTriggered: state.totalFrenziesTriggered,
      dryClicksCount: state.dryClicksCount || 0,
      inkPerClick: INK_PER_CLICK,
      inkedTantrum: INKED_TANTRUM_PER_CLICK,
      dryTantrum: DRY_TANTRUM_PER_CLICK,
      dietSodaTantrum: DIET_SODA_TANTRUM_PER_CLICK,
      dryClickJamThreshold: DRY_CLICK_JAM_THRESHOLD,
      frenzyDurationSeconds: FRENZY_DURATION_SECONDS,
      hasDietSodaDrip: state.activeUpgrades.includes('diet_soda_drip'),
    });
    const { isJammed } = ink;

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

    const nextCash = state.treasuryCash + earnedCash;
    // INVARIANT: [One Definition Of The Phase Ladder] — see `phaseEngine`.
    const nextPhase = nextPhaseFor(state.phase, nextCash);
    if (isPhasePromotion(state.phase, nextPhase)) sound.playChaChing();

    // INVARIANT: [The Ten-Minute Wall] and [Onboarding Must Always Terminate]
    // — see `onboardingEngine`. The market opens on the FIRST SLAM, and
    // onboarding ends for good at Phase 2 on every cash-gain path.
    const tutorialStepIndex = resolveTutorialIndex(nextPhase, state.tutorialStepIndex);
    const marketAccess = resolveMarketAccess(state.hasMarketAccess, state.tutorialStepIndex);

    set({
      treasuryCash: nextCash,
      lifetimeCashEarned: state.lifetimeCashEarned + earnedCash,
      phase: nextPhase,
      // REDESIGN: [The Ten-Minute Wall] — see `onboardingEngine`.
      hasMarketAccess: marketAccess,
      tutorialStepIndex,
      totalClicks: state.totalClicks + 1,
      inkLevel: ink.inkLevel,
      dryClicksCount: ink.dryClicksCount,
      // A frenzy trigger consumes one stored refill charge. The engine owns the
      // trigger decision; the charge bookkeeping stays here with the economy.
      inkRefillCount: ink.triggeredFrenzy
        ? Math.max(0, state.inkRefillCount - 1)
        : state.inkRefillCount,
      tantrumMeter: ink.tantrumMeter,
      isCapsFrenzy: ink.isCapsFrenzy,
      capsFrenzySecondsRemaining: ink.capsFrenzySecondsRemaining,
      totalFrenziesTriggered: ink.totalFrenziesTriggered,
      frenzyCooldownSecondsRemaining: ink.frenzyCooldownSecondsRemaining,
      lastClickTimestamp: now,
    });
    return true;
  },

  refillInk: () => {
    const state = get();
    // INVARIANT: [The Quoted Price Must Be The Charged Price]
    // The cost comes from the shared `calculateInkRefillTotal`, which the ink
    // gauge ALSO renders. It used to be inlined here while the UI showed the
    // base curve only — so a rich player was quoted $25 and charged $100, and
    // the hint's "2% of your treasury on top" described a term the 4× cap
    // deletes outright. One function, one number, one place to be wrong.
    const cost = calculateInkRefillTotal(state.inkRefillCount, state.treasuryCash);

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

    // The desk tick is now a thin orchestrator: five PURE engines each own one
    // rule set, and this action only wires their results into a single `set`.
    // Every rule that used to be inline here now has a docstring and a name.
    //   tariffEngine   — Laffer curve + retaliatory heat
    //   inkFrenzyEngine— frenzy timer and the Cooling-Off Protocol
    //   passiveEngine  — cash, ink regen, integer Crony Favor
    //   phaseEngine    — the single phase ladder
    //   crisisEngine   — the Crisis Call lifecycle
    //   onboardingEngine— first-slam and tutorial termination

    const tariff = tickTariffRevenue(state.tariffRates, state.phase, deltaSeconds);

    const frenzy = tickInkFrenzy({
      isCapsFrenzy: state.isCapsFrenzy,
      capsFrenzySecondsRemaining: state.capsFrenzySecondsRemaining,
      frenzyCooldownSecondsRemaining: state.frenzyCooldownSecondsRemaining,
      tantrumMeter: state.tantrumMeter,
      deltaSeconds,
      cooldownByPhase: FRENZY_COOLDOWN_BY_PHASE,
      cooldownDecayPerSecond: FRENZY_COOLDOWN_TANTRUM_DECAY_PER_SECOND,
      phase: state.phase,
    });

    const passive = tickPassiveEconomy({
      phase: state.phase,
      passiveCashPerSecond: state.passiveCashPerSecond,
      tariffRevenuePerSecond: tariff.revenuePerSecond,
      hasAutopenArmy: state.activeUpgrades.includes('autopen_army'),
      inkLevel: state.inkLevel,
      maxInk: state.maxInk,
      inkRegenPerSecond: INK_REGEN_PER_SECOND,
      isCapsFrenzy: frenzy.isCapsFrenzy,
      cronyFavor: state.cronyFavor,
      cronyFavorRemainder: state.cronyFavorRemainder,
      cronyFavorPerSecond: CRONY_FAVOR_PASSIVE_PER_SECOND,
      deltaSeconds,
    });
    const nextCash = state.treasuryCash + passive.cashGain;

    // The Crisis Call advances every frame, but its state and actions live in
    // `crisisSlice`. See `crisisEngine` for the escalation and auto-suppression
    // rules. INVARIANT: an ignored crisis resolves as a suppression — no payout
    // and no heat, but the tantrum it would have fed is forfeited.
    const crisis = tickCrisis(
      state.activeCrisis,
      state.crisisCooldownSeconds,
      deltaSeconds,
      state.phase
    );
    const crisisOutcome = crisis.autoSuppressed
      ? 'SUPPRESSED // The crisis passed. The tantrum is gone.'
      : state.lastCrisisOutcome;

    // INVARIANT: [One Definition Of The Phase Ladder] — see `phaseEngine`.
    const nextPhase = nextPhaseFor(state.phase, nextCash);
    if (isPhasePromotion(state.phase, nextPhase)) sound.playChaChing();

    // INVARIANT: [Only A Real Slam Advances The Chain] — this is the PASSIVE
    // path, so it uses `resolvePassiveTutorialIndex`, which cannot advance the
    // chain. `resolveTutorialIndex` here consumed the first-slam token on the
    // first idle frame after page load and soft-locked the market terminal shut.
    const tutorialStepIndex = resolvePassiveTutorialIndex(nextPhase, state.tutorialStepIndex);

    set({
      treasuryCash: nextCash,
      lifetimeCashEarned: state.lifetimeCashEarned + passive.cashGain,
      phase: nextPhase,
      // INVARIANT: [Progression Must Be Earned, Not Idle] passive income must
      // never open the terminal. See `onboardingEngine`.
      hasMarketAccess: state.hasMarketAccess,
      tutorialStepIndex,
      inkLevel: passive.inkLevel,
      tariffRevenuePerSecond: passive.tariffRevenuePerSecond,
      slopSuspicion: Math.min(100, state.slopSuspicion + tariff.retaliatoryHeat),
      cronyFavor: clampCronyFavor(state.cronyFavor + passive.favorWholeUnits),
      cronyFavorRemainder: passive.favorRemainder,
      isCapsFrenzy: frenzy.isCapsFrenzy,
      capsFrenzySecondsRemaining: Math.max(0, frenzy.capsFrenzySecondsRemaining),
      frenzyCooldownSecondsRemaining: Math.max(0, frenzy.frenzyCooldownSecondsRemaining),
      tantrumMeter: Math.max(0, Math.min(100, frenzy.tantrumMeter)),
      activeCrisis: crisis.activeCrisis,
      crisisCooldownSeconds: Math.max(0, crisis.crisisCooldownSeconds),
      totalCrisesSuppressed: state.totalCrisesSuppressed + (crisis.autoSuppressed ? 1 : 0),
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
      // INVARIANT: [Only A Real Slam Advances The Chain] — PASSIVE path. Offline
      // earnings can cross the Phase 2 threshold while the tab is shut, so
      // onboarding must still TERMINATE here; it just may not ADVANCE.
      tutorialStepIndex: resolvePassiveTutorialIndex(state.phase, state.tutorialStepIndex),
    });
    return cashEarned;
  },

  // Crisis Call state and actions are declared in `CrisisSlice`. The desk keeps
  // the phase/tariff/ink/tantrum concerns; the phone keeps its own.
});
