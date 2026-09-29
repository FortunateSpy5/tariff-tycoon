/**
 * Store Slice Contracts
 *
 * WHY THIS FILE EXISTS:
 * Each domain slice declares its state + actions. Those declarations used to
 * live inline in the slice implementations, which meant every slice file opened
 * with 40-70 lines of interface before a single line of behaviour — and pushed
 * `deskSlice.ts` and `tradingSlice.ts` past the 400-line hard ceiling in
 * AGENTS.md.
 *
 * Separating the CONTRACT from the IMPLEMENTATION is the right split regardless
 * of line count: the contract says what the domain exposes, the slice says how
 * it behaves, and a reader looking for "what can I do to the desk" no longer has
 * to scroll past the clicker's implementation to find out.
 *
 * INVARIANT: [Slices Compose, They Do Not Own]
 * Every slice is a `StateCreator<GameStore>` spread into one store. A slice may
 * read and write any field on the store via `get()`/`set()`, but it must never
 * assume another slice's internals. If two domains need to collaborate, put the
 * shared rule in `src/engine/` so there is one implementation of it.
 */

import type { LeftChannelTab, RightChannelTab } from './unlocks';
import type { YapPost } from './yap';
import type { MarketState, OptionType, StockSymbol } from './market';
import type { DeskState } from './desk';

/** The 3:00 AM Crisis Call on the Red Rotary Phone. */
export interface CrisisSliceContract {
  activeCrisis: { id: string; elapsedSeconds: number } | null;
  crisisCooldownSeconds: number;
  totalCrisesAnswered: number;
  totalCrisesSuppressed: number;
  lastCrisisOutcome: string | undefined;
  swearInCrisis: () => boolean;
  suppressCrisis: () => boolean;
  dismissCrisisOutcome: () => void;
}

/** The four physical objects on the blotter. */
export interface DeskPropsSliceContract {
  lastSecretSaleTimestamp: number;
  lastShredTimestamp: number;
  lastPrinterTimestamp: number;
  triggerRedPhoneBailout: () => boolean;
  sellClassifiedSecrets: () => boolean;
  shredSubpoenas: () => boolean;
  printEmergencyCash: () => boolean;
}

/**
 * Cockpit channel selection — which tab each wing is showing, and the
 * [The Seal Is a Promise, Not a Wall] invariant that governs it.
 * Implemented in `slices/channelSlice`.
 */
export interface ChannelSliceContract {
  activeLeftTab: LeftChannelTab;
  activeRightTab: RightChannelTab;
  /** Selects a channel. Permitted even when sealed — see the invariant. */
  setActiveLeftTab: (tab: LeftChannelTab) => void;
  /** Selects a channel. Permitted even when sealed — see the invariant. */
  setActiveRightTab: (tab: RightChannelTab) => void;
}

/** The clicker economy, ink stamina and tantrum. */
export interface DeskSliceContract extends DeskState {
  treasuryCash: number;
  passiveCashPerSecond: number;
  lastTickTimestamp: number;
  /** Lifetime treasury cash this run. Drives the Tier 1 prestige SIS formula. */
  lifetimeCashEarned: number;

  activeUpgrades: string[];
  buyUpgrade: (upgradeId: string) => boolean;

  /** Advance the onboarding chain. Clamped at the end; never wraps. */
  advanceTutorial: () => void;
  /** Skip onboarding permanently (players who already know the loop). */
  skipTutorial: () => void;

  tariffRates: Record<string, number>;
  setTariffRate: (nationId: string, rate: number) => void;

  clickDesk: () => boolean;
  refillInk: () => boolean;
  /**
   * VENT THE TANTRUM: burn all accumulated tantrum for a burst of VEX relief.
   * Never optimal (see TANTRUM_VENT_CONSUME_RATIO) — it is a panic button for
   * calm options pricing, and the Tantrum meter's counterpart to Ink's refill.
   */
  ventTantrum: () => boolean;
  tickDesk: (deltaSeconds: number) => void;
  creditOfflineEarnings: (elapsedSeconds: number) => number;
}

/** Side bets and political payments. */
export interface PredictionSliceContract {
  bribeSlopAuditors: (bribeAmount: number) => boolean;
  wagerPolyGrift: (
    betId: string,
    choice: 'YES' | 'NO',
    amount: number
  ) => { success: boolean; won?: boolean; payout?: number };
}

/** Manual early close of a 0DTE position. Must agree with the auto-settle. */
export interface SettlementSliceContract {
  /** @returns The payout credited, or 0 if the trade was not found or is closed. */
  settleOptionTrade: (tradeId: string) => number;
}

/** 0DTE options, the YAP crash, the walk-back squeeze and the market tick. */
export interface TradingSliceContract extends MarketState {
  lastYapPost: YapPost | undefined;
  /** Cumulative realized profit from settled trades (drives prestige SIS). */
  lifetimeOptionsProfit: number;
  /**
   * Risk-free contracts remaining in the onboarding allowance. Paper trades
   * lock collateral and pay real winnings, but losses refund in full.
   */
  paperTradesRemaining: number;
  /** Total profitable paper trades, surfaced on the run-summary card. */
  paperTradesWon: number;

  openOptionTrade: (
    symbol: StockSymbol,
    type: OptionType,
    leverage: number,
    collateral: number
  ) => boolean;
  triggerYapMarketShock: (yap: YapPost) => {
    success: boolean;
    reason?: string;
    targetSymbol?: StockSymbol;
    combo?: boolean;
  };
  executeWalkBack: () => boolean;
  tickMarket: (deltaSeconds: number) => void;
  extendActiveTradesForOffline: (elapsedSeconds: number) => void;
  setYapTargetMode: (mode: 'selected' | 'shotgun') => void;
  setSelectedStock: (symbol: StockSymbol) => void;
  dismissRaidAlert: () => void;
}
