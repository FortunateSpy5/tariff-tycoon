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

/** Left cockpit channel gating. */
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

/** Right deck gating. */
export function isRightTabUnlocked(tab: RightChannelTab, state: UnlockState): boolean {
  switch (tab) {
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
