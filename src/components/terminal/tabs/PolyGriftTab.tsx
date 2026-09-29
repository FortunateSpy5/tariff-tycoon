/**
 * PolyGrift Tab: Prediction Markets & De-Dollarization Wagers
 * Wager on satirical geopolitical outcomes, late-night tariffs, and DOJ subpoenas.
 *
 * INVARIANT: [The Book Is Priced, Not Narrated]
 * `wagerPolyGrift` resolves on a raw `Math.random()` against `probYes` — the one
 * deliberately non-causal roll in the game (see `predictionSlice`). The hover
 * copy below therefore derives its expected value from the same three numbers
 * the engine rolls with, so the maths quoted to the player cannot drift from the
 * maths the book pays.
 */

import React, { useState } from 'react';
import { Target, CheckCircle2, XCircle } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { INITIAL_POLYGRIFT_BETS } from '../../../constants/unlocks';
import type { PolyGriftBet } from '../../../types/unlocks';
import { formatCurrency } from '../../../engine/math/bigNumber';
import { hint } from '../../ui/hint';

/** Fixed stake on every slip. Mirrors `handleWager` below — one source of truth. */
const WAGER_AMOUNT = 1000;

type Choice = 'YES' | 'NO';

/**
 * Expected dollars per slip at the quoted odds.
 * KaTeX: EV = (p \cdot odds - 1) \cdot S
 *
 * INVARIANT: computed, never hardcoded. A hand-typed EV in the hover copy is
 * exactly the kind of number that survives a balance change and starts lying.
 */
function expectedValue(bet: PolyGriftBet, choice: Choice): number {
  const p = choice === 'YES' ? bet.probYes : 100 - bet.probYes;
  const odds = choice === 'YES' ? bet.oddsYes : bet.oddsNo;
  return ((p / 100) * odds - 1) * WAGER_AMOUNT;
}

/** The honest one-line verdict on whether this side is a good deal. */
function evVerdict(ev: number): string {
  if (ev > 1) return `A real edge: +${formatCurrency(ev)} per slip.`;
  if (ev >= -1) return 'Priced to the cent — a coin flip, not a trade.';
  return `A bad deal at these odds: ${formatCurrency(ev)} per slip.`;
}

/**
 * Hover text for one side of one market.
 * Names the market, the odds, the stake, the heat, and the honest EV.
 */
function slipHint(bet: PolyGriftBet, choice: Choice): string {
  const odds = choice === 'YES' ? bet.oddsYes : bet.oddsNo;
  const oddsNo = choice === 'YES' ? bet.oddsNo : bet.oddsYes;
  const p = choice === 'YES' ? bet.probYes : 100 - bet.probYes;
  const ev = expectedValue(bet, choice);
  const otherOdds = choice === 'YES' ? oddsNo : bet.oddsYes;

  return (
    `${bet.title} ${choice} at ${odds}x: ${formatCurrency(WAGER_AMOUNT)} in, ` +
    `${formatCurrency(WAGER_AMOUNT * odds)} back if it lands, nothing if it does not. ` +
    `Resolves ${p}% of the time. ${evVerdict(ev)} ` +
    `The other side pays ${otherOdds}x at ${100 - p}%. ` +
    `Either way it costs heat: +3 on a win, +1 on a loss, and 100 heat is a raid.`
  );
}

