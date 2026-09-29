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

import React from 'react';
import { ShieldAlert, Flame, Printer, Siren, X, RotateCcw } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { resolveFeedback, type FeedbackTone } from './feedbackPriority';
import { hint } from '../ui/hint';

const TONE: Record<FeedbackTone, { bg: string; border: string; text: string }> = {
  red: { bg: 'bg-red-950/95', border: 'border-red-500', text: 'text-red-200' },
  amber: { bg: 'bg-amber-950/95', border: 'border-amber-500', text: 'text-amber-200' },
  emerald: { bg: 'bg-emerald-950/95', border: 'border-emerald-500', text: 'text-emerald-200' },
  blue: { bg: 'bg-newsprint-900/95', border: 'border-newsprint-700', text: 'text-newsprint-100' },
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
          className="ml-auto shrink-0 text-stone-400 hover:text-stone-100 p-0.5 cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
