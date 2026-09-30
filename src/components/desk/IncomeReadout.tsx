/**
 * IncomeReadout — the cockpit's `$X/s`, its source breakdown, and the two
 * countdowns the game is built around.
 *
 * WHY THIS EXISTS [Finding D, and the frenzy DoD]
 * The plan's finding D is blunt: `tariffRevenuePerSecond` appears in exactly two
 * components, both behind a channel sealed until Phase 2, so *"the player cannot
 * see their income, what scales it, or what a dial bought them."* Meanwhile the
 * 20-second CAPS LOCK FRENZY — the best burst in the game — shows its remaining
 * time as `18s` in a 10.5px caption, and the 8-second walk-back window shows a
 * number in a strip. Three of the game's most consequential timers were all
 * rendering as small text in corners of a pane.
 *
 * INVARIANT: [Every Rate Here Is Computed, Never Typed]
 * All three income rows come from `readIncomeBreakdown`, which derives them from
 * the same engine constants the tick charges. The autopen row in particular is
 * flat BY DESIGN — it ignores the Slips multiplier and the Tungsten Nib — and
 * multiplying it by the click yield for display would overstate the upgrade by up
 * to 20x for a late-game player.
 *
 * INVARIANT: [A Dormant Source Is Named, Not Hidden]
 * Every source renders even at $0.00, with the reason it is dormant. A row that
 * only appears once it pays teaches the player nothing about the lever they are
 * supposed to pull, and a bare `0.00` reads as a bug rather than a decision.
 *
 * INVARIANT: [This Panel Is On A Zero-Scroll Desk, So Its Height Is A Budget]
 * The first version of this component was three stacked rows under a 22px
 * headline, 125px tall — and the centre desk has no scrollbar, so those 125px
 * came straight out of the rubber stamp. `ClickerButton` now sizes itself to
 * whatever the desk column leaves it, which is correct engineering and a brutal
 * feedback mechanism: the readout was quietly costing the hero object 60% of its
 * height, and nothing errored.
 *
 * So this is two lines and a pair of dials, ~62px. The breakdown survives that
 * squeeze as INLINE CHIPS rather than by moving into the tooltips — the plan
 * asked for a visible breakdown, and hiding the three rates in hover text would
 * satisfy the letter of that while restoring the exact defect it was filed
 * against. The per-source prose lives in each chip's hint, where there is room
 * for it.
 */

import React from 'react';
import { TrendingUp, Zap, Building2, Landmark } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import {
  FRENZY_CLICK_MULTIPLIER,
  FRENZY_DURATION_SECONDS,
  WALK_BACK_PUMP_MULTIPLIER,
  WALK_BACK_WINDOW_SECONDS,
} from '../../constants/balance';
import { Card } from '../ui/Card';
import { hint } from '../ui/hint';
import { readIncomeBreakdown, type IncomeSource } from './incomeBreakdown';

/** Short chip labels. The long form is in the chip's hint. */
const SOURCE_CHIP: Record<IncomeSource['id'], { short: string; icon: React.ReactNode }> = {
  agency: { short: 'AGENCY', icon: <Building2 className="w-2.5 h-2.5 shrink-0" aria-hidden /> },
  autopen: { short: 'AUTOPEN', icon: <Zap className="w-2.5 h-2.5 shrink-0" aria-hidden /> },
  tariff: { short: 'DUTY', icon: <Landmark className="w-2.5 h-2.5 shrink-0" aria-hidden /> },
};

