/**
 * Run summary data — pure functions, no React.
 *
 * Separated from `RunSummaryCard.tsx` so that file only exports a component.
 * Co-locating helpers with a component breaks Vite's React Fast Refresh: editing
 * the component would invalidate unrelated modules and force a full reload on
 * every save during development.
 *
 * INVARIANT: `captureRunSnapshot` MUST be called BEFORE `executeFlightToCaymans`
 * mutates state. Every field it reads is zeroed by the prestige reset, so
 * reading afterwards yields an empty record of the run the player just finished.
 */

import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import type { DecreeCardData } from './decreeCard';

export interface RunSnapshot {
  readonly treasury: string;
  readonly lifetimeCash: string;
  readonly optionsProfit: string;
  readonly clicks: number;
  readonly yapsAndCrises: number;
  readonly frenzies: number;
  readonly sisAwarded: number;
  readonly flightCount: number;
}

/** Reads the current run's defining numbers. Call BEFORE resetting. */
export function captureRunSnapshot(sisAwarded: number): RunSnapshot {
  const s = useGameStore.getState();
  return {
    treasury: formatCurrency(s.treasuryCash),
    lifetimeCash: formatCurrency(s.lifetimeCashEarned),
    optionsProfit: formatCurrency(s.lifetimeOptionsProfit),
    clicks: s.totalClicks,
    yapsAndCrises: s.totalCrisesAnswered,
    frenzies: s.totalFrenziesTriggered,
    sisAwarded,
    flightCount: s.flightToCaymansCount + 1,
  };
}

/** Maps a run snapshot onto the shareable certificate layout. */
export function snapshotToCardData(snap: RunSnapshot): DecreeCardData {
  return {
    title: 'Certificate of Structural Damage',
    body:
      'The bearer of this document is hereby certified as having caused measurable, ' +
      'documented harm to the global economy, the rules-based international order, and ' +
      'the concept of a normal Tuesday. Presented without apology.',
    phaseLabel: `FLIGHT TO THE CAYMANS No. ${snap.flightCount}`,
    accent: 'gold',
    stats: [
      { label: 'Peak Treasury', value: snap.treasury },
      { label: 'Lifetime Confiscations', value: snap.lifetimeCash },
      { label: 'Options Profit', value: snap.optionsProfit },
      { label: 'Sovereign Immunity Slips', value: `${snap.sisAwarded} SIS` },
      { label: 'Stamp Slams', value: snap.clicks.toLocaleString() },
      { label: 'CAPS LOCK Frenzies', value: String(snap.frenzies) },
    ],
  };
}
