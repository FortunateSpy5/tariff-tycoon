/**
 * Desk Slice: Manages manual clicker, ink stamina, tantrum meter, CAPS LOCK frenzy,
 * interactive desk props (Red Phone, Gold Box, Shredder), and Crony Tech Tree upgrades.
 */

import type { StateCreator } from 'zustand';
import type { DeskState, GamePhase } from '../../types/desk';
import type { LeftChannelTab, RightChannelTab } from '../../types/unlocks';
import type { GameStore } from '../useGameStore';
import { calculateClickValue, calculateInkRefillCost } from '../../engine/math/formulas';
import { INITIAL_CRONY_UPGRADES } from '../../constants/unlocks';
import { sound } from '../../audio/soundEngine';

export interface DeskSlice extends DeskState {
  treasuryCash: number;
  passiveCashPerSecond: number;
  lastTickTimestamp: number;

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
  sellClassifiedSecrets: () => void;
  shredSubpoenas: () => void;
  printEmergencyCash: () => boolean;

  // Bilateral Tariffs state
  tariffRates: Record<string, number>;
  setTariffRate: (nationId: string, rate: number) => void;

  clickDesk: () => void;
  refillInk: () => boolean;
  tickDesk: (deltaSeconds: number) => void;
  setGamePhase: (phase: GamePhase) => void;
}

export const createDeskSlice: StateCreator<GameStore, [], [], DeskSlice> = (set, get) => ({
  phase: 1,
  totalClicks: 0,
  inkLevel: 100,
  maxInk: 100,
  inkRefillCount: 0,
  tantrumMeter: 0,
  isCapsFrenzy: false,
  capsFrenzySecondsRemaining: 0,
  totalFrenziesTriggered: 0,
  treasuryCash: 100.0, // Starting seed cash
  passiveCashPerSecond: 0,
  lastTickTimestamp: Date.now(),

  activeLeftTab: 'stocks',
  activeRightTab: 'dump',
  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),

  activeUpgrades: [],
  tariffRates: {
    can: 125,
    fra: 200,
    che: 100,
    mex: 150,
  },
  setTariffRate: (nationId, rate) =>
    set((state) => ({
      tariffRates: { ...state.tariffRates, [nationId]: rate },
    })),

  buyUpgrade: (upgradeId: string) => {
    const state = get();
    if (state.activeUpgrades.includes(upgradeId)) return false;

    const def = INITIAL_CRONY_UPGRADES.find((u) => u.id === upgradeId);
    if (!def || state.treasuryCash < def.cost) return false;

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash - def.cost,
      activeUpgrades: [...state.activeUpgrades, upgradeId],
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
    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + 500,
      slopSuspicion: Math.min(100, state.slopSuspicion + 8),
    });
  },

  shredSubpoenas: () => {
    const state = get();
    sound.playDeskThud();
    set({
      slopSuspicion: Math.max(0, state.slopSuspicion - 25),
    });
  },

  printEmergencyCash: () => {
    const state = get();
    if (!state.activeUpgrades.includes('broad_daylight_printer')) return false;

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash + 100000,
      slopSuspicion: Math.min(100, state.slopSuspicion + 10),
    });
    return true;
  },

  clickDesk: () => {
    const state = get();
    const isDry = state.inkLevel <= 0 && !state.isCapsFrenzy;

    // Sound feedback
    if (state.phase === 1) {
      sound.playDeskThud();
    } else if (isDry) {
      sound.playDryScratch();
    } else {
      sound.playSharpieSqueak();
    }

    // Cash calculation: base $5.00 * phaseMultiplier (1x at P1 = $5, 10x at P2 = $50)
    let earnedCash = calculateClickValue(
      state.phase,
      5.0,
      state.isCapsFrenzy ? 100 : state.inkLevel,
      state.isCapsFrenzy,
      state.sovereignImmunitySlips || 0
    );

    // Apply Heavy Tungsten Nib multiplier (+100%)
    if (state.activeUpgrades.includes('heavy_tungsten_nib')) {
      earnedCash *= 2;
    }

    // Tantrum gain (+1.5% normal, +3.5% dry ink slingshot)
    let tantrumDelta = isDry ? 3.5 : 1.5;
    if (state.activeUpgrades.includes('diet_soda_drip')) {
      tantrumDelta *= 1.5;
    }

    let nextTantrum = state.tantrumMeter + tantrumDelta;
    let shouldTriggerFrenzy = state.isCapsFrenzy;
    let frenzyRemaining = state.capsFrenzySecondsRemaining;
    let frenziesCount = state.totalFrenziesTriggered;
    let nextInkLevel = state.isCapsFrenzy ? state.inkLevel : Math.max(0, state.inkLevel - 2);
    let nextRefillCount = state.inkRefillCount;

    if (nextTantrum >= 100 && !state.isCapsFrenzy) {
      shouldTriggerFrenzy = true;
      nextTantrum = 0;
      frenzyRemaining = 15; // 15 seconds of pure chaos
      frenziesCount += 1;
      nextInkLevel = state.maxInk; // Frenzy automatically refills ink to 100%!
      nextRefillCount = Math.max(0, nextRefillCount - 2); // Resets escalation penalty
    }

    const nextCash = state.treasuryCash + earnedCash;
    let nextPhase = state.phase;
    if (state.phase === 1 && nextCash >= 10000) {
      nextPhase = 2;
      sound.playChaChing();
    } else if (state.phase === 2 && nextCash >= 1000000) {
      nextPhase = 3;
      sound.playChaChing();
    }

    set({
      treasuryCash: nextCash,
      phase: nextPhase,
      totalClicks: state.totalClicks + 1,
      inkLevel: nextInkLevel,
      inkRefillCount: nextRefillCount,
      tantrumMeter: Math.min(100, nextTantrum),
      isCapsFrenzy: shouldTriggerFrenzy,
      capsFrenzySecondsRemaining: frenzyRemaining,
      totalFrenziesTriggered: frenziesCount,
    });
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
      inkRefillCount: state.inkRefillCount + 1,
    });
    return true;
  },

  tickDesk: (deltaSeconds: number) => {
    const state = get();

    // Passive cash accrual
    let passiveGain = state.passiveCashPerSecond * deltaSeconds;

    // AI Autopen Interns passive clicks (5 taps/sec)
    if (state.activeUpgrades.includes('autopen_army')) {
      const autopenBase = state.phase === 1 ? 5.0 : 50.0;
      const autopenPerSec = autopenBase * 5;
      passiveGain += autopenPerSec * deltaSeconds;
    }

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

    // Natural ink passive regeneration (0.5% / sec)
    const regeneratedInk = isFrenzy
      ? state.inkLevel
      : Math.min(state.maxInk, state.inkLevel + 0.5 * deltaSeconds);

    const nextCash = state.treasuryCash + passiveGain;
    let nextPhase = state.phase;
    if (state.phase === 1 && nextCash >= 10000) {
      nextPhase = 2;
      sound.playChaChing();
    } else if (state.phase === 2 && nextCash >= 1000000) {
      nextPhase = 3;
      sound.playChaChing();
    }

    set({
      treasuryCash: nextCash,
      phase: nextPhase,
      inkLevel: regeneratedInk,
      isCapsFrenzy: isFrenzy,
      capsFrenzySecondsRemaining: Math.max(0, frenzyRemaining),
      lastTickTimestamp: Date.now(),
    });
  },

  setGamePhase: (phase: GamePhase) => set({ phase }),
});
