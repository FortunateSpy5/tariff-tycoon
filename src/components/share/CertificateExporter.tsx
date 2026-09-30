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
import { Loader, Check } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import { decreeDataFromYap, downloadBlob, renderDecreeCard } from './decreeCard';
import { hint } from '../ui/hint';

const PHASE_LABEL: Record<number, string> = {
  1: 'PHASE 1 // THE CUSTOMS DESK',
  2: 'PHASE 2 // THE OVAL SYNDICATE',
  3: 'PHASE 3 // FORTRESS AMERICA',
  4: 'PHASE 4 // ONTHOLOGICAL',
};

/**
 * INVARIANT: [The Icon Variant Reports Through The Glyph, Not Through Layout]
 * ISSUE-018 moved this exporter into the 48px top rail, which has no vertical
 * room for the card variant's inline confirmation line — and the rail is
 * `overflow-hidden`, so a popover under the button would be clipped rather than
 * shown. The three states are therefore carried by the ICON (seal, spinner,
 * check) and the flash text goes to a screen-reader-only live region. Nothing
 * about the trigger's box changes size, so the marquee never reflows underneath
 * it and the rail cannot jitter when a 1080x1920 canvas finishes drawing.
 */
export const CertificateExporter: React.FC<{
  children: React.ReactNode;
  /**
   * `'card'` renders the rich trigger used in the Situation Room and prints the
   * confirmation inline beneath it. `'icon'` is the rail variant: fixed square,
   * glyph-driven, confirmation announced rather than painted.
   */
  variant?: 'card' | 'icon';
  /**
   * Accessible name. REQUIRED in `icon` mode and optional in `card` mode, where
   * the visible `[ SHARE THE DAMAGE ]` text is already a sufficient name.
   *
   * This exists because the rail variant shipped nameless. `hint(text)` with a
   * single argument sets `data-hint` and nothing else, and the rail trigger is an
   * icon with no text — so it was reachable by keyboard and announced as an
   * unlabelled "button" by every screen reader, in the one row of the app where
   * mute, shake and reset all carry proper names. It is the exact defect
   * `TutorialDirective`'s skip button was fixed for, arriving 60 files later.
   */
  name?: string;
}> = ({ children, variant = 'card', name }) => {
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

  const isIcon = variant === 'icon';
  // The rail variant keeps the trigger a FIXED square so the surrounding flex
  // row never reflows when the glyph changes. The card variant stays `w-full`
  // because it is the whole card and has the vertical room for a two-line state.
  const triggerBox = isIcon
    ? 'inline-flex items-center justify-center w-7 h-7 shrink-0'
    : 'w-full text-left';

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
        /* INVARIANT: [aria-Disabled, Not disabled, Even For A Transient Busy]
           The rule exists because Chromium swallows pointer events on a natively
           disabled button — which deletes the hover text explaining the very gate
           that closed it. `busy` is the same gate with a shorter fuse, so it gets
           the same treatment: the state is announced, the handler refuses, and
           the explanation stays reachable throughout. */
        aria-disabled={busy}
        {...(name ? { 'aria-label': name } : {})}
        {...hint(
          busy
            ? 'STAMPING. The canvas is being drawn at 1080x1920 — a beat, not a hang. It resolves on its own; re-clicking just starts it again.'
            : 'Draws your latest decree — the last YAP you posted, stamped CLASSIFIED at 3:00 AM with your treasury, crony favor, and S.L.O.P. suspicion on the docket — and downloads it as a 1080x1920 PNG sized exactly for Reels. SIDE EFFECT: a ready-made caption is copied to your clipboard, so the post has a line of satire attached. A clipboard denial is handled silently; the image still lands in your downloads.'
        )}
        className={`${triggerBox} aria-disabled:cursor-wait transition-opacity
                   focus:outline-none
                   focus-visible:[&>div]:ring-2 focus-visible:[&>div]:ring-accent-ink
                   focus-visible:[&>div]:ring-offset-2 focus-visible:[&>div]:ring-offset-card
                   focus-visible:[&>div]:border-accent-ink`}
      >
        {busy && isIcon ? (
          <Loader className="w-3.5 h-3.5 animate-spin text-accent-ink" aria-hidden />
        ) : flash && isIcon ? (
          <Check className="w-3.5 h-3.5 text-live-ink" aria-hidden />
        ) : busy ? (
          <div className="surface-newsprint border border-line rounded-lg p-2.5 flex items-center gap-2">
            <span className="t-micro font-mono font-black tracking-widest text-ink-2 uppercase">
              Stamping Certificate…
            </span>
          </div>
        ) : (
          children
        )}
      </button>

      {/* INVARIANT: [Every Variant Announces The Outcome Exactly Once]
          The card variant paints the confirmation, because it has room. The rail
          variant CANNOT — the rail is `overflow-hidden` and 48px tall — so it is
          announced only, and the glyph beside it carries the same information
          visually. `role="status"` with a stable render site is what makes the
          change fire at all: an `aria-live` region that is unmounted and
          remounted with its content is not reliably announced, whereas this node
          stays in the tree and only its text changes. */}
      {isIcon ? (
        <span role="status" aria-live="polite" className="sr-only">
          {flash ?? ''}
        </span>
      ) : (
        flash && (
          /* Was `text-glow-phosphor`, which no rule in `index.css` declares and
             whose family (`phosphor`) the palette renamed to `term`. A bespoke
             utility that no longer exists emits nothing, so the confirmation was
             rendering as plain caption text with no bloom at all — invisible
             evidence of a feature that had quietly stopped existing.
             `text-glow-live` is the real rule, and green is the affirmative step,
             which is what "your decree exported" is. */
          <div className="t-caption font-mono text-term-ink-2 text-glow-live mt-1 text-center">
            {flash}
          </div>
        )
      )}
    </>
  );
};