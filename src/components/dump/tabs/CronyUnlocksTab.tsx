/**
 * Crony Unlocks Tab: The Oligarch Tech Tree
 * Permanent upgrade store to scale manual click yield, autopen interns, and 0DTE multipliers.
 *
 * INVARIANT: [The First Purchase Is Also A Key]
 * `buyUpgrade` sets `hasTariffAccess` on every purchase, so any upgrade opens
 * the bilateral tariff dials. The banner above the list says as much; the hint
 * on the cheapest upgrade now says it too, because that is where a player
 * actually decides which box to buy first.
 */

import React, { useState } from 'react';
import { Award, Check, Sparkles } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { INITIAL_CRONY_UPGRADES } from '../../../constants/unlocks';
import { formatCurrency } from '../../../engine/math/bigNumber';
import { DossierHeader } from '../DossierHeader';
import { hint } from '../../ui/hint';
import { canAfford } from '../../../engine/systems/perkEngine';

/**
 * Hover text for one upgrade.
 *
 * Every entry states the actual mechanical effect rather than the flavour
 * description printed beneath the name — the two are not the same thing, and the
 * flavour is the one the player has already read.
 */
const UPGRADE_HINTS: Record<string, string> = {
  heavy_tungsten_nib:
    'Doubles every manual click, applied after the phase, ink, frenzy and SIS multipliers have already run — so it compounds with all of them rather than replacing them. It does not touch autopen income, which pays a flat rate. This is also the cheapest box in the shop, and the first purchase of any kind is what opens the tariff dials.',
  autopen_army:
    'Five clicks a second, forever, and it never touches the nib — so it generates no tantrum and feeds no frenzy. Pays $25/s in Phase 1 and $250/s from Phase 2 up, a flat rate that ignores your Slips and your Tungsten Nib. Buy it once clicking has stopped being the bottleneck.',
  diet_soda_drip:
    'Tantrum accrues at 2.25 per inked click instead of 1.5, so the meter fills half again as fast and CAPS LOCK FRENZY comes round roughly a third sooner. A dry nib still builds nothing: this buys speed toward the 10x burst, not the burst itself.',
  darkpool_fiber:
    'Multiplies 0DTE payouts by 1.5 — but only on trades that are already in profit. A losing contract is still a full 100% of locked collateral, and this does not touch the YAP crash that puts you underwater in the first place.',
  broad_daylight_printer:
    'Bolts a $BRRR button to the blotter: $100,000 a pull, one pull per 60 seconds, and +15% S.L.O.P. heat every time. At a minute of cooldown it is roughly $1,667/s while it runs, which is why the heat cost is worth reading before the number is.',
};

export const CronyUnlocksTab: React.FC = () => {
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);
  const hasTariffAccess = useGameStore((s) => s.hasTariffAccess);
  const buyUpgrade = useGameStore((s) => s.buyUpgrade);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const [feedback, setFeedback] = useState<string | null>(null);

  // INVARIANT: [One Affordability Test] — `canAfford` is the same predicate
  // `buyUpgrade` charges with, and the only one that knows about the QE As A
  // Service negative buffer. A local `treasuryCash >= upg.cost` here would grey
  // out a purchase the store would happily accept, and no test would catch it.
  const handleBuy = (upgradeId: string, name: string, cost: number) => {
    if (!canAfford(treasuryCash, cost, unlockedPerks)) {
      setFeedback(`Need ${formatCurrency(cost)} to unlock ${name}!`);
      setTimeout(() => setFeedback(null), 2000);
      return;
    }

    const success = buyUpgrade(upgradeId);
    if (success) {
      setFeedback(`UNLOCKED ${name}!`);
      setTimeout(() => setFeedback(null), 2500);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 select-none">
      <div className="shrink-0">
        <DossierHeader
          icon={<Award className="w-3.5 h-3.5 text-accent-ink" />}
          title="Oligarch Lobbying Upgrades"
          status="Permanent Multipliers"
        />

        {!hasTariffAccess && (
          <p className="mt-2 border-l-2 border-accent-ink/70 bg-accent-wash/70 px-2 py-1 t-micro text-ink-3">
            Your first purchase gets you a seat at the tariff dials.
          </p>
        )}
      </div>

      {/* Upgrades List — flexes to fill remaining vertical space */}
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
        {INITIAL_CRONY_UPGRADES.map((upg) => {
            const isOwned = activeUpgrades.includes(upg.id);
            const canAffordIt = canAfford(treasuryCash, upg.cost, unlockedPerks);

            return (
              <div
                key={upg.id}
                className={`p-2 rounded-lg border transition-all ${
                  isOwned
                    ? 'bg-card border-line opacity-60'
                    : 'surface-sheet border-line hover:border-live-ink/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5 font-mono font-bold text-ink-2 text-xs">
                      <span>{upg.name}</span>
                      <Sparkles className="w-2.5 h-2.5 text-accent-ink" />
                    </div>
                    <p className="t-caption text-ink-3 font-mono mt-0.5 leading-snug">
                      {upg.description}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {isOwned ? (
                      <span className="px-2 py-0.5 rounded bg-live-wash/20 border border-live-ink/50 text-live-ink font-mono t-caption font-bold flex items-center gap-1">
                        <Check className="w-2.5 h-2.5" />
                        ACQUIRED
                      </span>
                    ) : (
                      <button
                        onClick={() => handleBuy(upg.id, upg.name, upg.cost)}
                        // INVARIANT: [Gated Controls Use aria-Disabled, Not disabled]
                        // A native `disabled` swallows pointer events and would
                        // hide the hover text explaining the shortfall. The guard
                        // in `handleBuy` does the enforcing. See `HintTooltip`.
                        aria-disabled={!canAffordIt}
                        {...hint(
                          `${upg.name} — ${UPGRADE_HINTS[upg.id] ?? upg.description} Costs ${formatCurrency(upg.cost)} up front and nothing after; the multiplier is permanent for the run.`,
                          `Buy the ${upg.name} for ${formatCurrency(upg.cost)}`
                        )}
                        className={`px-2.5 py-1 rounded font-mono t-micro font-bold transition-all ${
                          canAffordIt ? 'bg-live-wash hover:bg-live-wash text-ink-1 active:scale-95 shadow cursor-pointer font-black'
                            : 'bg-panel text-ink-3 cursor-not-allowed'
                        }`}
                      >
                        {formatCurrency(upg.cost)}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {feedback && (
        <div className="shrink-0 p-1.5 rounded bg-live-wash/15 border border-live-ink/50 text-center font-mono t-micro font-bold text-live-ink animate-pulse">
          {feedback}
        </div>
      )}
    </div>
  );
};

