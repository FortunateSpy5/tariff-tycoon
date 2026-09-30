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
import { Target, FileBadge } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { CAREER_OBJECTIVES } from '../../constants/onboarding';
import { formatCurrency } from '../../engine/math/bigNumber';
import { Card, CardHeader } from '../ui/Card';
import { hint } from '../ui/hint';
import { objectiveHint } from './objectiveHint';
import { TutorialDirective } from '../onboarding';
import { CertificateExporter } from '../share/CertificateExporter';

export const SituationRoom: React.FC = () => {
  const phase = useGameStore((s) => s.phase);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const totalFrenziesTriggered = useGameStore((s) => s.totalFrenziesTriggered);
  const totalCrisesAnswered = useGameStore((s) => s.totalCrisesAnswered);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);
  const agencies = useGameStore((s) => s.agencies);
  const slopSuspicion = useGameStore((s) => s.slopSuspicion);

  // The `Objective.read` signature is the contract. `slopSuspicion` was
  // hardcoded to 0 here — a snapshot that lies to its own readers, waiting for
  // the first objective that consults it.
  const snapshot = {
    treasuryCash,
    phase,
    totalFrenziesTriggered,
    totalCrisesAnswered,
    activeUpgrades,
    agencies,
    slopSuspicion,
  };

  const rows = CAREER_OBJECTIVES.map((obj) => {
    const current = obj.read(snapshot);
    return { obj, current, isDone: current >= obj.target };
  });
  const done = rows.filter((r) => r.isDone);
  const pending = rows.filter((r) => !r.isDone);

  // INVARIANT: [Promote The NEAREST Objective, Not The First One Declared]
  // "The next unfinished objective" was `rows.find(r => !r.isDone)`, which is
  // DECLARATION order — and `CAREER_OBJECTIVES` is ordered by theme
  // (oval → frenzy → crisis → liquidation), not by distance. On a fresh save
  // that promoted "Cross the motorcade threshold" with a $1.00M bar, while
  // "First CAPS LOCK FRENZY" (target: 1) sat below it unpromoted. The panel's
  // whole job on the first screen is to point at the shortest path, so the
  // closest-to-done unfinished objective wins. Ties keep declaration order,
  // because `[...rows].sort` is stable and that is the authored reading order.
  const nextObjectiveId = rows
    .filter((r) => !r.isDone)
    .sort((a, b) => a.current / a.obj.target - b.current / b.obj.target)[0]?.obj.id;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-2">
      <TutorialDirective />

      {/* Career objectives — always present so the deck is never empty.
          INVARIANT: [The List Must Shrink As You Win]
          These used to render forever, half struck through, so a player who had
          completed three of four saw a wall of dead rows above the live one. The
          next unfinished objective is promoted and the finished ones collapse
          into a single struck-through summary line. */}
      <Card material="paper">
        <CardHeader
          title="Career Objectives"
          icon={<Target className="w-3.5 h-3.5 text-wax-500" />}
          right={
            <span className="t-caption font-mono font-black text-phosphor-600 shrink-0">
              {done.length}/{rows.length} DONE
            </span>
          }
        />
        <div className="flex flex-col gap-1.5">
          {/* INVARIANT: [The List Must Shrink As You Win — Actually Shrink]
              These rows collapse into the single `Certified:` line below once
              they are finished. Rendering them here as well meant a player who
              had completed three of four saw every completed row AND the summary
              that was supposed to have replaced them, which is the opposite of
              the shrink this comment claims. Only unfinished objectives render. */}
          {pending.map(({ obj, current, isDone }) => {
            const pct = isDone ? 100 : Math.min(100, (current / obj.target) * 100);
            // Large currency targets read better as money; counters read as x/N.
            const isMoney = obj.target >= 1_000_000;
            const currentLabel = isMoney ? formatCurrency(current) : `${Math.floor(current)}/${obj.target}`;
            // The nearest unfinished objective is the one the player should read,
            // and it is PROMOTED — a larger label, its own bar, and a gold rule —
            // because a `NEXT //` prefix in the same type size as the rows below
            // it is a whisper, and this panel's whole job on the first screen is
            // to point at the shortest path.
            const isNext = obj.id === nextObjectiveId;

            return (
              <div
                key={obj.id}
                // No `aria-label` here: this is a bare `<div>` with no role, and
                // an `aria-label` on a generic element is ignored outright by
                // assistive tech. The row's own text is its name; the
                // `role="progressbar"` below carries the accessible description.
                {...hint(objectiveHint(obj, current, isDone, isNext))}
                className={`rule-print pb-1.5 last:border-0 last:pb-0 ${
                  isNext ? 'border-l-2 border-wax-500 pl-1.5' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1 min-w-0">
                    <span
                      className={`rounded-full shrink-0 ${
                        isNext
                          ? 'w-3.5 h-3.5 border-2 border-wax-500 animate-calm-glow'
                          : 'w-3 h-3 border-2 border-wax-500/50'
                      }`}
                      aria-hidden
                    />
                    <span
                      className={`font-black uppercase truncate ${
                        isNext
                          ? 'text-sm text-newsprint-900'
                          : 't-caption text-newsprint-900'
                      }`}
                    >
                      {isNext ? <span className="text-wax-500 mr-1">NEXT //</span> : null}
                      {obj.label}
                    </span>
                  </div>
                  <span
                    className={`font-mono font-black text-newsprint-800 shrink-0 ${
                      isNext ? 'text-sm' : 't-caption'
                    }`}
                  >
                    {isDone ? 'DONE' : currentLabel}
                  </span>
                </div>

                {!isDone && (
                  <>
                    <div
                      className={`mt-1 bg-newsprint-300/60 rounded-full overflow-hidden ${
                        isNext ? 'h-2' : 'h-1'
                      }`}
                      role="progressbar"
                      aria-label={obj.label}
                      aria-valuemin={0}
                      aria-valuemax={obj.target}
                      aria-valuenow={Math.floor(current)}
                    >
                      <div
                        className="h-full bg-wax-500 transition-all duration-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p
                      className={`text-newsprint-800/80 mt-0.5 leading-snug ${
                        isNext ? 't-caption' : 't-caption opacity-80'
                      }`}
                    >
                      {obj.detail}
                    </p>
                  </>
                )}
              </div>
            );
          })}

          {done.length > 0 && (
            <p className="t-caption font-mono text-phosphor-700 leading-snug">
              Certified: {done.map((d) => d.obj.label).join(' · ')}
            </p>
          )}
        </div>
      </Card>

      {/* The shareable artifact — the virality hook, available from Phase 1.
          RENAMED [0.1]: it read `Issue A Certificate`, which described a
          bureaucratic form rather than the thing the player actually wants,
          which is to post the damage. It is now named for the action. */}
      <CertificateExporter>
        <Card material="paper" className="hover:border-gold-500/60 transition-colors cursor-pointer">
          <div className="flex items-center gap-2">
            <FileBadge className="w-5 h-5 text-gold-600 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="t-micro font-black tracking-widest text-newsprint-900 uppercase">
                [ Share The Damage ]
              </div>
              <div className="t-caption text-newsprint-800/80 leading-snug">
                Exports a 1080×1920 PNG of your latest decree.
              </div>
            </div>
          </div>
        </Card>
      </CertificateExporter>
    </div>
  );
};