export const IncomeReadout: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const passiveCashPerSecond = useGameStore((s) => s.passiveCashPerSecond);
  const tariffRevenuePerSecond = useGameStore((s) => s.tariffRevenuePerSecond);
  const tariffRates = useGameStore((s) => s.tariffRates);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);
  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);
  const capsFrenzySecondsRemaining = useGameStore((s) => s.capsFrenzySecondsRemaining);
  const isWalkBackWindowActive = useGameStore((s) => s.isWalkBackWindowActive);
  const walkBackSecondsRemaining = useGameStore((s) => s.walkBackSecondsRemaining);

  const activeTariffCount = Object.values(tariffRates || {}).filter((r) => r > 0).length;
  const breakdown = readIncomeBreakdown({
    phase,
    passiveCashPerSecond,
    tariffRevenuePerSecond,
    hasAutopenArmy: activeUpgrades.includes('autopen_army'),
    activeTariffCount,
  });

  // INVARIANT: [A Dial Is A Countdown, Not A Decoration]
  // Each ring is a `conic-gradient` sweep whose proportion IS the remaining
  // fraction, so the visual and the number cannot disagree — and a
  // reduced-motion player, whose global block collapses transitions, still reads
  // the number in the middle. Motion is the dispensable half; the seconds are
  // the content.
  const clamp = (n: number) => Math.max(0, Math.min(1, n));
  const frenzyFraction = isCapsFrenzy ? clamp(capsFrenzySecondsRemaining / FRENZY_DURATION_SECONDS) : 0;
  const walkFraction = isWalkBackWindowActive
    ? clamp(walkBackSecondsRemaining / WALK_BACK_WINDOW_SECONDS)
    : 0;

  return (
    <Card material="sheet" density="tight" className="shrink-0 !p-1.5">
      <div className="flex items-center gap-2">
        {/* ---- The headline and the breakdown, as one two-line block ---- */}
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <TrendingUp className="w-3 h-3 text-accent-ink shrink-0 self-center" aria-hidden />
            <span className="t-micro font-mono text-ink-3">PASSIVE INCOME</span>
            <span
              {...hint(
                `${formatCurrency(breakdown.totalPerSecond)} a second, banked whether or not you touch the desk. ` +
                  `The three chips are every source the simulation pays — there is no fourth. ` +
                  (breakdown.largestId
                    ? `Most of it right now is ${
                        breakdown.sources.find((s) => s.id === breakdown.largestId)?.label
                      }, which is also the one to scale.`
                    : 'Nothing is paying yet. The tariff dials are the one source that keeps paying with the tab shut, and every one of them starts at zero on every run.')
              )}
              className={`font-mono font-black leading-none ml-auto ${
                breakdown.totalPerSecond > 0 ? 'text-live-ink' : 'text-ink-3'
              }`}
              style={{ fontSize: 'calc(19px / var(--viewport-scale, 1))' }}
            >
              {formatCurrency(breakdown.totalPerSecond)}/s
            </span>
          </div>

          {/* The three rates, always all three. */}
          <div className="mt-0.5 flex items-center gap-1.5">
            {breakdown.sources.map((src) => (
              <span
                key={src.id}
                {...hint(
                  src.dormantBecause
                    ? `${src.label} is paying nothing. ${src.dormantBecause}`
                    : `${src.label} pays ${formatCurrency(src.perSecond)} a second. ${
                        src.id === 'autopen'
                          ? 'A flat rate: it ignores your Slips and your Tungsten Nib, which is why it is listed separately from agency income rather than folded into a click yield.'
                          : src.id === 'tariff'
                          ? 'Bilateral export duty. This is the one faucet that pays with the tab shut, up to the 48-hour cap.'
                          : 'The multiplier every liquidated agency applies to the run. Reset by a Chapter 11 filing unless the Golden Parachute is owned.'
                    }`,
                  `${src.label}, ${formatCurrency(src.perSecond)} per second`
                )}
                /* INVARIANT: [A Dormant Rate Is The One You Must Read]
                   This branch renders at `t-caption` — 9.5px — on `surface-sheet`
                   (`newsprint-100` `#ece4d0`). Measured: `newsprint-400` is
                   **2.19:1**, i.e. below WCAG AA for body text with no
                   large-text exemption, and it shipped that way in Phase 2.5.

                   That is the wrong way round. A dormant source is precisely the
                   one the player needs to act on — it is the lever they have not
                   pulled yet — so it is the row that must be legible, not the one
                   that can be faded out. `newsprint-800` is **7.91:1**.

                   Note the obvious fix is a trap: `newsprint-600` measures
                   **1.19:1** here, i.e. WORSE, and it is a dead token besides
                   (`@theme` has no 600 step), so it would render as nothing.

                   The live branch is `text-accent-ink`, also dead, so it inherits
                   `newsprint-800` at 8.5:1 — accidentally correct today and
                   silently correct. It is routed properly in the dead-token
                   pass, not here, so this file's fix stays one concern. */
                className={`flex items-center gap-0.5 font-mono t-caption font-bold leading-none ${
                  src.perSecond > 0 ? 'text-accent-ink' : 'text-ink-3'
                }`}
              >
                {SOURCE_CHIP[src.id].icon}
                {formatCurrency(src.perSecond)}
              </span>
            ))}
          </div>
        </div>

        {/* ---- The two countdowns ----
            Both are always mounted so the cockpit's shape never jumps, and both
            are inert (dimmed, zeroed) when inactive. A panel that appears and
            disappears moves everything below it. */}
        <FrenzyDial
          fraction={frenzyFraction}
          seconds={capsFrenzySecondsRemaining}
          active={isCapsFrenzy}
        />
        <WalkBackDial
          fraction={walkFraction}
          seconds={walkBackSecondsRemaining}
          active={isWalkBackWindowActive}
        />
      </div>
    </Card>
  );
};

