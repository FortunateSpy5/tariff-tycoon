/**
 * D.U.M.P. Agencies Tab
 * Chainsaw list of federal agencies to liquidate for sequential multi-million dollar cash injections.
 * Enforces sequential gating so higher-tier agencies unlock progressively.
 *
 * INVARIANT: [The Guillotine Is Sequential]
 * Agency N+1 is unreachable until N is scrapped. That rule lived only in the
 * render branch that swapped in a lock badge — a real rule with no handler-side
 * check, so any future caller of `liquidateAgency` could skip it. It is now also
 * enforced in `handleLiquidate`.
 */

import React, { useState } from 'react';
import { Scissors, AlertTriangle, CheckCircle, Lock, Handshake } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import { formatCurrency } from '../../../engine/math/bigNumber';
import { CRONY_FAVOR_LIQUIDATION_KICKBACK_RATIO } from '../../../constants/balance';
import { DossierHeader } from '../DossierHeader';
import { hint } from '../../ui/hint';
import { agencyFavorCost } from '../../../store/slices/dumpSlice';
import { PARDON_COST_REDUCTION } from '../../../constants/perks';
import type { AgencyLiquidation } from '../../../types/dump';

export const DumpAgenciesTab: React.FC = () => {
  const agencies = useGameStore((s) => s.agencies);
  const cronyFavor = useGameStore((s) => s.cronyFavor);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const hasCronyUnlocksAccess = useGameStore((s) => s.hasCronyUnlocksAccess);
  const hasTariffAccess = useGameStore((s) => s.hasTariffAccess);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);
  const liquidateAgency = useGameStore((s) => s.liquidateAgency);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const totalCashHarvested = useGameStore((s) => s.totalCashHarvested);
  const activeHazardsCount = useGameStore((s) => s.activeHazardsCount);
  const disasterCapitalismRevenue = useGameStore((s) => s.disasterCapitalismRevenue);
  const [alertMsg, setAlertMsg] = useState<string | null>(null);

  /** Favor actually spent: the committee kickbacks a quarter of the bribe. */
  const netFavorCost = (cost: number) => cost - Math.floor(cost * CRONY_FAVOR_LIQUIDATION_KICKBACK_RATIO);

  const handleLiquidate = (
    agencyId: string,
    name: string,
    yieldAmt: number,
    favorCost: number,
    minCash: number
  ) => {
    // INVARIANT: [The Guillotine Is Sequential] — re-check the prerequisite here,
    // not only in the render branch. The store will happily scrap any agency by
    // id, so the ordering rule has to be enforced by the caller that owns it.
    const index = agencies.findIndex((a) => a.id === agencyId);
    if (index > 0 && !agencies[index - 1].isLiquidated) {
      setAlertMsg(`The committee will not skip a letter. ${agencies[index - 1].acronym} first.`);
      setTimeout(() => setAlertMsg(null), 2500);
      return;
    }
    if (cronyFavor < favorCost) {
      setAlertMsg(`Needs ${favorCost} Crony Favor to bribe liquidation committee!`);
      setTimeout(() => setAlertMsg(null), 2500);
      return;
    }
    if (treasuryCash < minCash) {
      setAlertMsg(`Needs ${formatCurrency(minCash)} Treasury cash to unlock!`);
      setTimeout(() => setAlertMsg(null), 2500);
      return;
    }

    const cash = liquidateAgency(agencyId);
    if (cash > 0) {
      setAlertMsg(`SCRAPPED ${name}! Injected +${formatCurrency(yieldAmt)} (+15% Heat)!`);
      setTimeout(() => setAlertMsg(null), 2500);
    } else {
      // INVARIANT: [Never Fail Silently] — `liquidateAgency` also refuses below
      // Phase 2, which this handler does not mirror. A store refusal that
      // produces no message at all is the worst version of the silent-no-op
      // bug: the button animates and nothing happens.
      setAlertMsg('The guillotine jammed. Nothing happened.');
      setTimeout(() => setAlertMsg(null), 2500);
    }
  };

  /**
   * Hover text for one scrapping.
   *
   * INVARIANT: names the favor cost, the net cost after kickback, the net-worth
   * gate, the cash yield, the heat, and the sequential prerequisite — because
   * the button itself only ever showed a bare `+$cash`, which is the number the
   * player is about to gain and none of the numbers they must first pay.
   * The favor cost comes from `agencyFavorCost` — the SAME helper
   * `liquidateAgency` charges with. Printing `agency.cronyFavorCost` would quote
   * the undiscounted price to a player holding the Pardon Assembly Line.
   */
  const scrapHint = (agency: AgencyLiquidation, index: number, prev: AgencyLiquidation | null) => {
    const gate =
      index === 0
        ? 'It is first in the book, so nothing stands in front of it.'
        : `Locked until ${prev?.acronym ?? 'the previous agency'} is scrapped — the guillotine runs one letter at a time.`;
    const favorCost = agencyFavorCost(agency, unlockedPerks);
    return (
      `Scrap the ${agency.acronym} (${agency.name}). Pays ${formatCurrency(agency.liquidationCashYield)} ` +
      `into the Treasury and scales passive income by ${agency.passivePerkMultiplier}x for the rest of the run. ` +
      `Costs ${favorCost} Crony Favor${
        favorCost < agency.cronyFavorCost
          ? ` — the Pardon Assembly Line takes ${PARDON_COST_REDUCTION * 100}% off the usual ${agency.cronyFavorCost}`
          : ''
      } — the committee kickbacks ` +
      `${Math.round(CRONY_FAVOR_LIQUIDATION_KICKBACK_RATIO * 100)}%, so the true cost is ` +
      `${netFavorCost(favorCost)} — plus +15% S.L.O.P. heat, and a new standing hazard. Requires ` +
      `${formatCurrency(agency.minNetWorthRequired)} in the bank. ${gate} ` +
      `Perk: ${agency.perkDescription}. Hazard: ${agency.hazardDescription}.`
    );
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 select-none">
      <div className="shrink-0">
        <DossierHeader
          icon={<Scissors className="w-3.5 h-3.5 text-accent-ink" />}
          title="Federal Agency Guillotine"
          status="Hatchet Orders"
        />

        {(totalCashHarvested > 0 || activeHazardsCount > 0) && (
          <div className="mt-2 grid grid-cols-3 gap-1 t-micro font-mono text-center">
            <div className="surface-sheet border border-line rounded px-1 py-0.5">
              <span className="block text-ink-3 uppercase">Harvested</span>
              <span className="text-live-ink font-bold">{formatCurrency(totalCashHarvested)}</span>
            </div>
            <div className="surface-sheet border border-line rounded px-1 py-0.5">
              <span className="block text-ink-3 uppercase">Hazards</span>
              <span className="text-accent-ink font-bold">{activeHazardsCount}</span>
            </div>
            <div className="surface-sheet border border-line rounded px-1 py-0.5">
              <span className="block text-ink-3 uppercase">Disaster Rev</span>
              <span className="text-live-ink font-bold">{formatCurrency(disasterCapitalismRevenue)}</span>
            </div>
          </div>
        )}

        {!hasCronyUnlocksAccess && (
          <p className="mt-2 border-l-2 border-accent-ink/70 bg-accent/15 px-2 py-1 t-micro text-ink-1">
            First liquidation opens the Crony lobbying shop.
          </p>
        )}
        {hasCronyUnlocksAccess && !hasTariffAccess && (
          <p className="mt-2 border-l-2 border-live-ink/70 bg-live-wash/15 px-2 py-1 t-micro text-ink-1">
            Buy your first upgrade to gain authority over bilateral tariffs.
          </p>
        )}
        {hasTariffAccess && !hasPrestigeAccess && (
          <p className="mt-2 border-l-2 border-accent-ink/70 bg-accent/15 px-2 py-1 t-micro text-ink-1">
            Adjust a tariff dial to unlock the Cayman reorganization.
          </p>
        )}
      </div>

      {/* Agency List — flexes to fill remaining vertical space */}
      <div className="flex-1 min-h-0 space-y-2 overflow-y-auto custom-scrollbar pr-0.5">
        {agencies.map((agency, index) => {
            const isScrapped = agency.isLiquidated;
            const isUnlocked = index === 0 || agencies[index - 1].isLiquidated;
            const previousAgency = index > 0 ? agencies[index - 1] : null;
            // INVARIANT: [The Quoted Price Is The Charged Price] — the card, the
            // hover and `liquidateAgency` all read this one helper, so the
            // Pardon Assembly Line's discount cannot appear in one and not the
            // others.
            const favorCost = agencyFavorCost(agency, unlockedPerks);
            const hasFavor = cronyFavor >= favorCost;
            // The net-worth line is a REQUIREMENT, not a price, so it is
            // deliberately NOT `canAfford` — the QE As A Service buffer applies
            // to purchases, and letting it apply here would green-light a card
            // reading "Requires $50,000 in the bank" for a player in debt. Must
            // match `liquidateAgency` exactly, or the button lies.
            const hasCash = treasuryCash >= agency.minNetWorthRequired;
            const canAffordIt = hasFavor && hasCash;

            /* ISSUE-014. Names the shortfall on the card, not only in the bubble.
               Both branches are the SAME predicate `canAffordIt` tests, and each
               figure comes from the same source the engine charges with — so this
               is a readout, never a second opinion. A player who is short on both
               sees both, because the cheapest-looking one to fix is not always the
               one that is actually closest. */
            const favorShort = Math.max(0, favorCost - Math.floor(cronyFavor));
            const cashShort = Math.max(0, agency.minNetWorthRequired - treasuryCash);
            const gateShortfall =
              favorShort > 0 && cashShort > 0
                ? `${favorShort}F + ${formatCurrency(cashShort)}`
                : favorShort > 0
                ? `NEED ${favorShort} FAVOR`
                : `NEED ${formatCurrency(cashShort)}`;

            return (
              <div
                key={agency.id}
                className={`p-2 rounded-lg border transition-all ${
                  isScrapped
                    ? 'bg-card border-line opacity-60'
                    : isUnlocked
                    ? 'surface-sheet border-line hover:border-accent-ink/60'
                    : 'bg-card border-line opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-ink-2 text-xs">{agency.acronym}</span>
                      <span className="t-micro text-ink-3 font-mono">({agency.name})</span>
                    </div>
                    <p className="t-caption text-live-ink font-mono mt-0.5">
                      Perk: {agency.perkDescription}
                    </p>
                    <p className="t-caption text-accent-ink font-mono flex items-center gap-1 mt-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <Handshake className="w-2.5 h-2.5" aria-hidden />
                      Cost: {favorCost} Favor
                      {favorCost < agency.cronyFavorCost && (
                        <span className="text-live-ink line-through">{agency.cronyFavorCost}</span>
                      )}{' '}
                      // Req: {formatCurrency(agency.minNetWorthRequired)}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    {isScrapped ? (
                      <span className="px-2 py-0.5 rounded bg-panel text-ink-3 font-mono t-caption font-bold flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5" />
                        SCRAPPED
                      </span>
                    ) : isUnlocked ? (
                      <button
                        onClick={() =>
                          handleLiquidate(
                            agency.id,
                            agency.acronym,
                            agency.liquidationCashYield,
                            favorCost,
                            agency.minNetWorthRequired
                          )
                        }
                        // INVARIANT: [Gated Controls Use aria-Disabled, Not disabled]
                        // A native `disabled` swallows pointer events, which would
                        // delete the hover text naming the very gate that closed
                        // this button. The guard in `handleLiquidate` is the real
                        // enforcement. See `HintTooltip`.
                        aria-disabled={!canAffordIt}
                        {...hint(
                          scrapHint(agency, index, previousAgency),
                          `Scrap the ${agency.acronym} for ${formatCurrency(agency.liquidationCashYield)}`
                        )}
                        className={`px-2.5 py-1 rounded font-mono t-micro font-bold transition-all shadow ${
                          canAffordIt
                            ? 'bg-gradient-to-r from-accent to-accent hover:from-accent text-ink-1 font-black active:scale-95 cursor-pointer'
                            : 'bg-panel text-ink-3 cursor-not-allowed'
                        }`}
                      >
                        <Scissors className="w-3 h-3" aria-hidden />
                        {canAffordIt ? (
                          <>+{formatCurrency(agency.liquidationCashYield)}</>
                        ) : (
                          /* ISSUE-014 [A Gated Button Must Show Its Own Shortfall].
                             The card printed `+$250K` — the yield, the only number
                             the player GAINS — and left every number they must
                             first PAY to the hover bubble. The two states differed
                             only by a dimmer fill, which on a warm surface at 9.5px
                             is a difference the player has to be told to see.

                             So the closed state leads with the gate instead: a lock,
                             and the amount actually missing. `gateShortfall` names
                             BOTH binding gates, because a player short on favor
                             and short on cash is short on both and telling them
                             only about the one checked last is how you get a
                             support ticket about an invisible requirement. It is
                             derived from the same `agencyFavorCost` helper
                             `liquidateAgency` charges with, and it only ever
                             renders on the `!canAffordIt` branch — so the picture
                             and the click test cannot disagree. */
                          <>
                            <Lock className="w-2.5 h-2.5" aria-hidden />
                            {gateShortfall}
                          </>
                        )}
                      </button>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-well border border-term-line text-ink-3 font-mono t-caption font-semibold flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        Awaits {previousAgency?.acronym}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {alertMsg && (
        <div className="shrink-0 p-1.5 rounded bg-accent/20 border border-accent-ink/50 text-center font-mono t-micro font-bold text-accent-ink animate-pulse">
          {alertMsg}
        </div>
      )}
    </div>
  );
};
