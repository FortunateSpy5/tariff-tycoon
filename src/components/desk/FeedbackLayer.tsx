/**
 * FeedbackLayer — the single, prioritized feedback surface for the center desk.
 *
 * PROBLEM THIS SOLVES [The Four Overlay Problem]:
 * `ResoluteBlotterCenter` previously mounted up to four independent
 * `absolute inset-0` overlays (YAP result, money-printer result, plus separate
 * raid and crisis banners). They each owned a z-index and raced for the same
 * pixels, so a raid landing on the same frame as a YAP could stack two opaque
 * panels and hide the message underneath. It was also impossible to tell which
 * one the player was actually looking at.
 *
 * INVARIANT: [One Feedback Layer]
 * All transient, competing messages resolve through this component, which
 * renders exactly ONE. Priority order lives in `feedbackPriority.ts`; new
 * competing feedback must be added there with a priority, never as a sibling
 * overlay here.
 */

import React, { useEffect } from 'react';
import { ShieldAlert, Flame, Printer, Siren, X, RotateCcw } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { resolveFeedback, type FeedbackTone } from './feedbackPriority';
import { hint } from '../ui/hint';

/**
 * ISSUE-004: how long a resolved crisis keeps the slot it no longer needs.
 *
 * INVARIANT: [A Notice Expires Of Its Own Accord]
 * The crisis outcome is the LOWEST-priority entry in `feedbackPriority` — it is
 * purely informational, it is beaten by anything else that happens to fire, and
 * it rendered above the directive sheet and under the stamp until somebody found
 * its dismiss button. A message that has already been delivered and cannot be
 * missed again is dead weight on the one surface the player is trying to read.
 *
 * 5s is long enough to read a two-clause sentence at 9.5px monospace, and short
 * enough that it is gone before the next crisis can spawn. Two exits, both here
 * and in `deskSlice.clickDesk`: the timer catches the player who stops slamming,
 * the slam catches the player who does not look up long enough to wait.
 */
const CRISIS_NOTICE_MS = 5000;

const TONE: Record<FeedbackTone, { bg: string; border: string; text: string }> = {
  red: { bg: 'bg-ink-1/95', border: 'border-dead-ink', text: 'text-dead-soft' },
  amber: { bg: 'bg-dead/15', border: 'border-accent-ink', text: 'text-accent-ink' },
  emerald: { bg: 'bg-well/95', border: 'border-live-ink', text: 'text-live-soft' },
  blue: { bg: 'bg-well/95', border: 'border-line-strong', text: 'text-term-ink-1' },
};

export const FeedbackLayer: React.FC<{
  yapFeedback: string | null;
  printFeedback: string | null;
  hasWalkBackCall: boolean;
}> = ({ yapFeedback, printFeedback, hasWalkBackCall }) => {
  const lastRaidMessage = useGameStore((s) => s.lastRaidMessage);
  const dismissRaidAlert = useGameStore((s) => s.dismissRaidAlert);
  const isWalkBackWindowActive = useGameStore((s) => s.isWalkBackWindowActive);
  const lastWalkBackNotice = useGameStore((s) => s.lastWalkBackNotice);
  const lastCrisisOutcome = useGameStore((s) => s.lastCrisisOutcome);
  const dismissCrisisOutcome = useGameStore((s) => s.dismissCrisisOutcome);

  /* ISSUE-004 — the timer half of "auto-dismiss the stale crisis banner". Keyed
     on the MESSAGE, not on a boolean, so back-to-back crises (SUPPRESSED, then
     SWEAR IN inside 5s) each get their own full window instead of the second one
     inheriting the first one's remaining time and vanishing on arrival. */
  useEffect(() => {
    if (!lastCrisisOutcome) return;
    const id = window.setTimeout(dismissCrisisOutcome, CRISIS_NOTICE_MS);
    return () => window.clearTimeout(id);
  }, [lastCrisisOutcome, dismissCrisisOutcome]);

  const feedback = resolveFeedback({
    lastRaidMessage,
    isWalkBackWindowActive,
    lastWalkBackNotice,
    hasWalkBackCall,
    yapFeedback,
    printFeedback,
    lastCrisisOutcome,
  });

  if (!feedback) return null;
  const tone = TONE[feedback.tone];

  const Icon =
    feedback.kind === 'raid' ? ShieldAlert
    : feedback.kind === 'walkBack' ? RotateCcw
    : feedback.kind === 'yap' ? Flame
    : feedback.kind === 'print' ? Printer
    : Siren;

  return (
    <div
      role="status"
      aria-live="assertive"
      className={`shrink-0 z-20 flex items-center gap-1.5 rounded-lg border px-2 py-1 shadow-xl font-mono t-micro font-bold ${tone.bg} ${tone.border} ${tone.text} ${feedback.kind === 'raid' ? 'animate-pulse' : ''}`}
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span className="truncate">{feedback.text}</span>
      {(feedback.kind === 'raid' || feedback.kind === 'crisis') && (
        <button
          onClick={feedback.kind === 'raid' ? dismissRaidAlert : dismissCrisisOutcome}
          {...hint(
            'Clear the banner and the strip of desk it is covering. It only mutes the message — the raid cooldown and the crisis resolution are already settled in the store and keep running. The next message takes the slot immediately.',
            // INVARIANT: an icon-only button has no visible text, so its
            // accessible name must be explicit. `hint(text)` alone leaves this
            // nameless to a screen reader — the one control in the file with
            // hover text and still no name.
            'Dismiss this alert'
          )}
          className="ml-auto shrink-0 text-term-ink-3 hover:text-term-ink-1 p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
