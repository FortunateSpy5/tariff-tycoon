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
}

export interface MarketState {
  stocks: Record<StockSymbol, StockDefinition>;
  activeTrades: ActiveOptionTrade[];
  slopSuspicion: number; // 0 to 100%. At 100%, triggers Emergency Special Counsel Raid
  vexVolatility: number; // Baseline market volatility index ($VEX)
  cronyFavor: number; // Currency used to bribe S.L.O.P. auditors
  isWalkBackWindowActive: boolean; // 8-second Straddle Squeeze window
  walkBackSecondsRemaining: number;
  lastTargetStockSymbol?: StockSymbol; // Targeted stock for the walk-back squeeze
}
