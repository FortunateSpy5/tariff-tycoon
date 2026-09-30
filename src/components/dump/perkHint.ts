/**
 * Hover copy for the SIS perk constellation.
 *
 * WHY A HEADLESS MODULE
 * AGENTS.md's rule is that hover text must be COMPUTED from `constants/` and
 * `engine/`, never typed — a tooltip quoting a number the simulation does not
 * charge is a lie told at the exact moment the player is about to spend
 * permanent currency. Every figure below is interpolated from the same constants
 * the engine reads, and the two known traps are stated outright rather than
 * smoothed over:
 *
 *   - The Flash Dip multiplies the SIGNED return, so it burns a losing CALL
 *     faster than it pays a winning PUT. (The VEX tooltip that failed to say
 *     this is recorded in the plan as the most expensive line shipped here.)
 *   - QE As A Service is a LOAN. The player still owes every dollar of it.
 */

import {
  AUTO_MATCH_INTERVAL_SECONDS,
  AUTO_MATCH_YIELD,
  DEBT_RECOVERY_CLICKS,
  FLASH_DIP_CHANCE,
  FLASH_DIP_DURATION_SECONDS,
  FLASH_DIP_VALUATION_MULTIPLIER,
  PARACHUTE_RETENTION,
  PARDON_COST_REDUCTION,
  QEAAAS_BUFFER,
  type PerkDefinition,
} from '../../constants/perks';
import { TRADE_DURATION_MS } from '../../constants/balance';
import { RAID_BRIBE_COST, RAID_COOLDOWN_SECONDS } from '../../engine/systems/slopEngine';
import { shellCompanyCrossoverSlipCount } from '../../engine/systems/clickPayout';
import { formatCurrency } from '../../engine/math/bigNumber';

/** How long the full QEaaS buffer takes to work off, at the capped click rate. */
const CLICKS_PER_SECOND = 20;
const DEBT_RECOVERY_SECONDS = Math.round(DEBT_RECOVERY_CLICKS / CLICKS_PER_SECOND);

/**
 * The Flash Dip's steady-state uptime, derived rather than asserted.
 *
 * `clickDesk` rate-limits to 45ms (see its own INVARIANT), so a player mashing
 * the stamp generates `FLASH_DIP_CHANCE / 0.045` rolls a second. Against a
 * window of `FLASH_DIP_DURATION_SECONDS` that is a Poisson process with an
 * expected occupancy of `1 - e^(-lambda T)` — which is 99.9%, i.e. the dip is
 * essentially always up. Computed here so the copy states the real figure and
 * retuning either constant moves the number with it.
 */
const CLICK_CAP_SECONDS = 0.045;
const ROLLS_PER_SECOND = (FLASH_DIP_CHANCE / CLICK_CAP_SECONDS).toFixed(2);
const DIP_UPTIME = 1 - Math.exp(-(FLASH_DIP_CHANCE / CLICK_CAP_SECONDS) * FLASH_DIP_DURATION_SECONDS);

// INVARIANT: [Do Not Sell A Permanent State As A Roll]
// The 4% is per SLAM and the 8s window is only ticked by `tickDesk`, never by the
// click, so the dip is ACTIVE `DIP_UPTIME` of the time — 99.9%. The card now
// says "ALWAYS UP" and the hover states the figure. Whether a near-permanent
// multiplier is the right perk is a balance question this pass deliberately did
// not answer; the number the player reads is now the number they get.

/**
 * Why the Flash Dip can hurt you, in the player's own terms.
 *
 * INVARIANT: this is the sentence that must never be shortened away. The
 * multiplier is applied to `rawDelta * leverage`, before the profit clamp, so a
 * position that is down is marked down six times as fast.
 */
const FLASH_DIP_TRAP =
  `It multiplies the SIGNED return, so it accelerates a losing CALL exactly as hard as a winning PUT. ` +
  `Being short when it fires is the entire point; being long is how you lose a position in eight seconds. ` +
  `A ${TRADE_DURATION_MS / 1000}-second contract is the whole window, so a dip that fires on a contract ` +
  `already deep in profit pays enormously, and one that fires on a contract you should have closed does the opposite.`;

/**
 * Per-perk mechanism copy. `summary` on the card is the pitch; this is the truth.
 *
 * Takes the current PHASE because one perk's value depends on it: the Shell
 * Company doubling is applied to the product, which the $1,000-per-Slip floor
 * eventually overtakes, and where that happens moves with the phase multiplier.
 */
