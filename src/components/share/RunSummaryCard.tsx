/**
 * RunSummaryCard — the end-of-run "Certificate of Structural Damage".
 *
 * DESIGN RATIONALE:
 * Incremental games live or die on the reset. The original prestige flow
 * executed a reset and showed nothing: no record of what the run accomplished,
 * no proof of progress, and no artifact to post. Players who prestige without
 * seeing a summary frequently fail to prestige at all, because the reset feels
 * like a punishment rather than a promotion.
 *
 * The snapshot helpers live in `runSummary.ts` so that this module exports only
 * a component, which keeps React Fast Refresh working during development.
 */

import React, { useState, useCallback } from 'react';
import { ScrollText } from 'lucide-react';
import { Card, CardHeader } from '../ui';
import { renderDecreeCard, downloadBlob } from './decreeCard';
import { snapshotToCardData, type RunSnapshot } from './runSummary';

export const RunSummaryCard: React.FC<{
  snapshot: RunSnapshot;
  onDismiss: () => void;
}> = ({ snapshot, onDismiss }) => {
  const [busy, setBusy] = useState(false);

  const handleExport = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const blob = await renderDecreeCard(snapshotToCardData(snapshot));
      if (blob) downloadBlob(blob, `executive-degen-run-${snapshot.flightCount}.png`);
    } finally {
      setBusy(false);
    }
  }, [busy, snapshot]);

  return (
    <Card material="paper" className="relative">
      <div className="absolute -top-1 right-2 rotate-6 border-2 border-wax-500/70 px-1.5 py-0.5">
        <span className="t-caption font-black tracking-widest text-wax-500 uppercase">Sealed</span>
      </div>

      <CardHeader
        title="Certificate of Structural Damage"
        icon={<ScrollText className="w-3.5 h-3.5 text-wax-500" />}
        right={
          <button
            onClick={onDismiss}
            className="t-caption font-mono text-newsprint-800 hover:bg-newsprint-300/40 px-1 rounded"
          >
            Dismiss
          </button>
        }
      />

      <p className="t-caption text-newsprint-800 leading-relaxed mb-2 font-medium">
        Flight No. {snapshot.flightCount} is complete. The bearer caused{' '}
        <strong className="text-wax-500">{snapshot.lifetimeCash}</strong> in documented
        structural damage and earned <strong className="text-wax-500">{snapshot.sisAwarded} SIS</strong>.
      </p>

      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 rule-print pt-2">
        {[
          ['Peak Treasury', snapshot.treasury],
          ['Options Profit', snapshot.optionsProfit],
          ['Stamp Slams', snapshot.clicks.toLocaleString()],
          ['Frenzies', String(snapshot.frenzies)],
        ].map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-1">
            <span className="t-caption text-newsprint-800/80 uppercase">{label}</span>
            <span className="t-micro font-mono font-black text-newsprint-900">{value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={handleExport}
        disabled={busy}
        className="mt-2.5 w-full t-micro font-mono font-black uppercase tracking-widest py-1.5 rounded bg-newsprint-900 text-newsprint-50 hover:bg-wax-500 disabled:opacity-60 transition-colors"
      >
        {busy ? 'Stamping…' : 'Export Certificate (9:16 PNG)'}
      </button>
    </Card>
  );
};
