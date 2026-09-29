/**
 * PriceChart — the payoff moment, rendered.
 *
 * WHY THIS EXISTS
 * `UI_DESIGN_SPECIFICATION` §4.2 and `FEATURE_ROADMAP` Phase 2 both promised a
 * live S&Pain 500 mini candle chart. `priceHistory` was written by three engines
 * and read by zero components, so the game shipped as a filing cabinet: the
 * player shorts a PUT, fires a 3:00 AM YAP, and the sector they just nuked never
 * visibly goes red. This is that missing frame.
 *
 * INVARIANT: [A Candle Is A Record, Not A Reconstruction]
 * Nothing here invents geometry. `chartHaptics` frames the series through
 * `candleEngine.scaleSeries`, the body is the bucket's real open-to-close, the
 * wick is its real high-to-low, and the impact marker is drawn only on a candle
 * the engine stamped with `playerMove: true`. A gap in the tape is a gap on screen.
 *
 * INVARIANT: [Reduced Motion Still Sees The Scar]
 * The flash is the only moving part and it is decorative — it decays to nothing.
 * The severity-sized marker, the header chip and the accessible name are static,
 * so a `prefers-reduced-motion` player sees the same event without the 250ms
 * bloom. The two global reduced-motion blocks in `index.css` already clamp
 * `animation-duration`, so the new keyframes need no block of their own.
 *
 * INVARIANT: [The Chart Never Forces A Scrollbar]
 * The plot wrapper pins an ASPECT RATIO, not a height, so height follows the width
 * the pane hands it. At the 1280x720 floor the chart shrinks with the wing instead
 * of pushing the watchlist out of an `overflow-hidden` cockpit.
 */

import React, { useEffect, useRef, useState } from 'react';
import type { PriceCandle } from '../../types/market';
import { Card } from '../ui/Card';
import { hint } from '../ui/hint';
import {
  AXIS_GUTTER_PCT,
  PLOT_H,
  PLOT_W,
  PLOT_X,
  PLOT_Y,
  VIEW_H,
  VIEW_W,
  candleShape,
  finite,
  impactMarks,
  landedImpact,
  plotScale,
  safeSeries,
  yPct,
} from './chartHaptics';
import { axisLabels, chartHint, deltaLabel, describeChart, impactChip, timeAxis } from './chartCopy';

export interface PriceChartProps {
  /**
   * Time-bucketed OHLC for the selected ticker, oldest first, straight off
   * `StockDefinition.candles`. `undefined` on a save written before the candle
   * engine existed — the empty state, not a crash.
   */
  candles: PriceCandle[] | undefined;
  /** The issue price. The dashed rule and the up/down read are both measured from it. */
  basePrice: number;
  /**
   * The live mark, passed in rather than read off the last candle ON PURPOSE: the
   * last candle closes on the final print inside a 2s bucket and can trail the
   * tape by up to two seconds of movement.
   */
  currentPrice: number;
  /** Ticker, for the header chip and the accessible name. */
  symbol: string;
  /** Extra classes for the outer Card, so the mounting pane owns the flex slot. */
  className?: string;
}

/**
 * One impact triangle, pointing AT the price the move reached.
 *
 * A crash hangs below its bucket's low and points down at it; a clarification
 * sits above its high and points up. One shape, flipped by sign, so the arrow can
 * never contradict the candle body drawn directly beneath it.
 */
function impactPath(x: number, y: number, halfW: number, size: number, up: boolean): string {
  const left = (x - halfW).toFixed(2);
  const right = (x + halfW).toFixed(2);
  const far = (y + (up ? size : -size)).toFixed(2);
  return `M ${left} ${far} L ${x.toFixed(2)} ${y.toFixed(2)} L ${right} ${far} Z`;
}

