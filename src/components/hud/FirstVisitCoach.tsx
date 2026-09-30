/**
 * FirstVisitCoach — the one line of chrome that tells a new player the two
 * things the cockpit cannot teach them by being on screen.
 *
 * WHY THIS EXISTS
 * The audit filed both of these as separate low-priority items, and they are the
 * same defect: the game has real capabilities that are invisible.
 *
 *   - ISSUE-017: it is a zero-scroll `100dvh` cockpit. On any monitor with browser
 *     chrome, the player is looking at a clipped version of a layout designed for
 *     the whole screen, and nothing says so.
 *   - ISSUE-020: every interaction has procedural audio — the marker squeak, the
 *     paper-blotter thud, the cha-ching on a settled contract — and a muted player
 *     has no way to know any of it exists, because the visual feedback (a stamp
 *     animating, a number floating) is indistinguishable from the muted state.
 *
 * The muted case is the sharper of the two, and it is worth being precise about
 * why it is NOT fixed by a generic "audio on?" panel: the nudge only helps if it
 * arrives AFTER the player has felt the absence, so it waits for the first slam.
 * A prompt on frame one about a sound the player has not needed yet is a prompt
 * they dismiss without reading, which is the failure mode
 * `dismissedCoachMarks` exists to make permanent.
 *
 * INVARIANT: [One Strip, Not Two]
 * Both nudges render into ONE dismissible strip, highest priority first. Two
 * separate toasts on the same first session is how a chrome line becomes noise,
 * and this strip already sits directly above the desk — the densest surface in
 * the game — on the player's most valuable real estate.
 *
 * INVARIANT: [Never On A Save That Has Been Played]
 * The strip is for a first impression, so it is gated on Phase 1 and on the
 * marks being undismissed. A returning player who has reached the Oval Office
 * does not get told to try fullscreen, and `dismissCoachMark` means the
 * dismissal survives every reload. There is no version of this component that
 * can nag.
 *
 * INVARIANT: [The Fullscreen Nudge Is Not A Request]
 * `requestFullscreen` must be called from a user gesture, so this strip cannot
 * enter fullscreen for the player — it links the pointer at the existing [F]
 * control and says what it costs (nothing). Every browser that supports the
 * Fullscreen API rejects the call from a non-gesture context, and the rejection
 * is silent, so an "enter fullscreen" button here would look broken rather than
 * denied.
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { hint } from '../ui/hint';

interface CoachMark {
  /** Stable id, persisted in `dismissedCoachMarks`. Never renumber these. */
  id: string;
  body: React.ReactNode;
  hover: string;
  /** Higher wins. */
  priority: number;
}

export const FirstVisitCoach: React.FC = () => {
  const dismissed = useGameStore((s) => s.dismissedCoachMarks);
  const dismissCoachMark = useGameStore((s) => s.dismissCoachMark);
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const phase = useGameStore((s) => s.phase);
  const totalClicks = useGameStore((s) => s.totalClicks);

  /* `document.fullscreenElement` is not reactive, and the strip must not sit on
     screen saying "try fullscreen" while the player is already in it. Polled on
     the same `fullscreenchange` event the platform fires, so this costs one
     event listener and no frame of re-render. */
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);

  // See [Never On A Save That Has Been Played]. The gate is PHASE 1, not "has
  // not slammed" — and it has to be, because the first cut of this component
  // gated on `isFirstSlam` and the strip therefore vanished on the player's very
  // first click. A fullscreen tip that disappears the instant somebody engages
  // with the game is the worst possible lifetime: it is gone for every player
  // who is actually going to play, and it lingers only for the ones who bounced
  // before the tutorial could run. Phase 1 is the honest reading of "a save
  // that has been played" — it ends at the $1M Oval Office threshold, so it
  // cannot appear on a returning player's desk, and `dismissCoachMark` means the
  // ones who did dismiss it never see it again regardless of phase.
  if (phase >= 2) return null;

  const marks: CoachMark[] = [];

  // The muted nudge fires on the SECOND slam: after the first, the player has
  // felt a slam that made no noise, which is the moment the absence is real.
  if (isMuted && totalClicks >= 2) {
    marks.push({
      id: 'unmute',
      priority: 2,
      body: (
        <>
          <span className="font-bold text-live-ink">Your first slam made no sound.</span>{' '}
          Every stamp squeaks, every blotter thuds, and a settled contract rings the
          treasury. Nothing here is a video.
        </>
      ),
      hover: 'The desk is synthesising, not playing a recording: the squeak pitch rises with how fast you are clicking, the thud is a filtered noise burst, and the cha-ching is three detuned sines. [M] toggles it; the toggle is in the top rail and the dock. Muting costs nothing in the economy and nothing in juice — it is entirely your call whether the 3:00 AM desk should be loud.',
    });
  }

  if (!isFullscreen) {
    marks.push({
      id: 'fullscreen',
      priority: 1,
      body: (
        <>
          This cockpit is one screen with no scrolling. Browser chrome is eating
          part of it — <span className="font-bold text-accent-ink">[F]</span> or the
          corner button gives it back.
        </>
      ),
      hover: 'Fullscreen is layout only: it moves no number, changes no price, and does not touch the 48-hour offline window. The [F] key and the dock button both toggle it. If your browser refuses the request — some do, and the refusal is silent — the game is completely playable in a window; nothing is cut off, the cockpit just scales itself to whatever height it is given.',
    });
  }

  if (marks.length === 0) return null;
  const mark = marks.sort((a, b) => b.priority - a.priority)[0];
  if (dismissed.includes(mark.id)) return null;

  return (
    <div
      /* `polite`, not `assertive`: nothing here is urgent, and a strip that
         interrupts a screen reader mid-slam is a strip nobody finishes reading.
         `role="status"` so the one line is announced when it appears. */
      role="status"
      aria-live="polite"
      className="shrink-0 flex items-center gap-2 border-b border-accent-ink/40 bg-accent-wash px-3 py-1 font-mono t-caption text-ink-2"
    >
      <span className="min-w-0 flex-1 leading-snug">{mark.body}</span>

      {mark.id === 'unmute' && (
        /* A real control, not a sentence about one. The player has just been
           told the game has sound and the cheapest possible next step is the
           button; making them find it in the top rail after being told it
           exists would be a nudge that costs a second of hunting. */
        <button
          onClick={toggleMute}
          {...hint(
            'Turn the sound on. The economy does not change either way, and you can hit [M] or this same toggle again the moment the neighbours start filing complaints.',
            'Unmute the desk'
          )}
          className="shrink-0 px-2 py-0.5 rounded bg-live text-on-fill font-black uppercase tracking-wider hover:opacity-90 active:scale-95 cursor-pointer transition-all"
        >
          Unmute
        </button>
      )}

      {/* The dismiss control explains itself like every other gate in the game:
          what it silences, what it keeps, and that it never comes back. */}
      <button
        onClick={() => dismissCoachMark(mark.id)}
        {...hint(
          mark.id === 'unmute'
            ? 'Hide this line until you reset the save. The sound toggle stays exactly where it is — top rail and [M] — and nothing else about the desk changes.'
            : 'Hide this line until you reset the save. The fullscreen control stays exactly where it is — [F] and the dock button — and the cockpit keeps scaling itself to whatever height it is given.',
          'Dismiss this tip'
        )}
        className="shrink-0 p-0.5 rounded text-ink-3 hover:bg-panel/50 hover:text-ink-1 cursor-pointer transition-colors"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
};