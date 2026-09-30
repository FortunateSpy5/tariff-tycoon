import { seedCandle } from '../engine/systems/candleEngine';
import type { StockDefinition, StockSymbol } from '../types/market';

/**
 * INVARIANT: [A Chart That Starts Empty Reads As Broken]
 * Every stock ships with one flat seed candle at its opening price so the very
 * first frame of the desk chart draws a body instead of an empty plot area. The
 * timestamp is `0`, NOT `Date.now()`: `INITIAL_STOCKS` is a module-level
 * constant, so a wall-clock stamp would be captured at import time and stay
 * frozen for the whole session. `0` instead guarantees the seed's bucket is
 * always older than the first real print, so the opening tick opens a fresh
 * bucket whose `open` is the seed's close — one gap-free transition.
 *
 * INVARIANT: [Not Every Ticker Opens Green] [ISSUE-008]
 * Every stock used to open at exactly `basePrice`, and the ticker ladder reads
 * `delta >= 0` as up, so a fresh save painted all nine rows as a green ▲ with
 * `0.0` beside it — on a news marquee that opens with "THE S&PAIN 500 INCHES
 * TOWARD RECORD DISASTER // BUY PUTS". The chart said risk-on and the ticker
 * said a run was about to happen, on the same frame, and the player had to pick
 * which one to disbelieve.
 *
 * It also meant the ▲ was carrying no information at all: a signed zero is not a
 * direction, and eight identical glyphs teach a new player that the colour means
 * nothing. Two tickers now open ON A GAP — one down on a bad sector print, one
 * down on a crowded trade — which is the normal state of a real premarket and,
 * more usefully, means a YAP crash and a YAP rally are now visually DISTINGUISHABLE
 * on the very first frame.
 *
 * The seed candle stays at `basePrice`: that is the OPENING print, and the gap is
 * what happened after the bell. `priceHistory` ends on `currentPrice` so the
 * chart's drawn line and the ticker's ▲ agree, and `marketEngine.tickMarkets`
 * walks forward from `currentPrice` and mean-reverts toward `basePrice`, so the
 * gap decays rather than compounding.
 */
export const INITIAL_STOCKS: Record<StockSymbol, StockDefinition> = {
  FRUT: {
    symbol: 'FRUT',
    candles: [seedCandle(220, 0)],
    name: 'Fruit Ecosystem Inc.',
    sector: 'Consumer Hardware & Braided Dongles',
    description: '$1,999 Titanium Rectangles & Braided Dongles',
    basePrice: 220,
    currentPrice: 220,
    priceHistory: [220, 221, 219, 222, 220],
    volatilityMultiplier: 1.2,
  },
  GIGA: {
    symbol: 'GIGA',
    candles: [seedCandle(180, 0)],
    name: 'GigaFlex Motors',
    sector: 'Autonomous Wedge Transport & Bot Rallies',
    description: 'Stainless Steel Wedge Trucks & CEO Meme Rallies',
    basePrice: 180,
    currentPrice: 180,
    priceHistory: [180, 185, 175, 182, 180],
    volatilityMultiplier: 2.1,
  },
  DOOR: {
    symbol: 'DOOR',
    candles: [seedCandle(145, 0)],
    name: 'DoorPlug Dynamics',
    sector: 'Commercial Aerospace & Structural Tape',
    description: 'Commercial Jets Held Together by Blue Tape & Prayer',
    basePrice: 145,
    // Opened 145, sold off on the structural-tape inspection. The worst opening
    // in the book, on the highest-volatility name but one — so a targeted YAP at
    // DOOR is visibly shorting something already bleeding.
    currentPrice: 138.4,
    priceHistory: [145, 142.5, 143.1, 139.2, 138.4],
    volatilityMultiplier: 1.8,
  },
  MICR: {
    symbol: 'MICR',
    candles: [seedCandle(380, 0)],
    name: 'MacroSoft Cloud',
    sector: 'Enterprise Office Suites & Cloud Reboots',
    description: 'Mandatory 4:00 AM Hospital OS Updates & Bippy 2.0',
    basePrice: 380,
    currentPrice: 380,
    priceHistory: [380, 382, 378, 381, 380],
    volatilityMultiplier: 1.1,
  },
  GUAC: {
    symbol: 'GUAC',
    candles: [seedCandle(55, 0)],
    name: 'GuacSurcharge Grill',
    sector: 'Fast Casual Burrito & Portion Disputes',
    description: 'Lukewarm Carnitas & Portion-Scale Customer Revolts',
    basePrice: 55,
    currentPrice: 55,
    priceHistory: [55, 54, 56, 55, 55],
    volatilityMultiplier: 1.4,
  },
  MSIL: {
    symbol: 'MSIL',
    candles: [seedCandle(125, 0)],
    name: 'MicroSilicon Foundry',
    sector: 'Liquid-Cooled GPU Clusters & Ray-Tracing Hype',
    description: 'Leather-Jacket Larry GPU Clusters & Pure Liquid AI Hype',
    basePrice: 125,
    // Opened 125, gave back the AI premium. The most volatile ticker in the book
    // (2.5x) opening red, which is what makes it the one a shotgun YAP actually
    // wants to land on.
    currentPrice: 117.9,
    priceHistory: [125, 128, 122, 119.4, 117.9],
    volatilityMultiplier: 2.5,
  },
  LMBR: {
    symbol: 'LMBR',
    candles: [seedCandle(42, 0)],
    name: 'Great Northern Timber',
    sector: 'Boreal Softwood & Maple Slurry Extraction',
    description: 'Raw Pine Logs & Maple Slurry Barrels',
    basePrice: 42,
    currentPrice: 42,
    priceHistory: [42, 43, 41, 42, 42],
    volatilityMultiplier: 1.3,
  },
  AVOC: {
    symbol: 'AVOC',
    candles: [seedCandle(32, 0)],
    name: 'Nearshore Agro-Futures',
    sector: 'Perishable Produce & High-Velocity Fiesta Logistics',
    description: 'Green Gold & High-Velocity Fiesta Produce',
    basePrice: 32,
    currentPrice: 32,
    priceHistory: [32, 33, 31, 32, 32],
    volatilityMultiplier: 1.5,
  },
  PAIN: {
    symbol: 'PAIN',
    candles: [seedCandle(5200, 0)],
    name: 'The S&Pain 500 Index',
    sector: 'Macroeconomic Agony Benchmark',
    description: 'The Agony Benchmark of Western Capitalist Nihilism',
    basePrice: 5200,
    // The benchmark is red at the open, which is the only reading consistent
    // with a ticker that spends its life on a marquee reading "BUY PUTS".
    currentPrice: 5136.5,
    priceHistory: [5200, 5210, 5195, 5150, 5136.5],
    volatilityMultiplier: 1.0,
  },
};