export const PolyGriftTab: React.FC = () => {
  const wagerPolyGrift = useGameStore((s) => s.wagerPolyGrift);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  // INVARIANT: [Gated Controls Use aria-Disabled, Not disabled] — a native
  // `disabled` button swallows pointer events, which would delete the hover text
  // explaining the very gate that closed it. These two had no gate state at all,
  // so a broke player saw a live-looking button and only discovered the rule by
  // clicking into a rejection toast. See HintTooltip.
  const tooBroke = treasuryCash < WAGER_AMOUNT;
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleWager = (betId: string, choice: Choice) => {
    const currentTreasury = useGameStore.getState().treasuryCash;
    if (currentTreasury < WAGER_AMOUNT) {
      setFeedback('Need at least $1,000 to wager!');
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    const result = wagerPolyGrift(betId, choice, WAGER_AMOUNT);
    if (result.success) {
      if (result.won) {
        setFeedback(`WIN! +${formatCurrency(result.payout || 0)} PAYOUT on ${choice}!`);
      } else {
        setFeedback(`LOSS: -${formatCurrency(WAGER_AMOUNT)} on ${choice}!`);
      }
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 select-none">
      <div className="shrink-0">
        <div className="flex items-center justify-between t-micro font-mono text-stone-400 border-b border-stone-800 pb-1.5">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Target className="w-3.5 h-3.5" />
            <span>POLY-GRIFT PREDICTION BOOK</span>
          </div>
          <span>Wager: $1,000 / slip</span>
        </div>
      </div>

      {/* Bets List — flexes to fill remaining vertical space */}
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
        {INITIAL_POLYGRIFT_BETS.map((bet) => (
            <div key={bet.id} className="surface-terminal-well rounded-lg p-2 space-y-1.5">
              <span className="font-sans font-medium text-phosphor-300 block text-xs leading-snug">
                {bet.title}
              </span>
              <div className="flex items-center justify-between t-caption font-mono text-phosphor-600">
                <span>Chance: <strong className="text-phosphor-400">{bet.probYes}%</strong></span>
                <span>Payout Multiplier: {bet.oddsYes}x / {bet.oddsNo}x</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                <button
                  onClick={() => handleWager(bet.id, 'YES')}
                  aria-disabled={tooBroke}
                  {...hint(
                    tooBroke
                      ? `You hold ${formatCurrency(treasuryCash)}. Every slip on this book is a flat ${formatCurrency(WAGER_AMOUNT)} — the house does not take IOUs. The desk sells blueprints on the blotter if you need the difference.`
                      : slipHint(bet, 'YES'),
                    `Back ${bet.title} YES at ${bet.oddsYes} times`
                  )}
                  className={`py-1 rounded border font-mono font-bold t-micro flex items-center justify-center gap-1 active:scale-95 transition-all ${
                    tooBroke
                      ? 'bg-phosphor-900 border-phosphor-700/40 text-phosphor-600 cursor-not-allowed'
                      : 'bg-emerald-900/60 hover:bg-emerald-800 border-emerald-700/60 text-emerald-300 cursor-pointer'
                  }`}
                >
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  <span>YES ({bet.oddsYes}x)</span>
                </button>
                <button
                  onClick={() => handleWager(bet.id, 'NO')}
                  aria-disabled={tooBroke}
                  {...hint(
                    tooBroke
                      ? `You hold ${formatCurrency(treasuryCash)}. Every slip on this book is a flat ${formatCurrency(WAGER_AMOUNT)} — the house does not take IOUs. The desk sells blueprints on the blotter if you need the difference.`
                      : slipHint(bet, 'NO'),
                    `Back ${bet.title} NO at ${bet.oddsNo} times`
                  )}
                  className={`py-1 rounded font-mono font-bold t-micro flex items-center justify-center gap-1 active:scale-95 transition-all ${
                    tooBroke
                      ? 'surface-terminal-well text-phosphor-600 cursor-not-allowed'
                      : 'surface-terminal-well hover:border-phosphor-500/60 text-phosphor-300 cursor-pointer'
                  }`}
                >
                  <XCircle className="w-2.5 h-2.5" />
                  <span>NO ({bet.oddsNo}x)</span>
                </button>
              </div>
            </div>
          ))}
      </div>

      {feedback && (
        <div className="shrink-0 p-1.5 rounded bg-gold-500/20 border border-gold-500/40 text-center font-mono t-micro font-bold text-gold-400 animate-pulse">
          {feedback}
        </div>
      )}
    </div>
  );
};
