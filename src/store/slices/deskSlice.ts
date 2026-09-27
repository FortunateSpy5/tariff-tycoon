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
import {
  INK_PER_CLICK,
  INK_REGEN_PER_SECOND,
  INKED_TANTRUM_PER_CLICK,
  DIET_SODA_TANTRUM_PER_CLICK,
  DRY_TANTRUM_PER_CLICK,
  FRENZY_DURATION_SECONDS,
  DRY_CLICK_JAM_THRESHOLD,
  CRONY_FAVOR_PASSIVE_PER_SECOND,
  CRONY_FAVOR_MAX,
} from '../../constants/balance';
import { sound } from '../../audio/soundEngine';

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

  // Interactive Desk Props
  triggerRedPhoneBailout: () => boolean;
  sellClassifiedSecrets: () => boolean;
  shredSubpoenas: () => boolean;
  printEmergencyCash: () => boolean;

  // Bilateral Tariffs state
  tariffRates: Record<string, number>;
  setTariffRate: (nationId: string, rate: number) => void;

  clickDesk: () => boolean;
  refillInk: () => boolean;
  tickDesk: (deltaSeconds: number) => void;
  creditOfflineEarnings: (elapsedSeconds: number) => number;
  setGamePhase: (phase: GamePhase) => void;
}

export const createDeskSlice: StateCreator<GameStore, [], [], DeskSlice> = (set, get) => ({
  phase: 1,
  hasMarketAccess: false,
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
    // INVARIANT: Dry scratches enrage the Dealmaker (+3.5% per click) and CAN fill the meter to 100%.
    let tantrumDelta = 0;
    if (isDry) {
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
    // Ink consumption: normal clicks consume INK_PER_CLICK; during frenzy ink is infinite
    let nextInkLevel = state.isCapsFrenzy ? state.inkLevel : Math.max(0, state.inkLevel - INK_PER_CLICK);
    let nextRefillCount = state.inkRefillCount;

    // Trigger CAPS LOCK FRENZY only when legitimate ink was used
    if (nextTantrum >= 100 && !state.isCapsFrenzy && !isDry) {
      shouldTriggerFrenzy = true;
      nextTantrum = 0;
      frenzyRemaining = FRENZY_DURATION_SECONDS;
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

    set({
      treasuryCash: nextCash,
      lifetimeCashEarned: state.lifetimeCashEarned + earnedCash,
      phase: nextPhase,
      hasMarketAccess: state.hasMarketAccess || nextCash >= 10000,
      totalClicks: state.totalClicks + 1,
      inkLevel: nextInkLevel,
      dryClicksCount: currentDryClicks,
      inkRefillCount: nextRefillCount,
      tantrumMeter: Math.min(100, nextTantrum),
      isCapsFrenzy: shouldTriggerFrenzy,
      capsFrenzySecondsRemaining: frenzyRemaining,
      totalFrenziesTriggered: frenziesCount,
      lastClickTimestamp: now,
    });
    return true;
  },

  refillInk: () => {
    const state = get();
    const cost = calculateInkRefillCost(state.inkRefillCount);

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

    if (isFrenzy) {
      frenzyRemaining -= deltaSeconds;
      if (frenzyRemaining <= 0) {
        isFrenzy = false;
        frenzyRemaining = 0;
      }
    }

    // Natural ink passive regeneration (0.5 units / sec)
    const regeneratedInk = isFrenzy
      ? state.inkLevel
      : Math.min(state.maxInk, state.inkLevel + INK_REGEN_PER_SECOND * deltaSeconds);

    // Crony Favor passive drip: holding power accrues political capital over time.
    const favorGain = CRONY_FAVOR_PASSIVE_PER_SECOND * deltaSeconds;

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
      hasMarketAccess: state.hasMarketAccess || nextCash >= 10000,
      inkLevel: regeneratedInk,
      tariffRevenuePerSecond: calculatedTariffRev,
      slopSuspicion: Math.min(100, state.slopSuspicion + retaliatoryHeat),
      cronyFavor: Math.min(CRONY_FAVOR_MAX, state.cronyFavor + favorGain),
      isCapsFrenzy: isFrenzy,
      capsFrenzySecondsRemaining: Math.max(0, frenzyRemaining),
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
      hasMarketAccess: state.hasMarketAccess || state.treasuryCash + cashEarned >= 10000,
    });
    return cashEarned;
  },

  setGamePhase: (phase: GamePhase) => set({ phase }),
});
