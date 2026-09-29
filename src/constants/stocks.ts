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
    currentPrice: 145,
    priceHistory: [145, 142, 147, 141, 145],
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
    currentPrice: 125,
    priceHistory: [125, 128, 122, 127, 125],
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
    currentPrice: 5200,
    priceHistory: [5200, 5210, 5195, 5205, 5200],
    volatilityMultiplier: 1.0,
  },
};
