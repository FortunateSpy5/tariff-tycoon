/**
 * SituationRoom — the contextual right-deck dossier.
 *
 * DESIGN RATIONALE [The Empty Cabinet Problem]:
 * The right wing was ~33% of the screen and rendered a suitcase icon plus a
 * lock message for a new player's entire first session. A third of the cockpit
 * was dead pixels, and it was the pane that most needed to carry the satire —
 * this is the "executive expansion" the game is named for.
 *
 * This component fills that space with content that CHANGES as the player
 * progresses, so the deck is never a void:
 *   - Onboarding: the tutorial directive, front and centre.
 *   - Early game: live career objectives with real progress bars.
 *   - Mid/late game: the Certificate button (see CertificateExporter).
 *
 * REDESIGN [The Phantom Wings]:
 * This was a FALLBACK surface — it stood in for the whole right wing whenever
 * no real channel was unlocked, which meant the tab strip vanished and the four
 * systems the game is named for were mentioned only here. It is now the body of
 * the always-open `[B] BRIEF` channel, so the tab strip is permanently present
 * and this sits beside the sealed dossiers rather than replacing them.
 */

import React from 'react';
import { Target, Check, FileBadge } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { CAREER_OBJECTIVES, TUTORIAL_CHAIN } from '../../constants/onboarding';
import { formatCurrency } from '../../engine/math/bigNumber';
import { Card, CardHeader } from '../ui';
import { TutorialDirective } from '../onboarding';
import { CertificateExporter } from '../share/CertificateExporter';

export const SituationRoom: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const totalFrenziesTriggered = useGameStore((s) => s.totalFrenziesTriggered);
  const totalCrisesAnswered = useGameStore((s) => s.totalCrisesAnswered);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);
  const tutorialStepIndex = useGameStore((s) => s.tutorialStepIndex);

  const snapshot = {
    treasuryCash,
    phase,
    totalFrenziesTriggered,
    totalCrisesAnswered,
    activeUpgrades,
    slopSuspicion: 0,
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-2">
      <TutorialDirective />

      {/* Career objectives — always present so the deck is never empty */}
      <Card material="paper">
        <CardHeader
          title="Career Objectives"
          icon={<Target className="w-3.5 h-3.5 text-wax-500" />}
        />
        <div className="flex flex-col gap-1.5">
          {CAREER_OBJECTIVES.map((obj) => {
            const current = obj.read(snapshot);
            const isDone = current >= obj.target;
            const pct = isDone ? 100 : Math.min(100, (current / obj.target) * 100);
            // Large currency targets read better as money; counters read as x/N.
            const isMoney = obj.target >= 1_000_000;
            const currentLabel = isMoney ? formatCurrency(current) : `${Math.floor(current)}/${obj.target}`;

            return (
              <div key={obj.id} className="rule-print pb-1.5 last:border-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    {isDone ? (
                      <Check className="w-3 h-3 text-phosphor-600 shrink-0" />
                    ) : (
                      <span className="w-3 h-3 rounded-full border-2 border-wax-500/50 shrink-0" />
                    )}
                    <span
                      className={`t-caption font-black uppercase truncate ${
                        isDone ? 'text-phosphor-600 line-through' : 'text-newsprint-900'
                      }`}
                    >
                      {obj.label}
                    </span>
                  </div>
                  <span className="t-caption font-mono font-black text-newsprint-800 shrink-0">
                    {isDone ? 'DONE' : currentLabel}
                  </span>
                </div>

                {!isDone && (
                  <>
                    <div className="mt-1 h-1 bg-newsprint-300/60 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-wax-500 transition-all duration-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="t-caption text-newsprint-800/80 mt-0.5 leading-snug">{obj.detail}</p>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* The shareable artifact — the virality hook, available from Phase 1 */}
      <CertificateExporter>
        <Card material="paper" className="hover:border-gold-500/60 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <FileBadge className="w-5 h-5 text-gold-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="t-micro font-black tracking-widest text-newsprint-900 uppercase">
                Issue A Certificate
              </div>
              <div className="t-caption text-newsprint-800/80 leading-snug">
                {tutorialStepIndex < TUTORIAL_CHAIN.length
                  ? 'Stamp and export your latest decree as a shareable 9:16 decree card.'
                  : 'Export your career as an official Certificate of Structural Damage.'}
              </div>
            </div>
          </div>
        </Card>
      </CertificateExporter>
    </div>
  );
};
