/**
 * Canonical Balance Constants
 * Single source of truth for clicker, frenzy, ink, market-shock, and Crony Favor tuning.
 * Both the engine (store slices) and the UI meters import from here so on-screen text
 * can never drift from the numbers the simulation actually uses.
 *
 * Values are derived from GAME_DESIGN_DOCUMENT.md §3.1–§3.2.
 */

/** Ink consumed per inked click (GDD §3.1: 1.25 units/click). */
export const INK_PER_CLICK = 1.25;

/** Passive ink recovery per second (GDD §3.1: 0.5 units/second). */
export const INK_REGEN_PER_SECOND = 0.5;

/**
 * INVARIANT: [Ink Fuels Frenzy]
 * Tantrum only accrues from INKED clicks. A dry nib still pays a reduced yield so
 * the player is never soft-locked, but it builds no tantrum — therefore spending
 * ink is the correct way to reach a CAPS LOCK FRENZY, and running dry is a
 * fallback rather than an optimisation.
 */
export const INKED_TANTRUM_PER_CLICK = 1.5;

/** Tantrum gained per inked click with the Diet Soda Desk Drip upgrade (GDD §3.1: +2.25%). */
export const DIET_SODA_TANTRUM_PER_CLICK = 2.25;

/**
 * INVARIANT: dry nibs build NO tantrum. See [Ink Fuels Frenzy] above.
 * Retained as an explicit zero so the intent is legible in the click handler.
 */
export const DRY_TANTRUM_PER_CLICK = 0;

/** Yield retained by a dry-nib click, as a fraction of full inked yield. */
export const DRY_CLICK_YIELD_MULTIPLIER = 0.1;

/** CAPS LOCK FRENZY duration in seconds (GDD §3.1: 20s). */
export const FRENZY_DURATION_SECONDS = 20;

/** CAPS LOCK FRENZY click multiplier (GDD §3.1: 10x). */
export const FRENZY_CLICK_MULTIPLIER = 10;

/** Ink consumed by one 3:00 AM Lethal YAP. */
export const INK_COST_PER_YAP = 20;

/** S.L.O.P. heat added by a targeted YAP, and by a shotgun YAP. */
export const YAP_HEAT = 12;
export const YAP_HEAT_SHOTGUN = 16;

/** Seconds the Straddle Squeeze walk-back window stays open after a crash. */
export const WALK_BACK_WINDOW_SECONDS = 8;

/** Recovery rally applied by a successful Straddle Squeeze. */
export const WALK_BACK_PUMP_MULTIPLIER = 1.35;

/** 0DTE contract lifetime. */
export const TRADE_DURATION_MS = 60000;

/** Collateral consumed per synthetic contract. */
export const COLLATERAL_PER_CONTRACT = 10;

/** S.L.O.P. heat added for opening a contract, by leverage band. */
export const HEAT_LEVERAGE_HIGH = 5;
export const HEAT_LEVERAGE_LOW = 1;

/**
 * INVARIANT: [The Cooling-Off Protocol]
 * Seconds the Dealmaker must wait before the tantrum meter can fill again after a
 * FRENZY ends. Without this, tantrum accrued *during* frenzy (the meter is not
 * gated) leaves it at 100% the instant the timer expires, so frenzy re-triggers
 * on the same frame and uptime approaches 100%. This lockout makes FRENZY a
 * genuine, earned burst rather than a permanent state.
 *
 * Scales with phase: early game stays snappy, late game makes frenzy precious.
 */
export const FRENZY_COOLDOWN_BY_PHASE: Record<number, number> = {
  1: 15,
  2: 25,
  3: 40,
  4: 60,
};

/** Tantrum passively bleeds off during the post-frenzy cooldown. */
export const FRENZY_COOLDOWN_TANTRUM_DECAY_PER_SECOND = 6.0;

/**
 * VENT THE TANTRUM — a deliberate, player-chosen release of executive blood
 * pressure in exchange for calmer markets.
 *
 * DESIGN RATIONALE: the tantrum meter previously had no outlet. It filled to
 * 100%, forced a FRENZY, and then bled off automatically on a cooldown. That
 * made the meter a pure countdown rather than a decision, and the Ink/Tantrum
 * pair read as structurally mismatched (only Ink had an action).
 *
 * INVARIANT: [Venting Must Never Be Optimal]
 * Venting costs ALL accumulated tantrum (including anything past the 100% that
 * a frenzy would have consumed for free) and grants a VEX reduction capped at
 * VEX_BASELINE. So the correct play is still to ride the meter to 100% and take
 * the 10x FRENZY; venting is the panic button for a player who needs calmer
 * options pricing, not the efficient route to profit.
 */

/** Tantrum fraction consumed by a vent (always the full meter — see above). */
export const TANTRUM_VENT_CONSUME_RATIO = 1.0;

/** VEX points removed per vent, before clamping to the baseline. */
export const TANTRUM_VENT_VEX_RELIEF = 8.0;

/**
 * Minimum tantrum required to vent. Prevents spamming the button at an empty
 * meter, which would otherwise be a free no-op that still triggered sound/UI.
 */
export const TANTRUM_VENT_MIN_TANTRUM = 10;

/** Multiplier applied to the ink refill cost curve (GDD: 1.15^n → steeper). */
export const INK_REFILL_COST_GROWTH = 1.35;

/** Ink refill cost ceiling from the flat exponential term. */
export const INK_REFILL_COST_CAP = 25000;

/**
 * INVARIANT: [Ink Is A Cost Center]
 * Refills additionally cost a percentage of current treasury, so ink is a real
 * ongoing tax on earnings at every stage rather than a flat early-game expense.
 */
export const INK_REFILL_TREASURY_RATIO = 0.02;

/** Consecutive dry clicks before the nib jams and dry yield collapses further. */
export const DRY_CLICK_JAM_THRESHOLD = 30;

/** Dry-click yield multiplier once the nib is jammed (still above the bankruptcy floor). */
export const DRY_CLICK_JAM_YIELD_MULTIPLIER = 0.02;

/** Maximum YAP crash severity; price can never fall below 8% of its pre-YAP value (GDD §3.2). */
export const MAX_CRASH_SEVERITY = 0.92;

/** VEX volatility baseline, cap, and decay (GDD §3.2). */
export const VEX_BASELINE = 15.0;
export const VEX_CAP = 80.0;
export const VEX_DECAY_PER_SECOND = 0.5;
export const VEX_GAIN_SELECTED = 25;
export const VEX_GAIN_SHOTGUN = 35;

/** Crony Favor (🤝) faucets — political capital earned from active play and holding power. */
export const CRONY_FAVOR_PER_YAP = 2;
export const CRONY_FAVOR_PASSIVE_PER_SECOND = 0.05;
export const CRONY_FAVOR_LIQUIDATION_KICKBACK_RATIO = 0.25;
export const CRONY_FAVOR_MAX = 9999;

/** Prestige (Tier 1) SIS formula constants (GDD §5). */
export const PRESTIGE_CASH_DIVISOR = 1e10;
export const PRESTIGE_CASH_EXPONENT = 0.32;
export const PRESTIGE_OPTIONS_DIVISOR = 1e9;
export const PRESTIGE_OPTIONS_EXPONENT = 0.38;
export const PRESTIGE_OPTIONS_WEIGHT = 3;
