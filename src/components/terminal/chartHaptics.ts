/**
 * Chart Haptics — pure geometry and scale for the BagHolder Pro tape chart.
 *
 * WHY A HEADLESS MODULE
 * A component module exports components, so the arithmetic that decides where a
 * wick ends and how big an impact scar is cannot live in `PriceChart.tsx`.
 * `candleEngine.scaleSeries` owns the maths; this owns the frame and the guards.
 * The WORDS live in `chartCopy` — geometry is a record, copy is a promise, and
 * this repo treats a false promise as the defect while leaving records alone.
 *
 * INVARIANT: [No Number On Screen Is Invented]
 * Every coordinate printed here is read off a candle, off a prop the store
 * already had, or is a labelled boundary of the plot area. The marker's SIZE
 * comes from the engine's `playerMoveMagnitude`; the figure the chip quotes is
 * the bucket's measured excursion in the direction the price actually went — a
 * figure the tape produced. Assuming the magnitude means the same thing as the
 * price move is exactly the assumption that rots the day a third sanctioned move
 * is added, which is why `chartCopy` names the two separately.
 *
 * INVARIANT: [A Marker Never Points The Wrong Way]
 * Two player actions mark a candle: a YAP, which drives the price DOWN, and a
 * walk-back clarification, which pumps it UP. Colour, arrow direction, anchor
 * point (the low vs the high) and the chip's verb all follow the engine-recorded
 * `playerMoveDirection`, so a green recovery is never rendered as a red crash.
 * That direction CANNOT be recovered from the candle body: the clarification
 * window is 8s against a 2s bucket, so a YAP and its walk-back routinely share
 * one bucket, and the rally's close still sits under the pre-crash open.
 *
 * INVARIANT: [Nothing Escapes The Frame]
 * `scaleSeries` guarantees the domain contains the base price, which is what makes
 * `y()` land inside the box for a well-formed series. A corrupt or half-migrated
 * save is a different matter, so every coordinate handed to the renderer is
 * clamped to the plot rect. Bad data must fail as a blank chart — never a NaN
 * path, never an exception, never a lie.
 */

import { scaleSeries, type ChartBox } from '../../engine/systems/candleEngine';
import type { PriceCandle } from '../../types/market';

/* ==== THE FRAME — viewBox units, NOT pixels ==== */

/**
 * INVARIANT: [The Container Sizes The Chart, Never Us]
 * The plot mounts in the 3-of-12 left wing of a fixed-height, `overflow-hidden`
 * cockpit with a hard 1280x720 invariant, so a hard-coded height here becomes a
 * scrollbar on the smallest supported screen. The renderer stretches this box
 * with `preserveAspectRatio="none"` under a wrapper pinning the ratio to 320/120 —
 * so the stretch is uniform in practice — while `vector-effect="non-scaling-stroke"`
 * holds the hairlines at a constant device width however far it is stretched.
 */
export const VIEW_W = 320;
export const VIEW_H = 120;

/** Insets: the right gutter carries the price axis, the bottom one the time axis. */
const INSET = { left: 2, right: 46, top: 8, bottom: 16 };
/** Plot rect, in viewBox units. Exported so the renderer never re-derives an inset. */
export const PLOT_X = INSET.left;
export const PLOT_Y = INSET.top;
export const PLOT_W = VIEW_W - INSET.left - INSET.right;
export const PLOT_H = VIEW_H - INSET.top - INSET.bottom;
const PLOT_BOX: ChartBox = { width: PLOT_W, height: PLOT_H, padding: 0.06 };

/** A one-candle series gets a slot as wide as the plot; cap the slab to a candle. */
const MAX_BODY = 26;
/** A flat bucket must still be a visible dash rather than nothing at all. */
const MIN_BODY = 2;
/** Impact triangle, smallest and largest, in viewBox units. */
const MARK_MIN = 3;
const MARK_MAX = 11;

/* ==== GUARDS ==== */