/** A countdown as a large number inside a sweeping ring. Shared by both dials. */
const CountdownDial: React.FC<{
  fraction: number;
  seconds: number;
  active: boolean;
  label: string;
  activeColor: string;
  idleColor: string;
  ringTrack: string;
  activeHint: string;
  idleHint: string;
}> = ({
  fraction,
  seconds,
  active,
  label,
  activeColor,
  idleColor,
  ringTrack,
  activeHint,
  idleHint,
}) => (
  <div
    {...hint(active ? activeHint : idleHint, `${label} countdown`)}
    className="shrink-0 text-center"
    role="timer"
    /* INVARIANT: [A Ticking Countdown Must Not Interrupt A Screen Reader]
       `aria-live="off"` is deliberate. These update four times a second during a
       frenzy, and a polite live region on a 4Hz counter is an unusable stream of
       speech. The value is still reachable — it is text — and the transition
       INTO the frenzy is announced by the feedback layer, which changes state
       once rather than continuously. */
    aria-live="off"
  >
    <div
      className="rounded-full p-[2px] grid place-items-center"
      style={{
        width: 'calc(40px / var(--viewport-scale, 1))',
        height: 'calc(40px / var(--viewport-scale, 1))',
        background: active
          ? `conic-gradient(${ringTrack} ${fraction * 360}deg, rgba(90,70,40,0.25) 0deg)`
          : 'rgba(90,70,40,0.18)',
        transition: 'background 120ms linear',
      }}
    >
      <div
        className={`rounded-full grid place-items-center w-full h-full font-mono font-black ${
          active ? 'bg-card' : 'bg-card'
        }`}
        style={{ color: active ? activeColor : idleColor }}
      >
        <span
          style={{ fontSize: 'calc(14px / var(--viewport-scale, 1))' }}
          className="leading-none"
        >
          {active ? Math.ceil(seconds) : '--'}
        </span>
      </div>
    </div>
    <span
      className="block t-caption font-mono leading-none mt-0.5"
      style={{ color: active ? activeColor : idleColor, fontSize: 'calc(8px / var(--viewport-scale, 1))' }}
    >
      {label}
    </span>
  </div>
);

const FrenzyDial: React.FC<{ fraction: number; seconds: number; active: boolean }> = ({
  fraction,
  seconds,
  active,
}) => (
  <CountdownDial
    fraction={fraction}
    seconds={seconds}
    active={active}
    label="FRENZY"
    activeColor="var(--color-wax-600)"
    idleColor="var(--color-newsprint-400)"
    ringTrack="var(--color-panic-600)"
    activeHint={`CAPS LOCK FRENZY — ${FRENZY_CLICK_MULTIPLIER}x click yield for ${Math.ceil(
      seconds
    )} more seconds. The ring is the time remaining.`
      }
    idleHint={`CAPS LOCK FRENZY. Fill the tantrum meter to 100% for ${FRENZY_CLICK_MULTIPLIER}x yield over ${FRENZY_DURATION_SECONDS} seconds. Inert now.`}
  />
);

const WalkBackDial: React.FC<{ fraction: number; seconds: number; active: boolean }> = ({
  fraction,
  seconds,
  active,
}) => (
  <CountdownDial
    fraction={fraction}
    seconds={seconds}
    active={active}
    label="WALK-BACK"
    activeColor="var(--color-phosphor-600)"
    idleColor="var(--color-newsprint-400)"
    ringTrack="var(--color-phosphor-500)"
    activeHint={`CLARIFICATION WINDOW — ${Math.ceil(seconds)}s to arm a matching CALL on the crashed ticker and walk the YAP back for a ${Math.round(
      (WALK_BACK_PUMP_MULTIPLIER - 1) * 100
    )}% recovery rally. This is the only genuinely timed skill expression in the game.`}
    idleHint={`WALK-BACK WINDOW. Fires for ${WALK_BACK_WINDOW_SECONDS} seconds after a YAP lands. Inert now.`}
  />
);
