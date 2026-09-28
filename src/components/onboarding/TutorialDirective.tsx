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
import { Card } from '../ui';

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
      <div className="absolute -top-1 right-2 rotate-6 border-2 border-wax-500/70 px-1.5 py-0.5">
        <span className="t-caption font-black tracking-widest text-wax-500 uppercase">
          Directive
        </span>
      </div>

      <div className="flex items-start gap-2 pr-16">
        <GraduationCap className="w-4 h-4 mt-0.5 shrink-0 text-newsprint-800" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="t-micro font-black tracking-widest text-wax-500 uppercase">
              Step {tutorialStepIndex + 1}/{TUTORIAL_CHAIN.length}
            </span>
            <span className="text-newsprint-300 text-caption">//</span>
            <span className="t-micro font-black tracking-widest text-newsprint-800 uppercase">
              {step.title}
            </span>
          </div>
          <p className="t-caption text-newsprint-800 mt-1 leading-relaxed font-medium">
            {step.body}
          </p>

          <div className="flex items-center gap-1.5 mt-2">
            <span className="t-caption font-bold text-newsprint-900 uppercase">
              Focus: {step.focus === 'desk' ? 'Center Desk' : step.focus === 'left' ? 'Left Terminal' : 'Right Deck'}
            </span>
            {step.hotkey && (
              <kbd className="t-caption font-mono font-black bg-newsprint-900 text-newsprint-50 px-1 rounded">
                {step.hotkey}
              </kbd>
            )}

            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={skipTutorial}
                className="t-caption font-mono px-1.5 py-0.5 rounded text-newsprint-800 hover:bg-newsprint-300/40 transition-colors"
                title="Skip onboarding"
              >
                <X className="w-3 h-3 inline" />
              </button>
              {step.mode === 'manual' && (
                <button
                  onClick={advanceTutorial}
                  className="t-caption font-mono font-black uppercase px-1.5 py-0.5 rounded bg-newsprint-900 text-newsprint-50 hover:bg-wax-500 flex items-center gap-0.5 transition-colors"
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
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-newsprint-300/50">
        <div
          className="h-full bg-wax-500 transition-all duration-500"
          style={{ width: `${((tutorialStepIndex + 1) / TUTORIAL_CHAIN.length) * 100}%` }}
        />
      </div>
    </Card>
  );
};