/** A number the renderer may safely put in a path. Everything else becomes `fallback`. */
export function finite(value: number, fallback: number): number {
  return Number.isFinite(value) ? value : fallback;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Drop any candle that cannot be drawn.
 *
 * A save written before the candle engine has `candles === undefined`; a save
 * written by another build can hold a hole. Filtering here lets the rest of the
 * module treat the series as drawable and the renderer treat it as the tape.
 */
export function safeSeries(candles: PriceCandle[] | undefined): PriceCandle[] {
  if (!Array.isArray(candles)) return [];
  return candles.filter((c) => !!c && [c.o, c.h, c.l, c.c, c.t].every((v) => Number.isFinite(v)));
}

/* ==== GEOMETRY ==== */

/** The frame, insets folded in, every coordinate clamped. */
export interface PlotScale {
  /** x centre of candle `i`, in viewBox units. */
  x(i: number): number;
  /** y of a price, inverted, in viewBox units. */
  y(price: number): number;
  bodyWidth: number;
  /** Top of the plot area, as a price. */
  max: number;
  /** Bottom of the plot area, as a price. */
  min: number;
  /**
   * Whether the base rule is inside the plot. False when the base has drifted
   * too far from this 40-second window to be a usable reference — the renderer
   * must then omit the rule rather than clamp it to an edge and imply a price
   * the tape never printed. See candleEngine's base-domain invariant.
   */
  baseOnScale: boolean;
}

/**
 * Frame a drawable series.
 *
 * @param candles   Already passed through `safeSeries`.
 * @param basePrice The issue price: anchor of the dashed rule, and the fallback
 *                  for a corrupt mark, so the frame always has one datum.
 */
export function plotScale(candles: PriceCandle[], basePrice: number): PlotScale {
  const base = finite(basePrice, 0);
  const inner = scaleSeries(candles, base, PLOT_BOX);
  // Clamp in view space, not price space, so a wildly out-of-domain price lands
  // on the frame edge instead of off-screen. See [Nothing Escapes The Frame].
  const cx = (v: number) => INSET.left + Math.min(Math.max(v, 0), PLOT_W);
  const cy = (v: number) => INSET.top + Math.min(Math.max(v, 0), PLOT_H);
  return {
    x: (i) => cx(inner.x(i)),
    y: (price) => cy(inner.y(finite(price, base))),
    bodyWidth: Math.min(inner.bodyWidth, MAX_BODY),
    max: inner.max,
    min: inner.min,
    baseOnScale: inner.baseOnScale,
  };
}

/** Percentage offsets, for the HTML axis labels that overlay the SVG. */
export const xPct = (x: number) => `${((x / VIEW_W) * 100).toFixed(2)}%`;
export const yPct = (y: number) => `${((y / VIEW_H) * 100).toFixed(2)}%`;
/** Where the price-axis gutter starts, as a percentage of the viewBox width. */
export const AXIS_GUTTER_PCT = xPct(INSET.left + PLOT_W);

export interface CandleShape {
  x: number;
  wickTop: number;
  wickBottom: number;
  bodyX: number;
  bodyW: number;
  bodyTop: number;
  bodyH: number;
  /** Closed at or above its open. A flat bucket counts as up, so never both. */
  up: boolean;
}

/** One candle as a rect and a line, in viewBox units. */
export function candleShape(candle: PriceCandle, scale: PlotScale, i: number): CandleShape {
  const x = scale.x(i);
  const yOpen = scale.y(candle.o);
  const yClose = scale.y(candle.c);
  const yHigh = scale.y(candle.h);
  const yLow = scale.y(candle.l);
  return {
    x,
    wickTop: Math.min(yHigh, yLow),
    wickBottom: Math.max(yHigh, yLow),
    bodyX: x - scale.bodyWidth / 2,
    bodyW: scale.bodyWidth,
    bodyTop: Math.min(yOpen, yClose),
    bodyH: Math.max(MIN_BODY, Math.abs(yOpen - yClose)),
    up: candle.c >= candle.o,
  };
}

/* ==== YAP IMPACT ==== */

export interface ImpactMark {
  /** Stable identity for animation. See `impactKey`. */
  key: string;
  index: number;
  /** Marker apex, in viewBox units. On the bucket's low for a crash, its high for a rally. */
  x: number;
  y: number;
  halfW: number;
  /** Triangle height, in viewBox units. Scales with the move's magnitude. */
  size: number;
  magnitude: number;
  /**
   * The move printed a HIGHER price — a walk-back clarification, not a YAP crash.
   * Decides the colour, the arrow, the anchor and the chip's verb.
   */
  up: boolean;
  /** Measured excursion from the open, in the direction of the move, 0..1. */
  movePct: number;
  /** Whole seconds between this bucket's open and the newest bucket's. */
  ageSeconds: number;
}

/**
 * Identity of one player move, for the question "has a NEW move landed?".
 *
 * INVARIANT: [The Trigger Is The Engine's Bucket, Not The Render]
 * The store ticks at 10Hz and `accumulateCandle` returns a NEW array every print,
 * so array identity and every candle's `c` change ten times a second; a flash
 * keyed on either re-fires forever — a strobe across the exact pane the player
 * reads a fill off. `t` is the bucket's open stamp, moves only when a 2s bucket
 * closes, and is therefore stable for the whole life of one move. Magnitude
 * rides along because `markPlayerMove` keeps the max of a repeat stamp, so a
 * bump is a SECOND, larger move and must land its own impact. Direction is in
 * the key for the same reason: a crash and its clarification inside one bucket
 * keep the max magnitude but the direction is overwritten, so without it the
 * clarification would inherit the crash's key and the green flash would never
 * play.
 */
export function impactKey(candle: PriceCandle): string {
  return `${candle.t}|${clamp01(finite(candle.playerMoveMagnitude ?? 0, 0)).toFixed(3)}|${candle.playerMoveDirection ?? 0}`;
}

/**
 * The worst excursion inside a bucket as a fraction of its open, measured in the
 * direction the move went. The extreme, not the close: a YAP can print the low
 * and bounce inside the same two seconds, and the player still took that hit.
 *
 * INVARIANT: [Signed By Direction, So A Rally Is Not A Zero Percent Crash]
 * The excursion floor comes from `l` for a crash and from `h` for a rally.
 * Reading the low unconditionally measured every clarification at ~0%, so the
 * chip printed "YAP -0%" on a green candle at the moment the player's pump
 * paid off — the one figure on screen that made the causal loop look broken.
 */
function measuredMove(candle: PriceCandle, up: boolean): number {
  if (!(candle.o > 0)) return 0;
  return up
    ? clamp01((Math.max(candle.c, candle.h) - candle.o) / candle.o)
    : clamp01((candle.o - Math.min(candle.c, candle.l)) / candle.o);
}

/** Every player-caused impact in the window, oldest first. */
export function impactMarks(candles: PriceCandle[], scale: PlotScale): ImpactMark[] {
  const newestT = candles.length ? candles[candles.length - 1].t : 0;
  const marks: ImpactMark[] = [];
  candles.forEach((c, i) => {
    if (c.playerMove !== true) return;
    const magnitude = clamp01(finite(c.playerMoveMagnitude ?? 0, 0));
    // Direction is READ, not derived. See [The Engine Records The Direction].
    // `c` vs `o` is the bucket's own net change, which is NOT the player's move
    // when a crash and its clarification share a 2s bucket: the rally prints
    // higher yet the bucket still closes under the pre-crash open, so a
    // body-derived direction labelled the player's successful squeeze as
    // "YAP -65%" and drew a red down-arrow on the only move that goes up.
    // A legacy or hand-edited mark with no direction falls back to the body.
    const up = c.playerMoveDirection === undefined ? c.c >= c.o : c.playerMoveDirection === 1;
    marks.push({
      key: impactKey(c),
      index: i,
      x: scale.x(i),
      y: scale.y(up ? c.h : c.l),
      halfW: Math.max(2.5, scale.bodyWidth * 0.8),
      size: MARK_MIN + (MARK_MAX - MARK_MIN) * magnitude,
      magnitude,
      up,
      movePct: measuredMove(c, up),
      ageSeconds: Math.max(0, Math.round((newestT - c.t) / 1000)),
    });
  });
  return marks;
}

/** The most recent impact anywhere in the window, or null. The chip quotes this. */
export function newestImpact(marks: ImpactMark[]): ImpactMark | null {
  return marks.length ? marks[marks.length - 1] : null;
}

/**
 * The impact on the bucket CURRENTLY FORMING, or null.
 *
 * INVARIANT: [Only The Live Bucket Can Have Just Moved]
 * `markPlayerMove` stamps the newest bucket, so a move the player just caused is
 * always on the last candle. Gating the animation trigger on that is what makes
 * it immune to the window sliding: 40 seconds later the oldest scar rolls off,
 * `newestImpact` would fall back to the SECOND impact, and a newest-keyed trigger
 * would replay that second bloom for no reason. The live-bucket gate means the
 * key only ever changes because something happened.
 */
export function landedImpact(candles: PriceCandle[], scale: PlotScale): ImpactMark | null {
  if (candles.length === 0) return null;
  const lastIndex = candles.length - 1;
  return impactMarks(candles, scale).find((m) => m.index === lastIndex) ?? null;
}