export const PriceChart: React.FC<PriceChartProps> = ({
  candles,
  basePrice,
  currentPrice,
  symbol,
  className = '',
}) => {
  // Everything below reads a FILTERED series, so a corrupt save degrades to a
  // shorter chart rather than to a NaN path. See [Nothing Escapes The Frame].
  const series = safeSeries(candles);
  const base = finite(basePrice, 0);
  const mark = finite(currentPrice, base);
  const scale = plotScale(series, base);
  const marks = impactMarks(series, scale);
  const axis = axisLabels(scale, base);
  const time = timeAxis(series);
  const delta = deltaLabel(mark, base);
  const chip = impactChip(marks);
  const hasTape = series.length > 0;

  // INVARIANT: [The Flash Fires Once Per Crash, Not Once Per Render]
  // The store repaints at 10Hz and hands this component a brand-new candle array
  // every print. The identity below is the SCARRED BUCKET'S OWN stamp plus its
  // severity (see `impactKey`), and `landedImpact` only answers for the bucket
  // currently forming — the one the engine stamped. So the key is stable across
  // the ~20 prints that land inside one bucket, it survives a legacy 40-second
  // window sliding under the chart, and it changes only when a YAP actually hit.
  // There is no nonce, so nothing here can tick.
  const landedKey = landedImpact(series, scale)?.key ?? null;
  const [flashKey, setFlashKey] = useState<string | null>(null);
  // Seeded with the current key on mount, so mounting mid-crash — switching back
  // to a ticker whose live bucket is already scarred — does not replay a bloom
  // for an event the player did not just cause.
  const seenKey = useRef<string | null>(landedKey);
  useEffect(() => {
    if (landedKey === null || landedKey === seenKey.current) return;
    seenKey.current = landedKey;
    setFlashKey(landedKey);
  }, [landedKey]);

  return (
    <Card material="term" density="flush" className={`shrink-0 ${className}`}>
      {/* Header: whose tape this is, the live mark, and the last YAP that hit it. */}
      <div className="flex items-end justify-between gap-2 px-2 pt-1.5">
        <div className="min-w-0">
          <span className="block t-micro font-mono font-bold text-phosphor-300">${symbol} TAPE</span>
          <span className="block t-caption font-mono text-phosphor-600">
            {hasTape ? `${time.windowSeconds}s WINDOW // ${time.tape}` : 'AWAITING FIRST PRINT'}
          </span>
        </div>
        <div className="shrink-0 text-right">
          <span className="block t-body font-mono font-bold text-gold-400">${mark.toFixed(2)}</span>
          <span className={`block t-caption font-mono ${delta.up ? 'text-emerald-400' : 'text-red-400'}`}>
            {delta.text} VS BASE
          </span>
        </div>
      </div>

      {/* The plot. The wrapper pins the aspect ratio so height follows width. */}
      <div
        className="relative mx-2 mt-1 aspect-[8/3]"
        {...hint(chartHint(symbol, series, mark, base, marks, scale.baseOnScale))}
      >
        <svg
          viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label={describeChart(symbol, series, mark, base, marks)}
        >
          {/* The base rule. Dashed, so it never reads as a plotted price, and
              OMITTED when the base has drifted out of the window's range: there
              is no honest y to draw it at, and clamping it to an edge would put
              a line across the frame implying a price the plot excludes. The
              drift is still stated in the header and the hover copy. */}
          {scale.baseOnScale && (
            <line
              x1={PLOT_X}
              x2={PLOT_X + PLOT_W}
              y1={scale.y(base)}
              y2={scale.y(base)}
              stroke="rgb(245 158 11 / 0.75)"
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          )}

          {hasTape ? (
            <>
              {series.map((c, i) => {
                const s = candleShape(c, scale, i);
                return (
                  <g key={c.t}>
                    <line
                      x1={s.x}
                      x2={s.x}
                      y1={s.wickTop}
                      y2={s.wickBottom}
                      stroke={s.up ? 'rgb(74 222 128)' : 'rgb(248 113 113)'}
                      strokeWidth={1.25}
                      vectorEffect="non-scaling-stroke"
                    />
                    <rect
                      x={s.bodyX}
                      y={s.bodyTop}
                      width={s.bodyW}
                      height={s.bodyH}
                      fill={s.up ? 'rgb(34 197 94 / 0.85)' : 'rgb(220 38 38 / 0.9)'}
                    />
                  </g>
                );
              })}
              {marks.map((m) => {
                const fresh = m.key === flashKey;
                // INVARIANT: [The Flash Takes The Move's Colour]
                // Green here, not red: a clarification is the one moment the game
                // deliberately pushes a price UP, and a red bloom over it would
                // tell the player their recovery was a crash. The CSS keyframe is
                // the same — only the fill differs.
                const flash = m.up ? 'rgb(74 222 128)' : 'rgb(239 68 68)';
                const halo = m.up ? 'rgb(52 211 153 / 0.25)' : 'rgb(248 113 113 / 0.25)';
                const tip = m.up ? 'rgb(110 231 183)' : 'rgb(252 165 165)';
                return (
                  <g key={m.key} className={fresh ? 'chart-impact-fresh' : undefined}>
                    {fresh && (
                      <rect
                        className="chart-impact-flash"
                        x={m.x - scale.bodyWidth * 1.1}
                        y={PLOT_Y}
                        width={scale.bodyWidth * 2.2}
                        height={PLOT_H}
                        fill={flash}
                      />
                    )}
                    <path d={impactPath(m.x, m.y, m.halfW * 1.5, m.size * 1.7, m.up)} fill={halo} />
                    <path d={impactPath(m.x, m.y, m.halfW, m.size, m.up)} fill={tip} />
                  </g>
                );
              })}
            </>
          ) : (
            /* INVARIANT: [No Data Is Stated, Not Implied]
               A legacy save carries no candles, and an empty frame with a lone
               dashed rule in it would read as "the price has not moved" — which
               is a claim about the market. Say plainly that the tape never started. */
            <rect
              x={PLOT_X}
              y={PLOT_Y}
              width={PLOT_W}
              height={PLOT_H}
              fill="none"
              stroke="rgb(22 163 74 / 0.45)"
              strokeWidth={1}
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
          )}
        </svg>

        {/* Price axis, overlaid as HTML so it uses the t-caption tier and never
            stretches with the viewBox. Positioned off the frame percentage so it
            scales with the plot. */}
        {hasTape
          ? axis.map((label, i) => (
              <span
                key={i}
                style={{ left: AXIS_GUTTER_PCT, top: yPct(label.y) }}
                className={`absolute -translate-y-1/2 whitespace-nowrap t-caption font-mono ${
                  label.tone === 'base' ? 'text-gold-400' : 'text-phosphor-600'
                }`}
              >
                {label.text}
              </span>
            ))
          : null}
        {!hasTape && (
          <span
            style={{ left: AXIS_GUTTER_PCT, width: `calc(100% - ${AXIS_GUTTER_PCT})` }}
            className="absolute inset-y-0 flex items-center justify-center t-caption font-mono text-phosphor-600"
          >
            NO PRINTS ON THE TAPE
          </span>
        )}
      </div>

      {/* Time axis, in seconds. See [The Window Must Not Read As A Day]. */}
      <div className="flex items-center justify-between gap-2 px-2 py-1">
        <span className="t-caption font-mono text-phosphor-600">{hasTape ? time.left : 'NO TAPE'}</span>
        {/* Duplicates the accessible name's impact clause, so it is painted for the
            eye and not announced twice. The severity and excursion live in the tooltip. */}
        <span
          aria-hidden
          className={`truncate t-caption font-mono ${
            chip.tone === 'crash'
              ? 'font-bold text-red-400'
              : chip.tone === 'rally'
                ? 'font-bold text-emerald-400'
                : 'text-phosphor-600'
          }`}
        >
          {chip.text}
        </span>
        <span className="t-caption font-mono text-phosphor-600">{hasTape ? 'NOW' : ''}</span>
      </div>
    </Card>
  );
};
