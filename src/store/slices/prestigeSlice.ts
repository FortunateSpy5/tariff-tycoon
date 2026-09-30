/**
 * Prestige Slice: Manages Sovereign Immunity Slips (SIS), the perk constellation,
 * America LLC, and Ontological Tariffs.
 */

import type { StateCreator } from 'zustand';
import type { PrestigeState } from '../../types/prestige';
import type { GameStore } from '../useGameStore';
import { calculatePrestigeSIS } from '../../engine/math/formulas';
import { INITIAL_AGENCIES } from '../../constants/agencies';
import { INITIAL_STOCKS } from '../../constants/stocks';
import { TUTORIAL_CHAIN } from '../../constants/onboarding';
import { PERK_BY_ID, type PerkId } from '../../constants/perks';
import { retainedPassiveRate } from '../../engine/systems/perkEngine';
import { sound } from '../../audio/soundEngine';

export interface PrestigeSlice extends PrestigeState {
  executeFlightToCaymans: () => number;
  /**
   * Buy one perk with Sovereign Immunity Slips.
   *
   * INVARIANT: [The Price Comes From The Catalogue, Not The Caller]
   * This used to take `(perkId, cost)`, so the price was whatever the button
   * chose to pass. That is the `calculateInkRefillTotal` bug in its purest
   * form: a card that quoted 1 and a handler that charged 0 would be a bug with
   * no type error and no test failure. The id is all a caller may supply.
   */
  unlockPerk: (perkId: PerkId) => boolean;
  incorporateAmericaLLC: () => void;
}

