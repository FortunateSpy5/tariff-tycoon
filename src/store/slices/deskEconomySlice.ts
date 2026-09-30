/**
 * Desk Economy Slice: the three SPEND actions on the blotter.
 *
 * WHY THIS IS A SEPARATE SLICE
 * `buyUpgrade`, `refillInk` and `ventTantrum` are the desk's *outgoing* verbs:
 * each one takes treasury cash or a meter away from the player. `deskSlice` kept
 * the incoming verb (the slam) and the per-frame tick, and grew past the 400-line
 * hard ceiling in AGENTS.md when the clicker's payout resolution moved into the
 * engine. The split is by direction of cash flow, which is the same reason
 * `deskPropsSlice` was carved out: these are not the clicker, and nobody
 * balances them together.
 *
 * INVARIANT: [One Affordability Test]
 * Every gate here calls `canAfford` from `perkEngine` rather than comparing
 * `treasuryCash` to a price inline. `canAfford` is the only predicate that knows
 * about the QE As A Service negative buffer, and it is also what the buttons
 * that render these prices drew their face from — so the quoted price, the
 * charged price and the button's colour are one expression.
 */

import type { StateCreator } from 'zustand';
import type { DeskEconomySliceContract } from '../../types/store';
import type { GameStore } from '../useGameStore';
import { calculateInkRefillTotal } from '../../engine/math/formulas';
import { INITIAL_CRONY_UPGRADES } from '../../constants/unlocks';
import { canBuyUpgrades } from '../../engine/systems/unlockEngine';
import { canAfford } from '../../engine/systems/perkEngine';
import {
  TANTRUM_VENT_CONSUME_RATIO,
  TANTRUM_VENT_MIN_TANTRUM,
  TANTRUM_VENT_VEX_RELIEF,
  VEX_BASELINE,
} from '../../constants/balance';
import { sound } from '../../audio/soundEngine';

export interface DeskEconomySlice extends DeskEconomySliceContract {}

export const createDeskEconomySlice: StateCreator<GameStore, [], [], DeskEconomySlice> = (
  set,
  get
) => ({
  buyUpgrade: (upgradeId: string) => {
    const state = get();
    if (!canBuyUpgrades(state)) return false;
    if (state.activeUpgrades.includes(upgradeId)) return false;

    const def = INITIAL_CRONY_UPGRADES.find((u) => u.id === upgradeId);
    if (!def || !canAfford(state.treasuryCash, def.cost, state.unlockedPerks)) return false;

    sound.playChaChing();
    set({
      treasuryCash: state.treasuryCash - def.cost,
      activeUpgrades: [...state.activeUpgrades, upgradeId],
      // INVARIANT: [The First Purchase Is Also A Key] — see `unlockEngine`.
      hasTariffAccess: true,
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

    if (!canAfford(state.treasuryCash, cost, state.unlockedPerks)) {
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
});
