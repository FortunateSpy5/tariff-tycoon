/**
 * Desk Slice: Manages manual clicker, ink stamina, tantrum meter, and CAPS LOCK frenzy.
 */

import type { StateCreator } from 'zustand';
import type { DeskState, GamePhase } from '../../types/desk';
import type { GameStore } from '../useGameStore';
import { calculateClickValue, calculateInkRefillCost } from '../../engine/math/formulas';
import { sound } from '../../audio/soundEngine';

export interface DeskSlice extends DeskState {
  treasuryCash: number;
  passiveCashPerSecond: number;
  lastTickTimestamp: number;

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

    // Cash calculation with real SIS Sovereign Immunity Slip count for bankruptcy floor
    const earnedCash = calculateClickValue(
      state.phase,
      state.phase === 1 ? 5.0 : 50.0,
      state.isCapsFrenzy ? 100 : state.inkLevel,
      state.isCapsFrenzy,
      state.sovereignImmunitySlips || 0
    );

    // Tantrum gain (+1.5% normal, +3.5% dry ink slingshot)
    const tantrumDelta = isDry ? 3.5 : 1.5;
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

    set({
      treasuryCash: state.treasuryCash + earnedCash,
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
    const passiveGain = state.passiveCashPerSecond * deltaSeconds;

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

    set({
      treasuryCash: state.treasuryCash + passiveGain,
      inkLevel: regeneratedInk,
      isCapsFrenzy: isFrenzy,
      capsFrenzySecondsRemaining: Math.max(0, frenzyRemaining),
      lastTickTimestamp: Date.now(),
    });
  },

  setGamePhase: (phase: GamePhase) => set({ phase }),
});
