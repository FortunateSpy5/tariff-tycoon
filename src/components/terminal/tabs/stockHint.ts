/**
 * Hover copy for the BagHolder Pro order slip.
 *
 * WHY A HEADLESS MODULE
 * Every string here is built from live game data — the stock definition, the
 * player's own tariff policy, the leverage band, the locked collateral. None of
 * it is static English, so none of it can live in a component file: components
 * export components, and a hint that hardcodes "5% move" would drift from
 * `settlementEngine` the day somebody tunes a constant.
 *
 * INVARIANT: [Stated Numbers Are True]
 * Every figure quoted below is read from `constants/balance.ts` or
 * `engine/systems/settlementEngine.ts` at call time. A hint that states a number
 * the simulation does not use is a lie told to the player at the exact moment
 * they are about to risk money, so the constants are imported rather than typed.
 */

import type { ActiveOptionTrade, StockDefinition, StockSymbol } from '../../../types/market';
import { PARODY_NATIONS } from '../../../constants/nations';
import {
  COLLATERAL_PER_CONTRACT,
  HEAT_LEVERAGE_HIGH,
  HEAT_LEVERAGE_LOW,
  MAX_CRASH_SEVERITY,
  TRADE_DURATION_MS,
  VEX_BASELINE,
  WALK_BACK_PUMP_MULTIPLIER,
} from '../../../constants/balance';
import { formatCurrency } from '../../../engine/math/bigNumber';

/** Seconds a 0DTE contract survives without being settled. */
const ZERO_DAYS = TRADE_DURATION_MS / 1000;

/** Worst-case crash magnitude a YAP can inflict, as a percentage. */
const WORST_CRASH_PCT = Math.round(MAX_CRASH_SEVERITY * 100);

/** Straddle Squeeze recovery rally, as a percentage. */
const pumpPct = Math.round((WALK_BACK_PUMP_MULTIPLIER - 1) * 100);

/**
 * S.L.O.P. heat charged for opening a contract at this leverage.
 *
 * Mirrors the exact ternary in `tradingSlice.openOptionTrade`. INVARIANT: the
 * chip's advertised heat and the heat actually applied must be one function.
 */
export function openHeat(leverage: number): number {
  return leverage > 100 ? HEAT_LEVERAGE_HIGH : HEAT_LEVERAGE_LOW;
}

/**
 * Per-leverage-chip hover copy: what the multiplier does, and what it costs.
 * Module-private — exporting a `Record<number, string>` keyed by magic numbers
 * only invites a caller to build a chip the table has no copy for.
 */
const LEVERAGE_HINTS: Record<number, string> = {
  // INVARIANT: [VEX Multiplies The Whole Payout, Not Just The Upside]
  // `calculateOptionReturn` applies the vol factor to the SIGNED delta, so
  // every gain figure here is a floor, not a quote. Saying "a 92% crash
  // returns 9.2x" without saying "at the baseline" is how a player ends up
  // surprised in the one direction that is supposed to be good news.
  10: `The stake moves 10% for every 1% the ticker does, either direction, and the payout has no ceiling: a ${WORST_CRASH_PCT}% crash returns ${MAX_CRASH_SEVERITY * 10}× the collateral at the ${VEX_BASELINE} VEX baseline, and proportionally more for every point of volatility piled on. The only floor is losing all of it. +${HEAT_LEVERAGE_LOW} S.L.O.P. heat to open.`,
  100: `Every 1% of price is 100% of the stake. One tick up doubles the money; one tick down erases it. A YAP moves this far between one breath and the next, which is either the whole trade or the reason for it. +${HEAT_LEVERAGE_LOW} S.L.O.P. heat to open.`,
  1000: `A tenth of one percent decides the position, and $VEX above the ${VEX_BASELINE} baseline multiplies the payout on top of that. The S.L.O.P. desk reads 1000× as a written confession, and charges +${HEAT_LEVERAGE_HIGH} heat for it — five times the 10× and 100× cost.`,
};

/**
 * Leverage hover copy composed with the money actually riding on it.
 *
 * @param lvl Selected leverage multiplier.
 * @param collateralAmount Collateral the player has selected.
 */
