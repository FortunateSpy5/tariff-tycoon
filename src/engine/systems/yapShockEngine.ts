/**
 * YAP Shock Engine — PURE 3:00 AM YAP crash resolution.
 *
 * INVARIANT: [Headless Game Logic Belongs in src/engine/]
 * No React, no Zustand, no store reads, no audio.
 *
 * INVARIANT: [Causality Is The Premise]
 * AGENTS.md requires that "stock crashes must be causally triggered by player
 * YAPs and tariffs, never purely passive background RNG." This module is where
 * that promise is kept. The crash magnitude is a pure function of the YAP's
 * tariff percentage, whether the player is in CAPS LOCK FRENZY, and whether
 * they fired shotgun-style — all three are player decisions. A crash can never
 * originate from a random walk in here; the only randomness in the whole YAP
 * path is WHICH stock a shotgun YAP lands on.
 *
 * EXTRACTED FROM `tradingSlice.triggerYapMarketShock`, which mixed gating
 * (cooldown, ink, market access), target selection, the crash formula and a
 * large `set()` payload in one function.
 *
 * KaTeX (GDD §3.2):
 *   d = \min\left(0.92,\ \left(0.25 + \frac{\tau}{1000}\right) \cdot M_{frenzy} \cdot M_{shotgun}\right)
 *   S_{crash} = \max\left(1.0,\ S_0 \cdot (1 - d)\right)
 */

import { MAX_CRASH_SEVERITY } from '../../constants/balance';
import type { StockSymbol } from '../../types/market';

/** Frenzy multiplies crash severity — the reward for the burst state. */
export const FRENZY_CRASH_BONUS = 1.4;

/** Shotgun YAPs hit 25% harder but cost more S.L.O.P. and grant no targeting. */
export const SHOTGUN_CRASH_BONUS = 1.25;

/** Base severity before tariff magnitude is added. */
const BASE_SEVERITY = 0.25;

/** Tariff percentage is divided by this to scale into the severity term. */
const TARIFF_SCALE = 1000;

/** A stock can never print below this after a crash. */
const MIN_PRICE = 1.0;

/** Maximum retained price-history samples. Mirrors `marketEngine`. */
const PRICE_HISTORY_LENGTH = 20;

export interface YapShockInput {
  /**
   * Tariff percentage declared in the YAP. Optional: a YAP with no declared
   * tariff falls back to the 100% default rather than crashing to zero, which
   * would make it a no-op instead of a modest crash.
   */
  tariffPercentage?: number;
  /** Whether a CAPS LOCK FRENZY is active. */
  isCapsFrenzy: boolean;
  /** Whether the YAP was fired shotgun-style (random target). */
  isShotgun: boolean;
  /** Current price of the target. */
  currentPrice: number;
  /** Existing price history for the target. */
  priceHistory: number[] | undefined;
}

export interface YapShockResult {
  /** The post-crash price, floored at MIN_PRICE. */
  newPrice: number;
  /** Severity actually applied, after the MAX_CRASH_SEVERITY clamp. */
  crashSeverity: number;
  priceHistory: number[];
}

/** Resolve a YAP into a crash. Pure — same input always yields the same crash. */
export function resolveYapShock(input: YapShockInput): YapShockResult {
  const frenzyBonus = input.isCapsFrenzy ? FRENZY_CRASH_BONUS : 1.0;
  const shotgunBonus = input.isShotgun ? SHOTGUN_CRASH_BONUS : 1.0;
  const tariffMagnitude = (input.tariffPercentage || 100) / TARIFF_SCALE;

  // INVARIANT: severity is clamped. Without the cap, a 4000% tariff YAP during
  // frenzy while shotgunning would imply a negative multiplier and PRINT money.
  const crashSeverity = Math.min(
    MAX_CRASH_SEVERITY,
    (BASE_SEVERITY + tariffMagnitude) * frenzyBonus * shotgunBonus
  );
  const crashMultiplier = 1.0 - crashSeverity;

  const newPrice = Math.max(MIN_PRICE, +(input.currentPrice * crashMultiplier).toFixed(2));

  const prev = input.priceHistory ?? [];
  const priceHistory =
    prev.length >= PRICE_HISTORY_LENGTH ? [...prev.slice(1), newPrice] : [...prev, newPrice];

  return { newPrice, crashSeverity, priceHistory };
}

/**
 * Gate a YAP before it is allowed to fire.
 *
 * INVARIANT: [A YAP Is Never Free]
 * A YAP costs ink AND has a cooldown AND requires market access. The ink cost
 * is the important one: it makes the 3:00 AM decree compete with the manual
 * stamp for the same resource, so the player is always choosing between the
 * fast verb and the precise one rather than doing both.
 *
 * @returns `null` when the YAP may fire, otherwise the player-facing refusal.
 */
export function gateYap(params: {
  hasMarketAccess: boolean;
  inkLevel: number;
  inkCost: number;
  secondsSinceLastYap: number;
  cooldownSeconds: number;
}): string | null {
  if (!params.hasMarketAccess) {
    return 'BagHolder Pro access is required to launch a market YAP.';
  }
  if (params.secondsSinceLastYap < params.cooldownSeconds) {
    const remaining = Math.ceil(params.cooldownSeconds - params.secondsSinceLastYap);
    return `YAP on cooldown (${remaining}s remaining)`;
  }
  if (params.inkLevel < params.inkCost) {
    return 'Need at least 20 Ink to sign a 3:00 AM Lethal YAP!';
  }
  return null;
}

/**
 * Pick a shotgun target at random.
 *
 * INVARIANT: this is the ONLY randomness in the YAP path. It selects WHICH
 * stock gets crashed, never HOW MUCH — the magnitude is fully deterministic
 * from player choices, which is what keeps crashes causal.
 */
export function pickShotgunTarget(symbols: StockSymbol[], rand: () => number = Math.random): StockSymbol {
  return symbols[Math.floor(rand() * symbols.length)];
}
