/**
 * Sovereign Immunity Slip (SIS) Perk Constellation — GDD §5.
 *
 * WHY THIS FILE EXISTS
 * `unlockedPerks` has been a `Record<string, boolean>` and `unlockPerk` has been
 * called from no component since the store was written. The perk tree rendered
 * nothing, so the right wing's most expensive channel had no reason to exist
 * past the prestige button. These are the six perks GDD §5 specifies, with the
 * numbers that make each one do what its name says.
 *
 * COST LADDER
 * Fibonacci (2, 2, 3, 5, 8, 13 — the two 2s being the Shell Company floor
 * adjustment recorded on that entry), because the SIS formula is a 0.32
 * exponent: one whole Slip is $10^10 of lifetime cash, two is ~$10^11, three
 * ~$3.7e11. A linear ladder would make the last two perks unreachable and the
 * first three bought in a single flight; a geometric one would make the first
 * free. See `nextLifetimeCashMilestone` in `engine/systems/perkEngine.ts`, which
 * shows the player the real distance to the next whole Slip.
 *
 * INVARIANT: [The Seed Cash Is Not This Perk]
 * GDD §5 perk 1 reads "start with $1M x SIS^1.2 seed cash", but
 * `executeFlightToCaymans` has ALWAYS granted that unconditionally — it is the
 * floor that stops a returning player beginning soft-locked, and the Caymans
 * hover copy promises it. The purchasable half of the perk is the +100% base
 * tap. GDD §5 carries a note to that effect.
 */

/** 4% of manual taps fire a Flash Dip (GDD §5 perk 2). */
export const FLASH_DIP_CHANCE = 0.04;

/** How long a Flash Dip lasts (GDD §5 perk 2: "for 8s"). */
export const FLASH_DIP_DURATION_SECONDS = 8;

/**
 * Options valuation during a Flash Dip (GDD §5 perk 2: "+500%").
 *
 * INVARIANT: this multiplies the SIGNED return, exactly as `VEX_GAIN_*` does —
 * it accelerates a losing position as faithfully as a winning one. The hint says
 * so, because the previous VEX tooltip did not and the plan records that as the
 * single most expensive kind of copy lie.
 */
export const FLASH_DIP_VALUATION_MULTIPLIER = 6;

/**
 * QE as a Service: how far below zero the treasury may be driven (GDD §5
 * perk 3: "-$50B").
 *
 * INVARIANT: [A Loan Is Not A Soft-Lock]
 * The bankruptcy floor in `formulas.ts` gains a debt term sized off this
 * buffer (see `DEBT_RECOVERY_CLICKS`), so the deepest reachable hole is always
 * worked off in bounded time. Without that, a player who spent down to -$50B
 * with no Slips left would click at $1.00 a slam — 2.5 billion seconds to
 * climb out, which is the exact failure `Zero Soft-Locks` in AGENTS.md forbids.
 */
export const QEAAAS_BUFFER = 50_000_000_000;

/**
 * How many manual clicks the bankruptcy floor's debt term is sized to clear the
 * whole QEaaS buffer in.
 *
 * At 20 clicks/second that is one minute of uninterrupted slamming, and well
 * under that during a CAPS LOCK FRENZY. The floor DECAYS as the debt shrinks, so
 * the loan is exactly self-liquidating and can never print money — see the fixed
 * point in `debtReliefFloor`.
 */
export const DEBT_RECOVERY_CLICKS = 1200;

/** The Insider Exemption 401(k) matches every this many seconds (GDD §5 perk 4). */
export const AUTO_MATCH_INTERVAL_SECONDS = 60;

/** Fraction of the open book's PEAK value the 401(k) contributes (GDD §5: 1.5%). */
export const AUTO_MATCH_YIELD = 0.015;

/**
 * INVARIANT: [The Match Is Bounded By The 60-Second Contract]
 * Nothing clamps the match payout, because `TRADE_DURATION_MS` is 60000 — the
 * same figure as `AUTO_MATCH_INTERVAL_SECONDS`. A position therefore cannot
 * outlive two match windows, so at most one match is ever paid against it. That
 * is the whole reason this faucet is safe: there is no per-second compounding
 * annuity hiding behind a position the player never has to settle.
 */
export const AUTO_MATCH_HEAT = 0;

/** The Pardon Assembly Line cuts liquidation prices by this fraction (GDD §5: 65%). */
export const PARDON_COST_REDUCTION = 0.65;

/** The Golden Parachute Super-PAC carries this much agency investment over (GDD §5: 15%). */
export const PARACHUTE_RETENTION = 0.15;

/** Shell Company Inception's contribution: a second doubling of the base tap (GDD §5: +100%). */
export const SHELL_COMPANY_TAP_MULTIPLIER = 2;