const MECHANISM: Record<PerkDefinition['id'], (phase: number, crossover: number) => string> = {
  shell_company_inception: (phase, crossover) =>
    `Doubles the base tap — a second doubling on top of the Heavy Tungsten Nib, compounding with it rather ` +
    `than replacing it, and applied after the phase, ink, frenzy and Slips multipliers have already run. ` +
    `The $1M x Slips^1.2 seed cash you come back with is NOT this perk: every flight grants that, because it ` +
    `is the floor that stops a returning player starting soft-locked. This is the part you pay for. ` +
    /* INVARIANT: [Say When A Perk Stops Doing Anything]
       The doubling is applied to the PRODUCT, and `calculateClickValue` pays
       `max(floor, product)` where the floor is `slips x $1,000`. Past a
       crossover the floor is what the slam actually pays and this perk becomes
       invisible — measured at 5 Slips: $5,000 with it, $5,000 without it,
       identically. A card that advertises a benefit the player cannot observe is
       the same defect class as every other number this pass removed, so the
       crossover is computed and stated rather than left for them to discover. */
    (crossover > 0
      ? `In Phase ${phase} the floor overtakes this doubling at ${crossover} Slips — past that, a slam pays the $1,000-per-Slip floor either way and this perk stops being visible. It is worth most bought EARLY.`
      : `In Phase ${phase} the base product outruns the floor at any Slip count, so this stays visible for the whole run.`),

  macro_wreck_280: () =>
    `A ${FLASH_DIP_CHANCE * 100}% roll on EVERY slam, not a once-per-minute roll, and a fresh roll even if one ` +
    `is already running — so the printed ${FLASH_DIP_CHANCE * 100}% is the real per-slam rate. A dip lasts ` +
    `${FLASH_DIP_DURATION_SECONDS} seconds and multiplies options valuation by ${FLASH_DIP_VALUATION_MULTIPLIER}. ` +
    `Read that as a standing condition, not a treat: at full click speed ` +
    `(${ROLLS_PER_SECOND} rolls a second) the dip is up roughly ` +
    `${Math.round(DIP_UPTIME * 100)}% of the time, so in practice this is close to a permanent ` +
    `x${FLASH_DIP_VALUATION_MULTIPLIER} on options. ` +
    FLASH_DIP_TRAP,

  qe_as_a_service: () =>
    `Every purchase, refill and collateral lock may drive the treasury to ${formatCurrency(QEAAAS_BUFFER)}. ` +
    `It is a LOAN, not income: the debt sits on the ledger and the seed cash you file with goes to paying it. ` +
    `The bankruptcy floor scales with the hole, so a slam still pays enough to work the whole buffer off in ` +
    `about ${DEBT_RECOVERY_SECONDS} seconds of continuous slamming, and the floor shrinks as fast as the debt ` +
    `does — so working it off can never print money. One consequence worth knowing: a raid no longer floors you ` +
    `at $10 if you are already under it, because a floor that LIFTS a negative balance is just a money printer.`,

  insider_401k: () =>
    `Pays ${AUTO_MATCH_YIELD * 100}% of the PEAK value your open 0DTE book reached since the last match, every ` +
    `${AUTO_MATCH_INTERVAL_SECONDS} seconds, and resets the peak to where the book sits NOW — so parking one ` +
    `enormous position does not pay forever. It pays nothing at all on an empty book: this perk is paid for by ` +
    `HOLDING leveraged risk. A contract lives ${TRADE_DURATION_MS / 1000} seconds, so at most one match is ever ` +
    `paid against it. No S.L.O.P. heat — the point of an insider exemption is that nobody files anything.`,

  pardon_assembly_line: () =>
    `Agency liquidations cost ${PARDON_COST_REDUCTION * 100}% less Crony Favor, and the committee kickback is ` +
    `charged on the discounted price, so the saving is real rather than an offset. It also abolishes S.L.O.P. ` +
    `raids outright: heat still accrues and still decays, and the meter is still the readout you manage, but at ` +
    `100% nothing comes through the door. That removes the ${RAID_BRIBE_COST}-favor raid bribe and the ` +
    `${RAID_COOLDOWN_SECONDS}s between seizures as decisions — you keep the shredder for the heat itself.`,

  golden_parachute: () =>
    `Keeps ${PARACHUTE_RETENTION * 100}% of your passive income rate across a Chapter 11 filing. GDD §5 words this ` +
    `as "retain 15% of all department levels", and the roster has no levels — an agency is either scrapped or it ` +
    `is not. The only quantity a liquidation actually produces is the passive multiplier, so that is what carries. ` +
    `Everything else still resets: the liquidations themselves, the crony upgrades, the tariff dials, the Slips ` +
    `you spent on this.`,
};

/**
 * The full hover for one perk card.
 *
 * @param phase The player's current phase, because the Shell Company doubling's
 *   visible lifetime depends on it — see `MECHANISM` above.
 */
export function perkHint(
  perk: PerkDefinition,
  owned: boolean,
  slipsHeld: number,
  phase: number = 1
): string {
  const plural = perk.cost === 1 ? '' : 's';
  const status = owned
    ? 'OWNED AND PERMANENT. It survives every filing, and the cost is already spent.'
    : slipsHeld >= perk.cost
      ? `Costs ${perk.cost} Sovereign Immunity Slip${plural}. You hold ${slipsHeld}.`
      : `Costs ${perk.cost} Sovereign Immunity Slip${plural} and you hold ${slipsHeld} — short ${
          perk.cost - slipsHeld
        }. Slips come only from filing, and the gate is lifetime earnings plus every dollar still locked in open 0DTE positions.`;

  const crossover = shellCompanyCrossoverSlipCount(phase);
  return `${status} ${MECHANISM[perk.id](phase, crossover)}`;
}