export function leverageHint(lvl: number, collateralAmount: number): string {
  const base = LEVERAGE_HINTS[lvl] ?? `The stake moves ${lvl}× for every 1% the ticker does.`;
  return `${base} ${formatCurrency(collateralAmount)} of maximum loss is riding on it.`;
}

/**
 * Collateral hover copy: how many contracts it buys and what it can cost.
 *
 * INVARIANT: the loss statement is exact. `calculateOptionReturn` floors the
 * return at -1 and settlement credits `max(0, collateral + pnl)`, so the
 * collateral is a hard ceiling on the downside — not an approximation.
 */
export function collateralHint(amount: number): string {
  const contracts = Math.floor(amount / COLLATERAL_PER_CONTRACT);
  return `Locks ${formatCurrency(amount)} for ${contracts} synthetic contract${contracts === 1 ? '' : 's'} at ${formatCurrency(COLLATERAL_PER_CONTRACT)} of collateral each. That is the entire downside: the return is floored at -100% of collateral and never below. More collateral scales the payout, not the odds.`;
}

/** The tariff clause for one linked nation, mirroring `tariffPressureFor`. */
function tariffClause(name: string, rate: number): string {
  if (rate > 100) return `${name} tariffs (${rate}%) depress this.`;
  // The 50–100% band is drift-neutral in marketEngine; saying "relieve" there
  // would credit the player for a policy that does nothing.
  if (rate < 50) return `${name} tariffs (${rate}%) relieve this.`;
  return `${name} tariffs (${rate}%) do nothing to this.`;
}

/**
 * Watchlist-row hover copy, wired to the player's own trade policy.
 *
 * The causality clause is the point of the whole game: these stocks move
 * because of decrees the player signed, and the row says so with the live rate.
 */
export function stockHint(
  symbol: StockSymbol,
  stock: StockDefinition,
  tariffRates: Record<string, number>
): string {
  // `Fruit Ecosystem Inc.` already ends in a period, so the separator is
  // applied to a stripped name or the hint reads "Inc.. $1,999".
  const head = `${stock.name.replace(/\.$/, '')}. ${stock.description}. Base $${stock.basePrice.toFixed(2)} · volatility ${stock.volatilityMultiplier}×. `;
  const clauses = PARODY_NATIONS.filter((nation) => nation.linkedStocks.includes(symbol)).map((nation) =>
    // INVARIANT: [No Free Lunch At Customs] — the fallback is 0, never
    // `nation.defaultTariffRate`. The dials all start at zero (P0-2), so a
    // missing key means "not tariffed". Quoting the default here would tell the
    // player their 175% Red Factory policy is live when the engine is paying
    // out on 0% — the hint would contradict the sim.
    tariffClause(nation.name, tariffRates[nation.id] ?? 0)
  );
  return head + clauses.join(' ');
}

/** Non-operative readout for the selected-ticker panel: sector and its masters. */
export function sectorLinkageHint(symbol: StockSymbol, stock: StockDefinition): string {
  const linked = PARODY_NATIONS.filter((nation) => nation.linkedStocks.includes(symbol));
  const who = linked.length
    ? linked.map((nation) => nation.name).join(' and ')
    : 'no signed tariff regime';
  return `${stock.sector}. Priced against ${who}. The panel reads the live mark and the drift since base — it draws no candles, so a sharp move is a print, not a pattern.`;
}

/**
 * The payout model, stated once, for both order types.
 *
 * INVARIANT: [There Is No Strike And No Time Decay]
 * The row prints a "strike" 5% under entry and a "target" 10% under it, and an
 * earlier draft of this copy called the target "where the contract actually
 * pays" and the expiry "worth $0 regardless". Both are false, and the pair is
 * the most expensive kind of lie: a player who believes it will sit on a
 * WINNING position until the clock runs out, banking a loss they never had to
 * take.
 *
 *   - `calculateOptionReturn` is LINEAR in the price move. Nothing special
 *     happens at 5% or at 10%; the payout is just `move × leverage`.
 *   - Expiry settles at the prevailing mark (`settlementEngine.settleOne`),
 *     not at zero. Sitting still is not a decision to collect nothing — it is
 *     a bet that the mark holds.
 *
 * The two numbers on the row are reference marks the store computes and
 * displays. They are not a payoff schedule.
 */