export type PerkId =
  | 'shell_company_inception'
  | 'macro_wreck_280'
  | 'qe_as_a_service'
  | 'insider_401k'
  | 'pardon_assembly_line'
  | 'golden_parachute';

export interface PerkDefinition {
  readonly id: PerkId;
  readonly name: string;
  /** Cost in Sovereign Immunity Slips. Spent, never earned back. */
  readonly cost: number;
  /** The one-line pitch printed on the card. Mechanism lives in the hover. */
  readonly summary: string;
  /** The short label under the name, e.g. `+100% TAP`. */
  readonly effectLabel: string;
}

export const PRESTIGE_PERKS: readonly PerkDefinition[] = [
  {
    id: 'shell_company_inception',
    name: 'Shell Company Inception',
    // INVARIANT: [Cost 2, Not 1 — The Doubling Must Be Spendable While Visible]
    // At 1 Slip this perk is worth nothing to anyone who has one: the click
    // floor is `slips x $1,000`, so the floor is $1,000 the moment the purchase
    // lands, and it swamps a $5 x phase tap indefinitely in Phases 1-2. Measured
    // across the ladder: at 5 Slips the slam pays $5,000 with the perk and
    // $5,000 without it, identically, in both early phases — a 1-Slip purchase
    // that silently does nothing.
    //
    // At 2 Slips the player holds 0, the floor drops to $1.00, and the x2 is
    // fully felt for the whole of the run they bought it for. It decays as they
    // bank Slips, which is the correct shape for a "spend it now" perk: the
    // cheapest thing on the tree is the one you cash while it's still live.
    // The card states the crossover so the decay is never a surprise.
    cost: 2,
    summary: 'Incorporate the stamp. Every jurisdiction on earth bills you for the privilege of pressing it.',
    effectLabel: `${SHELL_COMPANY_TAP_MULTIPLIER}x BASE TAP`,
  },
  {
    id: 'macro_wreck_280',
    name: '280-Character Macro Wreck',
    cost: 2,
    summary: 'A 280-character screed that the compliance desk cannot process in time. Sometimes the tape moves first.',
    // INVARIANT: [This Is A Standing Condition, Not A Roll]
    // The 4% is per SLAM and the 8s window is only ticked by `tickDesk`, so at
    // the 45ms click cap the dip is up ~99.9% of the time — in practice a
    // permanent x6, not a rare windfall. The effect label therefore says
    // "~ALWAYS UP" rather than quoting a chance the player will essentially
    // never fail to get. Whether a near-permanent multiplier is the right perk
    // is a balance question this pass deliberately did not answer; the number
    // the player sees is now the number they get. See `perkHint` for the
    // derived uptime.
    effectLabel: `x${FLASH_DIP_VALUATION_MULTIPLIER} OPTIONS, ~ALWAYS UP`,
  },
  {
    id: 'qe_as_a_service',
    name: 'QE As A Service',
    cost: 3,
    summary: 'Sell the negative balance. The Bureau of Currency Values will lend you against the hole.',
    effectLabel: `SPEND TO -$${QEAAAS_BUFFER / 1e9}B`,
  },
  {
    id: 'insider_401k',
    name: 'Insider Exemption 401(k)',
    cost: 5,
    summary: 'A blind pool that front-runs you, on the understanding that neither of you will look too closely.',
    effectLabel: `${AUTO_MATCH_YIELD * 100}% MATCH / ${AUTO_MATCH_INTERVAL_SECONDS}s`,
  },
  {
    id: 'pardon_assembly_line',
    name: 'The Pardon Assembly Line',
    cost: 8,
    summary: 'Nobody is ever charged with anything. The guillotine runs on paperwork, and the paperwork is now free.',
    effectLabel: `-${PARDON_COST_REDUCTION * 100}% LIQUIDATION / NO RAIDS`,
  },
  {
    id: 'golden_parachute',
    name: 'Golden Parachute Super-PAC',
    cost: 13,
    summary: 'Every department you gutted keeps a severance package. The corpse retains institutional memory.',
    effectLabel: `KEEP ${PARACHUTE_RETENTION * 100}% OF PASSIVE`,
  },
] as const;

/** Perks keyed by id, for O(1) lookup at the spend gate. */
export const PERK_BY_ID: Readonly<Record<PerkId, PerkDefinition>> = Object.fromEntries(
  PRESTIGE_PERKS.map((p) => [p.id, p])
) as Record<PerkId, PerkDefinition>;

/** Total Slips needed to own the whole constellation. */
export const TOTAL_PERK_COST = PRESTIGE_PERKS.reduce((sum, p) => sum + p.cost, 0);