export const createPrestigeSlice: StateCreator<GameStore, [], [], PrestigeSlice> = (set, get) => ({
  sovereignImmunitySlips: 0,
  totalSISLifetime: 0,
  flightToCaymansCount: 0,
  unlockedPerks: {},
  executiveDecrees: 0,
  totalDecreesLifetime: 0,
  americaLLCIncorporated: false,
  ontologicalTariffs: [],
  entropyDeficit: 0,
  flashDipSecondsRemaining: 0,
  totalFlashDipsTriggered: 0,
  peakBookValue: 0,
  lastAutoMatchTimestamp: 0,
  totalAutoMatchPaid: 0,
  lastAutoMatchNotice: undefined,

  executeFlightToCaymans: () => {
    const state = get();
    if (state.phase < 2 || !state.hasPrestigeAccess) return 0;
    // Credit locked trade collateral into effective lifetime cash so players are never penalized for open positions
    const tradeCollateral = (state.activeTrades || []).reduce((sum, t) => sum + (t.collateralLocked || 0), 0);
    const lifetimeCash = (state.lifetimeCashEarned || 0) + tradeCollateral;
    const earnedSIS = calculatePrestigeSIS(lifetimeCash, state.lifetimeOptionsProfit || 0);
    if (earnedSIS <= 0) return 0;

    sound.playChaChing();

    // Shell Company Inception seed cash: $1M x SIS^1.2.
    //
    // INVARIANT: [The Seed Cash Is Baseline, Not A Perk]
    // GDD §5 files this under perk 1, but `executeFlightToCaymans` has always
    // granted it to every flight and the Caymans hover copy promises it. It is
    // the floor that stops a returning player beginning a run soft-locked, so
    // making it purchasable would be a nerf wearing a feature's clothes. The
    // perk's own contribution is the +100% base tap, resolved in `clickPayout`.
    const totalSIS = state.sovereignImmunitySlips + earnedSIS;
    const seedCash = Math.max(100, 1_000_000 * Math.pow(totalSIS, 1.2));

    // Golden Parachute Super-PAC: 15% of the liquidation-built passive rate
    // survives the reset. `retainedPassiveRate` returns 0 without the perk, so
    // the default reset behaviour is byte-for-byte unchanged.
    const retainedPassive = retainedPassiveRate(state.passiveCashPerSecond, state.unlockedPerks);

    // Full run soft-reset (retaining lifetime SIS and permanent perks)
    set({
      treasuryCash: seedCash,
      lifetimeCashEarned: seedCash,
      lifetimeOptionsProfit: 0,
      passiveCashPerSecond: retainedPassive,
      tariffRevenuePerSecond: 0,
      phase: 1,
      hasMarketAccess: false,
      // A player who has prestiged has demonstrably learned the loop. Resetting
      // them to the onboarding chain would be a downgrade in respect for their
      // time, so the tutorial is marked complete instead of replayed.
      tutorialStepIndex: TUTORIAL_CHAIN.length,
      paperTradesRemaining: 0,
      paperTradesWon: 0,
      hasRadarAccess: false,
      hasPolyGriftAccess: false,
      hasCronyUnlocksAccess: false,
      hasTariffAccess: false,
      hasPrestigeAccess: false,
      activeLeftTab: 'stocks',
      // Every channel is reset to sealed, so return to the one channel that is
      // never sealed — the Situation Room. Landing on D.U.M.P. here would show
      // a demand card for a run the player has not started yet.
      activeRightTab: 'brief',
      inkLevel: 100,
      inkRefillCount: 0,
      tantrumMeter: 0,
      isCapsFrenzy: false,
      capsFrenzySecondsRemaining: 0,
      dryClicksCount: 0,
      activeUpgrades: [],
      slopSuspicion: 0,
      cronyFavor: 30,
      cronyFavorRemainder: 0,
      vexVolatility: 15.0,
      // INVARIANT: [No Free Lunch At Customs] — dials reset to zero, not to the
      // nations' default rates. See `deskSlice` for why. Prestige resets every
      // other faucet to zero too; this one used to smuggle ~$40/s straight back
      // in on the frame the player returned to a run.
      tariffRates: {
        north_annex: 0,
        nearshore_fed: 0,
        strike_republic: 0,
        overthinker_union: 0,
        red_factory: 0,
        silicon_archipelago: 0,
      },
      stocks: { ...INITIAL_STOCKS },
      activeTrades: [],
      hasSettledYapTrade: false,
      isWalkBackWindowActive: false,
      walkBackSecondsRemaining: 0,
      lastWalkBackNotice: undefined,
      lastTargetStockSymbol: undefined,
      lastYapPost: undefined,
      lastYapTimestamp: 0,
      lastRaidMessage: undefined,
      // The 280-Character Flash Dip and the 401(k) match are RUN state, not
      // lifetime state: both are timers or accumulators that would otherwise
      // survive a filing and pay out against positions from a run that no longer
      // exists. Total lifetime counts are kept — they are the perk's readout.
      flashDipSecondsRemaining: 0,
      peakBookValue: 0,
      lastAutoMatchTimestamp: 0,
      lastAutoMatchNotice: undefined,
      agencies: INITIAL_AGENCIES.map((a) => ({ ...a, isLiquidated: false })),
      sovereignImmunitySlips: state.sovereignImmunitySlips + earnedSIS,
      totalSISLifetime: state.totalSISLifetime + earnedSIS,
      flightToCaymansCount: state.flightToCaymansCount + 1,
    });

    return earnedSIS;
  },

  unlockPerk: (perkId) => {
    const state = get();
    // INVARIANT: [The Price Comes From The Catalogue, Not The Caller]
    // This used to accept `(perkId, cost)`, so a card could quote 1 while the
    // handler charged 0 — a lie with no type error and no test to catch it.
    const perk = PERK_BY_ID[perkId];
    if (!perk) return false;
    if (!state.hasPrestigeAccess) return false;
    if (state.unlockedPerks[perkId]) return false;
    if (state.sovereignImmunitySlips < perk.cost) return false;

    set({
      sovereignImmunitySlips: state.sovereignImmunitySlips - perk.cost,
      unlockedPerks: { ...state.unlockedPerks, [perkId]: true },
    });
    sound.playChaChing();
    return true;
  },

  incorporateAmericaLLC: () => {
    const state = get();
    if (!state.hasPrestigeAccess) return;
    if (state.treasuryCash < 1e24) return; // $10^24 required for Delaware C-Corp

    sound.playDeskThud();
    set({
      americaLLCIncorporated: true,
      executiveDecrees: state.executiveDecrees + 10,
      totalDecreesLifetime: state.totalDecreesLifetime + 10,
    });
  },
});
