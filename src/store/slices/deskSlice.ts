/**
 * Desk Slice: Manages manual clicker, ink stamina, tantrum meter, CAPS LOCK frenzy,
 * interactive desk props (Red Phone, Gold Box, Shredder), and Crony Tech Tree upgrades.
 */

import type { StateCreator } from 'zustand';
import type { DeskSliceContract } from '../../types/store';
import type { GameStore } from '../useGameStore';
import { calculateOfflineEarnings } from '../../engine/math/formulas';
import { tickCrisis } from '../../engine/systems/crisisEngine';
import { clickInkFrenzy, tickInkFrenzy } from '../../engine/systems/inkFrenzyEngine';
import { tickTariffRevenue } from '../../engine/systems/tariffEngine';
import { isPhasePromotion, nextPhaseFor } from '../../engine/systems/phaseEngine';
import { tickPassiveEconomy } from '../../engine/systems/passiveEngine';
import { clampCronyFavor } from '../../engine/systems/slopEngine';
import { resolveClickPayout } from '../../engine/systems/clickPayout';
import { clickFlashDip, hasPerk, tickFlashDip } from '../../engine/systems/perkEngine';
import {
  advanceTutorialIndex,
  completedTutorialIndex,
  resolveMarketAccess,
  resolveTutorialIndex,
  resolvePassiveTutorialIndex,
} from '../../engine/systems/onboardingEngine';
import { canSetTariff } from '../../engine/systems/unlockEngine';
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

  // ===================================================================
  // THE SPEND VERBS — `buyUpgrade`, `refillInk`, `ventTantrum` — live in
  // `deskEconomySlice`. The desk keeps the slam and the tick.
  // ===================================================================

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

    // Sound feedback
    if (state.phase === 1) {
      sound.playDeskThud();
    } else if (isDry) {
      sound.playDryScratch();
    } else {
      sound.playSherpieSqueak();
    }

    // INVARIANT: [The Quoted Yield Is The Charged Yield]
    // The stamp face prints `+X / tap` from the SAME function. This used to be
    // `calculateClickValue` plus a separate `*= 2` for the Tungsten Nib, while
    // the face skipped the doubling entirely — so the hero number in the game
    // was wrong by 100% for anyone who bought the cheapest upgrade in the shop.
    // See `engine/systems/clickPayout.ts`.
    const payout = resolveClickPayout({
      phase: state.phase,
      baseValue: 5.0,
      inkLevel: state.inkLevel,
      isCapsFrenzy: state.isCapsFrenzy,
      sisCount: state.sovereignImmunitySlips || 0,
      dryClicksCount: state.dryClicksCount || 0,
      hasTungstenNib: state.activeUpgrades.includes('heavy_tungsten_nib'),
      perks: state.unlockedPerks,
      treasuryCash: state.treasuryCash,
    });
    const earnedCash = payout.earnedCash;

    // 280-Character Macro Wreck: a 4% roll on every slam, fired here rather
    // than anywhere that could fire it without a slam.
    const flashDip = clickFlashDip(
      {
        enabled: hasPerk(state.unlockedPerks, 'macro_wreck_280'),
        isActive: state.flashDipSecondsRemaining > 0,
        secondsRemaining: state.flashDipSecondsRemaining,
        totalTriggered: state.totalFlashDipsTriggered,
      },
      Math.random
    );

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
      flashDipSecondsRemaining: flashDip.secondsRemaining,
      totalFlashDipsTriggered: flashDip.totalTriggered,
      lastClickTimestamp: now,
      // ISSUE-004 [Stale Banners Must Not Hold The Desk]. The crisis outcome
      // notice is the LOWEST-priority message in `feedbackPriority` and is purely
      // informational, but it had no expiry of its own — it sat above the
      // directive sheet and under the stamp until the player found its dismiss
      // button. A slam is the player saying "I have read it and I am working", so
      // it retires the notice. `FeedbackLayer` additionally expires it on a
      // timer, for the player who never slams again.
      lastCrisisOutcome: undefined,
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
      // The Flash Dip is a clock like the frenzy, so it ticks here rather than
      // inside the market slice that prices with it.
      flashDipSecondsRemaining: tickFlashDip(state.flashDipSecondsRemaining, deltaSeconds),
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