function payoutModel(leverage: number, direction: 'drop' | 'rally'): string {
  const perOne = `${leverage}% of the stake`;
  return `The 5% strike and 10% target printed on the row are reference marks, not payoffs — the payout is linear in the move, so nothing special happens at either number. Every 1% ${direction} returns ${perOne}. 0DTE: it expires in ${ZERO_DAYS}s and settles at whatever the tape is printing then — no time decay, no breakeven — so waiting is a bet on the mark, not a free option.`;
}

/** PUT hover copy: direction, the real payout model, and the heat it costs. */
export function putHint(leverage: number, collateralAmount: number): string {
  return `Bet the ticker down. ${payoutModel(leverage, 'drop')} ${collateralHint(collateralAmount)} +${openHeat(leverage)} S.L.O.P. heat the moment it opens.`;
}

/** CALL hover copy. Keeps the walk-back branch meaning rather than a 3-way title. */
export function callHint(params: {
  leverage: number;
  collateralAmount: number;
  windowOpen: boolean;
  matchesWindow: boolean;
  targetSymbol: StockSymbol | undefined;
  secondsRemaining: number;
}): string {
  const { leverage, collateralAmount, windowOpen, matchesWindow, targetSymbol, secondsRemaining } = params;
  // INVARIANT: every branch carries the same risk information. An earlier draft
  // gave the walk-back branches a shorter string, so the player one YAP from a
  // squeeze — the moment they are most likely to click — learned the least.
  const risk = ` ${collateralHint(collateralAmount)} +${openHeat(leverage)} S.L.O.P. heat the moment it opens.`;
  if (windowOpen && !matchesWindow) {
    return `The Straddle Squeeze window is open on $${targetSymbol}, not here. Only a CALL on $${targetSymbol} inside it gets the walk-back: a ${pumpPct}% recovery rally, unwound for free if the window closes with it still open. A CALL on any other ticker is an ordinary bet.${risk}`;
  }
  if (windowOpen && matchesWindow) {
    return `The walk-back combo. A CALL on $${targetSymbol} opened inside this ${Math.ceil(secondsRemaining)}s window unwinds the crash with a ${pumpPct}% rally, free, if you get back to the desk in time. Miss the window and it is an expensive bullish guess at full price.${risk}`;
  }
  return `Bet the ticker up. ${payoutModel(leverage, 'rally')}${risk}`;
}

/** SETTLE hover copy, including the two branches the player cannot see in the row. */
export function settleHint(trade: ActiveOptionTrade): string {
  const base = `Close it now at today's mark. The manual path and the ${ZERO_DAYS}s expiry price identically, so there is no penalty for leaving early and no reward for waiting — only for reading the tape correctly.`;
  // INVARIANT: [Under-Warning Is Still A Lie] — the first draft said hand-settling
  // a squeeze CALL "banks a mark taken mid-squeeze and throws the refund away",
  // which reads like a rounding error. It is not: the combo branch is skipped
  // (`walkBackWindowExpired: false`, `settlementSlice.ts:49`), so the CALL is
  // priced straight after the very crash PUTs pay for — pinned at -100% — and
  // the whole collateral is gone. Say the number, not the mood.
  const combo = trade.isWalkBackCombo
    ? ' THIS IS THE SQUEEZE CALL, and hand-settling it is the expensive mistake: the walk-back is the only thing that unwinds it, and without that branch the position is priced at the post-crash mark, where a CALL is already deep underwater. You lose the ENTIRE stake. Walk it back, or let it expire — but know which of those you are choosing.'
    : '';
  const paper = trade.isPaperTrade
    ? ' Safe Practice Stakes are live on this one, so a losing settlement refunds the whole stake instead of banking the loss.'
    : '';
  return `${base}${combo}${paper}`;
}
