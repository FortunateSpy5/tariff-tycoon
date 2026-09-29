/**
 * Unlock Engine — PURE gating for the three cockpit channels and the tech tree.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio.
 *
 * The channel tabs and the upgrade shop all share one question — "has this
 * player unlocked YET?" — and each was answering it with its own inline
 * condition. When a new content tier is added, that meant editing four
 * unrelated conditions and hoping they stayed consistent. They now all ask this
 * module, so a new unlock is one entry in one table.
 *
 * THE UNLOCK CASCADE (each tier opens the next):
 *   first slam          -> Stocks (the market terminal)
 *   first YAP           -> Radar (S.L.O.P. surveillance)
 *   settle a YAP put    -> PolyGrift (prediction markets)
 *   liquidate an agency -> Unlocks (the crony lobby)
 *   buy a crony upgrade -> Tariffs (bilateral dials)
 *   move a tariff dial  -> Caymans (prestige)
 *
 * INVARIANT: [Progression Must Be Earned, Not Idle]
 * Passive income may never open a channel. Every gate below is an EVENT the
 * player performed, so idling to a cash threshold can never hand the player a
 * screen they were never taught to use.
 *
 * INVARIANT: [The Seal Is a Promise, Not a Wall]
 * These functions decide what a channel's BODY may render — they do NOT decide
 * whether the channel may be selected. Selection is always permitted; a sealed
 * channel renders a `SealedDossier` naming the event that opens it, and never
 * mounts the real body. Every purchase, liquidation, tariff move, and prestige
 * reset is therefore still unreachable while sealed. The previous design also
 * gated selection, which made the locked systems invisible AND unnameable —
 * the Career Objectives were the only mention of the systems the game is
 * named for. See `constants/tabDemands` and `ui/SealedDossier`.
 */

import type { LeftChannelTab, RightChannelTab } from '../../types/unlocks';

export interface UnlockState {
  phase: number;
  hasMarketAccess: boolean;
  hasRadarAccess: boolean;
  hasPolyGriftAccess: boolean;
  hasCronyUnlocksAccess: boolean;
  hasTariffAccess: boolean;
  hasPrestigeAccess: boolean;
}

/**
 * Left cockpit channel gating — i.e. may this channel's BODY render?
 *
 * Selection is not gated. See [The Seal Is a Promise, Not a Wall] above.
 */
export function isLeftTabUnlocked(tab: LeftChannelTab, state: UnlockState): boolean {
  switch (tab) {
    case 'stocks':
      return state.hasMarketAccess;
    case 'radar':
      return state.hasRadarAccess;
    case 'polygrift':
      return state.hasPolyGriftAccess;
    default:
      return false;
  }
}

/**
 * Right deck gating — i.e. may this channel's BODY render?
 *
 * Selection is not gated. See [The Seal Is a Promise, Not a Wall] above.
 */
export function isRightTabUnlocked(tab: RightChannelTab, state: UnlockState): boolean {
  switch (tab) {
    case 'brief':
      // The Situation Room is never sealed. It carries the tutorial directive
      // and the Career Objectives, and sealing the room that explains the locks
      // would be self-defeating.
      return true;
    case 'dump':
      return state.phase >= 2;
    case 'unlocks':
      return state.hasCronyUnlocksAccess;
    case 'tariffs':
      return state.hasTariffAccess;
    case 'caymans':
      return state.hasPrestigeAccess;
    default:
      return false;
  }
}

/** The crony upgrade shop requires the Oval Office AND lobby access. */
export function canBuyUpgrades(state: UnlockState): boolean {
  return state.phase >= 2 && state.hasCronyUnlocksAccess;
}

/** Moving a tariff dial requires the Oval Office AND tariff authority. */
export function canSetTariff(state: UnlockState): boolean {
  return state.phase >= 2 && state.hasTariffAccess;
}

/** The Subpoena Shredder is an Oval Office instrument. */
export function canShredSubpoenas(state: UnlockState): boolean {
  return state.phase >= 2;
}
