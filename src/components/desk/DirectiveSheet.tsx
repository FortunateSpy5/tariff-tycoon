/**
 * DirectiveSheet — the live 3:00 AM wire, printed on the blotter.
 *
 * DESIGN RATIONALE [The Sheet That Held One Static Sentence]:
 * The best real estate on the desk — a full-width parchment sheet directly
 * above the hero control — held a single italic line. Before the player fired
 * a YAP it was a hardcoded joke; afterwards it was the raw YAP text with its
 * metadata jammed onto one line. Nothing on it was labelled, so the player
 * could not tell whether they were reading their own decree, a seizure log, or
 * decoration.
 *
 * It is now a named wire: the header says which document this is, the body is
 * the live post, and the footer line is the post's own telemetry — the tariff it
 * announced, the impact multiplier it carried, and how many people quoted it.
 * That telemetry is not decoration either: it is the causal chain made visible,
 * and it is the same data that crashes the market.
 *
 * INVARIANT: copy must never lie about the economy. The pre-YAP fallback lines
 * describe what the sheet IS at that moment, not a promise of later content.
 *
 * SCOPE: the `@MadBagsJim` reply swarm already exists in `yapEngine` and is
 * deliberately NOT rendered here — that is Phase 3.2 in
 * UX_EVALUATION_AND_REDESIGN_PLAN.md. This component owns the wire header,
 * the post, and the post's telemetry, and nothing else.
 */

import React from 'react';
import { FileText, Megaphone } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { CUSTOMS_LOCATION_SHORT } from '../../constants/setting';
import { hint } from '../ui/hint';

export const DirectiveSheet: React.FC<{
  isRecoilActive: boolean;
  isPulseActive: boolean;
}> = ({ isRecoilActive, isPulseActive }) => {
  const phase = useGameStore((s) => s.phase);
  const lastYapPost = useGameStore((s) => s.lastYapPost);
  const isLive = Boolean(lastYapPost?.rawText);

  // INVARIANT: [Do Not Describe Flavour As Mechanics]
  // An earlier draft said the quote count was "the only prestige this economy
  // offers". It is `Math.random()` and is read by nothing — prestige is
  // Sovereign Immunity Slips, priced off lifetime cash and options profit. The
  // impact multiplier is likewise derived from the tariff and never fed back
  // into the crash. A tooltip that invents a causal link a player will then act
  // on is the worst lie in the app, so both are labelled as what they are.
  const sheetHint = isLive
    ? `Your most recent 3:00 AM post. The tariff line is the part that mattered — that is the number the crash was sized from, and it is the number your PUT paid on. The impact and viral-quote figures are window dressing; the sheet records the decree, it does not compute your earnings.`
    : `Nothing has been filed yet. Your first 3:00 AM decree prints here: the text, the tariff it announced, and the damage it did. Right now this is a ${
        phase === 1 ? 'blank customs seizure log' : 'blank executive directive'
      }.`;

  return (
    <div
      {...hint(sheetHint, 'Directive sheet — your latest decree')}
      className={`surface-sheet border border-line rounded-lg p-2.5 text-center shadow-sm shrink-0 transition-all duration-100 relative ${
        isRecoilActive ? 'animate-recoil' : ''
      } ${isPulseActive ? 'ring-2 ring-dead-ink/50 animate-calm-glow' : ''}`}
    >
      <div className="flex items-center justify-center gap-1.5 t-micro font-mono font-bold tracking-widest text-dead-ink uppercase">
        {isLive ? (
          <Megaphone className="w-3.5 h-3.5" aria-hidden />
        ) : (
          <FileText className="w-3.5 h-3.5" aria-hidden />
        )}
        <span>
          {isLive
            ? 'YOUR LATEST DECREE // FILED 3:00 AM'
            : phase === 1
            ? `CUSTOMS SEIZURE LOG // AGENT 412 // ${CUSTOMS_LOCATION_SHORT}`
            : 'BLANK DIRECTIVE // AWAITING YOUR FIRST DECREE'}
        </span>
      </div>

      <p className="text-ink-3 italic text-xs mt-1 line-clamp-2 font-serif px-2">
        {lastYapPost?.rawText ??
          (phase === 1
            ? '"Foreign brie and uninspected produce confiscated for emergency redistribution."'
            : '"By authority vested in the Dealmaker-in-Chief, international trade is officially canceled."')}
      </p>

      {lastYapPost && (
        <div className="mt-1 flex items-center justify-center gap-2 t-micro font-mono text-ink-3">
          <span className="text-dead-ink">Tariff {lastYapPost.tariffPercentage}%</span>
          <span className="opacity-40">·</span>
          <span>Impact ×{lastYapPost.impactMultiplier.toFixed(2)}</span>
          <span className="opacity-40">·</span>
          <span>{lastYapPost.viralQuotesCount.toLocaleString()} viral quotes</span>
        </div>
      )}
    </div>
  );
};
