/**
 * Feedback priority resolution — pure, no React.
 *
 * Split from `FeedbackLayer.tsx` so that module exports only a component, which
 * keeps Vite's React Fast Refresh working during development.
 *
 * INVARIANT: [One Feedback Layer]
 * All transient, competing messages in the center desk resolve through
 * `resolveFeedback`, which returns exactly ONE message or null. The previous
 * build mounted up to four independent `absolute inset-0` overlays that raced
 * for the same pixels and could stack opaquely, hiding the message underneath.
 * New competing feedback must be added here with an explicit priority, never as
 * a sibling overlay.
 */

export type FeedbackKind = 'raid' | 'walkBack' | 'yap' | 'print' | 'crisis';
export type FeedbackTone = 'red' | 'amber' | 'emerald' | 'blue';

export interface Feedback {
  kind: FeedbackKind;
  tone: FeedbackTone;
  text: string;
}

export interface FeedbackInput {
  lastRaidMessage: string | undefined;
  isWalkBackWindowActive: boolean;
  lastWalkBackNotice: string | undefined;
  hasWalkBackCall: boolean;
  yapFeedback: string | null;
  printFeedback: string | null;
  lastCrisisOutcome: string | undefined;
}

/**
 * Priority (highest first), ordered by what the player must not miss:
 *   1. raid      an active Special Counsel raid is a state change with a cost
 *   2. walkBack   an 8-second window is actively ticking against the player
 *   3. yap        the result of the core loop; the payoff moment
 *   4. print      money printer confirmation, recurring and low-stakes
 *   5. crisis     a resolved crisis outcome, purely informational
 */
export function resolveFeedback(s: FeedbackInput): Feedback | null {
  if (s.lastRaidMessage) {
    return { kind: 'raid', tone: 'red', text: s.lastRaidMessage };
  }
  if (s.isWalkBackWindowActive && s.lastWalkBackNotice) {
    return { kind: 'walkBack', tone: 'amber', text: s.lastWalkBackNotice };
  }
  if (s.yapFeedback) {
    // A successful insider combo is the core payoff; colour it accordingly.
    const won = s.yapFeedback.includes('COMBO') || s.yapFeedback.startsWith('CRASHED');
    return { kind: 'yap', tone: won ? 'emerald' : 'amber', text: s.yapFeedback };
  }
  if (s.printFeedback) {
    return { kind: 'print', tone: 'emerald', text: s.printFeedback };
  }
  if (s.lastCrisisOutcome) {
    return { kind: 'crisis', tone: 'blue', text: s.lastCrisisOutcome };
  }
  return null;
}
