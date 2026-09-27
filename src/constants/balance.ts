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

/** Tantrum gained per inked click (GDD §3.1: +1.5%). */
export const INKED_TANTRUM_PER_CLICK = 1.5;

/** Tantrum gained per inked click with the Diet Soda Desk Drip upgrade (GDD §3.1: +2.25%). */
export const DIET_SODA_TANTRUM_PER_CLICK = 2.25;

/** Tantrum gained per dry-nib click (GDD §3.1: +3.5%). Dry clicks can fill the meter to 100%. */
export const DRY_TANTRUM_PER_CLICK = 3.5;

/** CAPS LOCK FRENZY duration in seconds (GDD §3.1: 20s). */
export const FRENZY_DURATION_SECONDS = 20;

/** CAPS LOCK FRENZY click multiplier (GDD §3.1: 10x). */
export const FRENZY_CLICK_MULTIPLIER = 10;

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
