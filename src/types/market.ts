/**
 * Market, Trading & BagHolder Pro Types
 * Manages parodied stock tickers, 1,000x leveraged options, and S.L.O.P. regulatory heat.
 */

export type StockSymbol =
  | 'FRUT'
  | 'GIGA'
  | 'DOOR'
  | 'MICR'
  | 'GUAC'
  | 'MSIL'
  | 'LMBR'
  | 'AVOC'
  | 'PAIN';

export type OptionType = 'PUT' | 'CALL';

export interface StockDefinition {
  symbol: StockSymbol;
  name: string;
  sector: string;
  description: string;
  basePrice: number;
  currentPrice: number;
  priceHistory: number[];
  volatilityMultiplier: number;
}

export interface ActiveOptionTrade {
  id: string;
  symbol: StockSymbol;
  type: OptionType;
  entryPrice: number;
  targetPrice: number;
  strikePrice: number;
  leverage: number; // e.g. 10x to 1000x
  contractsCount: number;
  collateralLocked: number;
  openedAtTimestamp: number;
  expiresAtTimestamp: number;
  isSettled: boolean;
  profitOrLoss: number;
  /** CALL opened during the post-YAP window; refunded if the player misses the clarification */
  isWalkBackCombo?: boolean;
}

export interface MarketState {
  stocks: Record<StockSymbol, StockDefinition>;
  activeTrades: ActiveOptionTrade[];
  hasSettledYapTrade: boolean;
  slopSuspicion: number; // 0 to 100%. At 100%, triggers Emergency Special Counsel Raid
  vexVolatility: number; // Baseline market volatility index ($VEX)
  cronyFavor: number; // Currency used to bribe S.L.O.P. auditors
  isWalkBackWindowActive: boolean; // 8-second Straddle Squeeze window
  walkBackSecondsRemaining: number;
  lastWalkBackNotice: string | undefined;
  lastTargetStockSymbol: StockSymbol | undefined; // Targeted stock for the walk-back squeeze
  yapTargetMode: 'selected' | 'shotgun'; // Toggle: targeted insider short vs unhinged shotgun
  selectedStock: StockSymbol; // Currently selected stock on BagHolder Pro
  lastYapTimestamp: number; // For YAP cooldown enforcement
  yapCooldownSeconds: number; // Cooldown duration (default 10s)
  lastRaidMessage?: string; // Feedback from Special Counsel raid/asset seizure
  lastRaidTimestamp: number;
}
