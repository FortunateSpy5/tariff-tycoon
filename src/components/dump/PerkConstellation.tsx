/**
 * PerkConstellation — the six SIS perks from GDD §5, as a buyable tree.
 *
 * WHY THIS EXISTS
 * `unlockedPerks` was a `Record<string, boolean>` and `unlockPerk` was called
 * from nowhere. The Caymans channel — the most expensive channel in the game —
 * held two cards and ~640px of dead space, and the perk currency had nothing to
 * spend on. This is the content that fills it, and every card's price comes
 * from `constants/perks.ts` rather than from the store, so the number on the
 * card is the number `unlockPerk` charges.
 *
 * INVARIANT: [Gated Controls Use aria-Disabled, Not disabled]
 * A native `disabled` swallows pointer events in Chromium, which deletes the
 * hover text explaining the very gate that closed the button. Every purchase is
 * `aria-disabled` plus a handler guard, and every guard refuses OUT LOUD in a
 * `role="status"` strip — an `aria-disabled` control still takes focus and still
 * fires on Enter, so a bare `return` is silence. See `HintTooltip`.
 */

import React, { useState } from 'react';
import { Lock, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { PRESTIGE_PERKS, TOTAL_PERK_COST, type PerkId } from '../../constants/perks';
import { hasPerk } from '../../engine/systems/perkEngine';
import { formatCurrency } from '../../engine/math/bigNumber';
import { Card, CardHeader } from '../ui/Card';
import { hint } from '../ui/hint';
import { perkHint } from './perkHint';
import { lifetimeCashForSlips } from './prestigeProjection';

export const PerkConstellation: React.FC = () => {
  const slipsHeld = useGameStore((s) => s.sovereignImmunitySlips);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);
  const unlockPerk = useGameStore((s) => s.unlockPerk);
  const [refusal, setRefusal] = useState<string | null>(null);

  const ownedCount = PRESTIGE_PERKS.filter((p) => hasPerk(unlockedPerks, p.id)).length;
  const sayNo = (message: string) => {
    setRefusal(message);
    window.setTimeout(() => setRefusal(null), 2600);
  };

  const handleBuy = (id: PerkId, cost: number) => {
    if (!hasPrestigeAccess) {
      sayNo('THE CAYMANS ARE SEALED. Move a bilateral tariff dial first.');
      return;
    }
    if (hasPerk(unlockedPerks, id)) return;
    if (slipsHeld < cost) {
      sayNo(`SHORT ${cost - slipsHeld} SLIP${cost - slipsHeld === 1 ? '' : 'S'}. You hold ${slipsHeld}.`);
      return;
    }
    if (!unlockPerk(id)) sayNo('The clerk rejected the filing. Nothing was charged.');
  };

  return (
    <Card material="paper" className="shrink-0">
      <CardHeader
        title="Perk Constellation"
        icon={<Sparkles className="w-3.5 h-3.5 text-gold-600" />}
        right={
          <span className="t-caption font-mono font-black text-gold-700 shrink-0">
            {ownedCount}/{PRESTIGE_PERKS.length} · {slipsHeld} SIS
          </span>
        }
      />

      {/* Three columns, not two. At two, six tall cards overflowed the channel
          and it scrolled — which trades 640px of dead space for 240px of hidden
          content rather than actually filling it. */}
      <div className="grid grid-cols-3 gap-1.5">
        {PRESTIGE_PERKS.map((perk) => {
          const owned = hasPerk(unlockedPerks, perk.id);
          const canAffordIt = slipsHeld >= perk.cost;
          const isNext = !owned && canAffordIt;

          return (
            <div
              key={perk.id}
              className={`rounded-lg border p-1.5 transition-colors ${
                owned
                  ? 'border-gold-600/60 bg-gold-500/10'
                  : isNext
                    ? 'border-gold-500 hover:border-gold-400 bg-gold-500/5'
                    : 'border-newsprint-300 bg-newsprint-200/60'
              }`}
            >
              <div className="flex items-start justify-between gap-1">
                <span className="t-micro font-black uppercase leading-tight text-newsprint-900 min-w-0">
                  {perk.name}
                </span>

                {owned ? (
                  <span
                    className="shrink-0 px-1 py-0.5 rounded bg-gold-600/20 border border-gold-700/60 text-gold-800 font-mono t-caption font-black"
                    aria-label={`${perk.name} owned`}
                  >
                    FILED
                  </span>
                ) : (
                  <button
                    onClick={() => handleBuy(perk.id, perk.cost)}
                    aria-disabled={!canAffordIt || !hasPrestigeAccess}
                    {...hint(
                      perkHint(perk, owned, slipsHeld),
                      canAffordIt && hasPrestigeAccess
                        ? `Buy ${perk.name} for ${perk.cost} Sovereign Immunity Slip${perk.cost === 1 ? '' : 's'}`
                        : undefined
                    )}
                    className={`shrink-0 px-1 py-0.5 rounded font-mono t-caption font-black flex items-center gap-0.5 transition-all ${
                      canAffordIt && hasPrestigeAccess
                        ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-newsprint-950 hover:from-gold-400 active:scale-95 cursor-pointer'
                        : 'bg-newsprint-300 text-newsprint-800 cursor-not-allowed'
                    }`}
                  >
                    {!canAffordIt && <Lock className="w-2.5 h-2.5" aria-hidden />}
                    {perk.cost}
                  </button>
                )}
              </div>

              <div className="t-caption font-mono font-bold text-gold-700 leading-tight mt-0.5">
                {perk.effectLabel}
              </div>
              <p className="t-caption text-newsprint-800/90 leading-snug mt-0.5">{perk.summary}</p>
            </div>
          );
        })}
      </div>

      {/* One line, and computed. A second copy of the prestige exponent written
          out here is a second thing to rot; `lifetimeCashForSlips` inverts the
          real constants instead. */}
      <p className="t-caption font-mono text-newsprint-800/80 leading-snug mt-1.5">
        All six: {TOTAL_PERK_COST} Slips — {formatCurrency(lifetimeCashForSlips(TOTAL_PERK_COST))} of
        lifetime earnings, cash term only.
      </p>

      {refusal && (
        <div
          role="status"
          aria-live="polite"
          className="mt-1.5 t-caption text-center font-mono font-bold text-wax-600 animate-pulse"
        >
          {refusal}
        </div>
      )}
    </Card>
  );
};
