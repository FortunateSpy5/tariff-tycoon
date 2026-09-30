/**
 * TutorialDirective — the onboarding chain rendered as a classified directive.
 *
 * DESIGN RATIONALE:
 * The original build had no onboarding at all, and its "NEXT UNLOCK" card was a
 * passive readout of a cash threshold. A new player had no idea what the game
 * wanted them to do. This renders each step as a stamped government directive
 * that names the exact widget to touch, so the first session teaches the causal
 * shorting loop instead of leaving the player grinding a stamp.
 *
 * The card is deliberately a PAPER material so onboarding reads as "you are
 * being handed a document", matching the satire rather than fighting it.
 */

import React from 'react';
import { GraduationCap, ChevronRight, X } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { TUTORIAL_CHAIN } from '../../constants/onboarding';
import { Card } from '../ui/Card';
import { hint } from '../ui/hint';

export const TutorialDirective: React.FC = () => {
  const tutorialStepIndex = useGameStore((s) => s.tutorialStepIndex);
  const advanceTutorial = useGameStore((s) => s.advanceTutorial);
  const skipTutorial = useGameStore((s) => s.skipTutorial);

  if (tutorialStepIndex >= TUTORIAL_CHAIN.length) return null;

  const step = TUTORIAL_CHAIN[tutorialStepIndex];
  if (!step) return null;

  const isFinal = tutorialStepIndex === TUTORIAL_CHAIN.length - 1;

  return (
    <Card material="paper" className="relative overflow-hidden">
      {/* Classified stamp, rotated into the corner of the document */}
      <div className="absolute -top-1 right-2 rotate-6 border-2 border-dead-ink/70 px-1.5 py-0.5">
        <span className="t-caption font-black tracking-widest text-dead-ink uppercase">
          Directive
        </span>
      </div>

      <div className="flex items-start gap-2 pr-16">
        <GraduationCap className="w-4 h-4 mt-0.5 shrink-0 text-ink-3" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="t-micro font-black tracking-widest text-dead-ink uppercase">
              Step {tutorialStepIndex + 1}/{TUTORIAL_CHAIN.length}
            </span>
            <span className="t-micro text-ink-2" aria-hidden>//</span>
            <span className="t-micro font-black tracking-widest text-ink-3 uppercase">
              {step.title}
            </span>
          </div>
          <p className="t-caption text-ink-3 mt-1 leading-relaxed font-medium">
            {step.body}
          </p>

          <div className="flex items-center gap-1.5 mt-2">
            <span className="t-caption font-bold text-ink-2 uppercase">
              Focus: {step.focus === 'desk' ? 'Center Desk' : step.focus === 'left' ? 'Left Terminal' : 'Right Deck'}
            </span>
            {step.hotkey && (
              <kbd className="t-caption font-mono font-black bg-well text-ink-1 px-1 rounded">
                {step.hotkey}
              </kbd>
            )}

            <div className="ml-auto flex items-center gap-1">
              {/* ACCESSIBILITY FIX: this button is icon-only and its only text
                  alternative was a `title`, which most screen readers never
                  announce — it announced as an unlabelled "button". The hint
                  supplies both `data-hint` and the missing accessible name. */}
              <button
                onClick={skipTutorial}
                {...hint(
                  'Burn the rest of the directive. Sets the tutorial index to the end of the chain, so onboarding never replays — including after a Flight to the Caymans. You keep the market, the paper trades, and everything you have already earned. You lose only the coaching; the Career Objectives panel takes over.',
                  'Skip onboarding'
                )}
                className="t-caption font-mono px-1.5 py-0.5 rounded text-ink-3 hover:bg-panel/40 transition-colors"
              >
                <X className="w-3 h-3 inline" />
              </button>
              {step.mode === 'manual' && (
                /* Only the final step is manual, and it is the graduation step.
                   Sealing writes `tutorialStepIndex = TUTORIAL_CHAIN.length`, the
                   same terminal state as skipping — see `advanceTutorialIndex`,
                   which clamps so it can never wrap back to 0. */
                <button
                  onClick={advanceTutorial}
                  {...hint(
                    isFinal
                      ? 'Sign the last page and close the file. Marks onboarding complete so the directive stops reappearing; the Career Objectives panel takes over. Nothing is spent, nothing is unlocked, and your treasury is untouched — you have already been paid for the loop.'
                      : 'Mark this step done and move the directive to the next one. It costs nothing.',
                    isFinal ? 'Seal onboarding and continue' : 'Advance to the next directive step'
                  )}
                  className="t-caption font-mono font-black uppercase px-1.5 py-0.5 rounded bg-well text-ink-1 hover:bg-dead flex items-center gap-0.5 transition-colors"
                >
                  {isFinal ? 'Seal It' : 'Next'}
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress rule along the bottom edge of the document */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-panel/50">
        <div
          className="h-full bg-dead transition-all duration-500"
          style={{ width: `${((tutorialStepIndex + 1) / TUTORIAL_CHAIN.length) * 100}%` }}
        />
      </div>
    </Card>
  );
};
