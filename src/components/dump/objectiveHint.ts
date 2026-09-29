/**
 * Hover copy for the Career Objectives list.
 *
 * WHY A HEADLESS MODULE
 * The list's `detail` string is already printed directly beneath each row, so
 * reusing it as the hover would make the tooltip say exactly what the label
 * says — which is the one thing the hover rule forbids. These hints add the
 * thing the row does not show: the live reading, and what completing it
 * actually opens.
 *
 * Headless and pure so the component file stays a component file.
 */

import { formatCurrency } from '../../engine/math/bigNumber';
import { FRENZY_CLICK_MULTIPLIER, FRENZY_DURATION_SECONDS } from '../../constants/balance';
import type { Objective } from '../../constants/onboarding';

/** What finishing each named objective actually unlocks — the stakes. */
const UNLOCKS: Record<string, string> = {
  // INVARIANT: [Name Only What The Code Opens] — an earlier draft said crossing
  // $1M opens "the whole right deck at once". It opens `dump` and nothing else:
  // `unlocks` waits on the first liquidation, `tariffs` on the first upgrade,
  // and `caymans` on the first dial move. A player who believes the whole deck
  // opened will sit at $1M wondering where three channels went.
  oval: 'Opens the D.U.M.P. liquidation tree, and only that. The upgrade shop then waits on your first hatchet order, the tariff dials on your first upgrade, and the Caymans on your first dial move — this desk unseals one thing at a time.',
  // INVARIANT: [Do Not Promise A Refund The Engine Forbids] — `inkFrenzyEngine`
  // carries an explicit invariant that a frenzy does NOT restore ink ("a free
  // refill would make the frenzy self-sustaining and break the drain"). An
  // earlier draft promised "ink restored", so a player priming for a frenzy
  // would have been budgeting on a tank refill that never comes.
  frenzy: `A ${FRENZY_CLICK_MULTIPLIER}x cash multiplier for ${FRENZY_DURATION_SECONDS} seconds. Ink is not consumed while it runs — and none is refunded either, so the tank you bring is the tank you keep. It is the only burst in the game that is pure upside.`,
  crisis:
    'Nothing unlocks, but the Red Phone is a faucet: a crisis pays more the longer you let it ring, up to ten times the base, and swearing in feeds the tantrum meter on the way.',
  liquidation:
    'Each one is instant cash plus a permanent perk, and a quarter of the Crony Favor you spend is handed straight back. The first liquidation of any kind is also what opens the upgrade shop.',
};

/** True when an objective's progress is money rather than a counter. */
export function isMoneyObjective(obj: Objective): boolean {
  return obj.target >= 1_000_000;
}

/**
 * The row's own reading/target labels.
 *
 * INVARIANT: this threshold used to be written out in BOTH this module and
 * `SituationRoom`, and the two formats drifting is how a row ends up printing
 * `$1.00M` while its tooltip says `1000000`.
 */
export function formatObjectiveReading(
  obj: Objective,
  current: number
): { current: string; target: string } {
  return isMoneyObjective(obj)
    ? { current: formatCurrency(current), target: formatCurrency(obj.target) }
    : { current: String(Math.floor(current)), target: String(obj.target) };
}

export function objectiveHint(
  obj: Objective,
  current: number,
  isDone: boolean,
  isNext: boolean
): string {
  const { current: reading, target } = formatObjectiveReading(obj, current);
  const progress = `Currently ${reading} of ${target}.`;
  const stakes = UNLOCKS[obj.id] ?? obj.detail;

  if (isDone) return `Certified. ${stakes}`;

  // Only the next objective gets promoted copy. The rest are reference rows,
  // and shouting at all of them is the same noise the collapse just removed.
  return isNext ? `NEXT UP. ${progress} ${stakes}` : `${progress} ${stakes}`;
}
