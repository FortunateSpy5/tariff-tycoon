/**
 * CertificateExporter — the button that turns game state into a PNG.
 *
 * Wraps any child in a click target that renders the current career as a 9:16
 * decree certificate and downloads it. Rendered as a wrapper (not a self-closing
 * button) so it can wrap a rich <Card> trigger without nesting interactive
 * elements, which keeps the markup accessible.
 *
 * It also copies a short caption to the clipboard so posting the image has a
 * ready-made line of satire attached — the difference between a card people post
 * and a card people forget in their camera roll.
 */

import React, { useState, useCallback } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import { decreeDataFromYap, downloadBlob, renderDecreeCard } from './decreeCard';

const PHASE_LABEL: Record<number, string> = {
  1: 'PHASE 1 // THE CUSTOMS DESK',
  2: 'PHASE 2 // THE OVAL SYNDICATE',
  3: 'PHASE 3 // FORTRESS AMERICA',
  4: 'PHASE 4 // ONTOLOGICAL',
};

export const CertificateExporter: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [busy, setBusy] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const phase = useGameStore((s) => s.phase);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const cronyFavor = useGameStore((s) => s.cronyFavor);
  const slopSuspicion = useGameStore((s) => s.slopSuspicion);
  const lastYapPost = useGameStore((s) => s.lastYapPost);

  const handleExport = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setFlash(null);
    try {
      const data = decreeDataFromYap(lastYapPost, {
        treasuryLabel: formatCurrency(treasuryCash),
        phaseLabel: PHASE_LABEL[phase] ?? PHASE_LABEL[1],
        cronyFavor,
        suspicionLabel: `${Math.round(slopSuspicion)}%`,
      });

      const blob = await renderDecreeCard(data);
      if (!blob) {
        setFlash('Canvas unavailable in this browser.');
        return;
      }

      const stamp = new Date().toISOString().slice(0, 10);
      downloadBlob(blob, `executive-degen-decree-${stamp}.png`);

      // Best-effort caption. Clipboard access can be denied; never let it throw
      // out of the handler and strand the player on a stuck "working" state.
      const caption = lastYapPost?.rawText
        ? `"${lastYapPost.rawText.slice(0, 180)}" — I signed this at 3AM.`
        : `Treasury at ${formatCurrency(treasuryCash)}. I did this.`;
      try {
        await navigator.clipboard.writeText(caption);
        setFlash('Decree exported. Caption copied to clipboard.');
      } catch {
        setFlash('Decree exported to your downloads.');
      }
    } finally {
      setBusy(false);
      setTimeout(() => setFlash(null), 4000);
    }
  }, [busy, cronyFavor, lastYapPost, phase, slopSuspicion, treasuryCash]);

  return (
    <>
      {/* C3 [Focus Audit]
          This wraps a rich <Card> in a real <button>, which is correct: it keeps
          one tab stop, one accessible name, and native Enter/Space activation
          without nesting interactive elements. The previous focus treatment was
          the problem — the global `:focus-visible` outline drew around the
          button's own box, but the button has no visible bounds of its own, so
          keyboard users saw a ring floating in space around a card that gave no
          indication it was focused. The arbitrary variant forwards focus to the
          child card so the surface that looks interactive is the one that lights
          up. Do not "simplify" this back to a bare outline. */}
      <button
        onClick={handleExport}
        disabled={busy}
        aria-label="Export a shareable 9:16 executive decree certificate as a PNG"
        className="w-full text-left disabled:opacity-60 disabled:cursor-wait transition-opacity
                   focus:outline-none
                   focus-visible:[&>div]:ring-2 focus-visible:[&>div]:ring-gold-500
                   focus-visible:[&>div]:ring-offset-2 focus-visible:[&>div]:ring-offset-newsprint-950
                   focus-visible:[&>div]:border-gold-500"
      >
        {busy ? (
          <div className="surface-newsprint border border-newsprint-300 rounded-lg p-2.5 flex items-center gap-2">
            <span className="t-micro font-mono font-black tracking-widest text-newsprint-900 uppercase">
              Stamping Certificate…
            </span>
          </div>
        ) : (
          children
        )}
      </button>

      {flash && (
        <div className="t-caption font-mono text-phosphor-400 text-glow-phosphor mt-1 text-center">
          {flash}
        </div>
      )}
    </>
  );
};
