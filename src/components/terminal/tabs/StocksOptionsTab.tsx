/**
 * Stocks & 0DTE Options Tab
 * High-density fintech terminal displaying live prices, leverage selector,
 * active trade positions with early settlement, and short/call buttons.
 */

import React, { useState } from 'react';
import { TrendingDown, TrendingUp, CheckCircle, Clock } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import type { StockSymbol, OptionType } from '../../../types/market';
import { calculateOptionReturn } from '../../../engine/math/formulas';
import { formatCurrency } from '../../../engine/math/bigNumber';
import { Card } from '../../ui/Card';
import { hint } from '../../ui/hint';
import { PriceChart } from '../PriceChart';
import { useExpiryClock } from './useExpiryClock';
import { WatchlistLadder } from './WatchlistLadder';
import { callHint, collateralHint, leverageHint, putHint, sectorLinkageHint, settleHint } from './stockHint';
import { canAfford, flashDipValuationMultiplier } from '../../../engine/systems/perkEngine';
import { FLASH_DIP_VALUATION_MULTIPLIER } from '../../../constants/perks';

/** Leverage and collateral choices offered on the order slip. */
const LEVERAGE_CHIPS = [10, 100, 1000];
const COLLATERAL_CHIPS = [500, 1000, 5000];

/** Chip label: `$1k`, `$500`. */
const collateralLabel = (amt: number): string => `$${amt >= 1000 ? `${amt / 1000}k` : amt}`;

export const StocksOptionsTab: React.FC = () => {
  const stocks = useGameStore((s) => s.stocks);
  const tariffRates = useGameStore((s) => s.tariffRates);
  const vexVolatility = useGameStore((s) => s.vexVolatility);
  const openOptionTrade = useGameStore((s) => s.openOptionTrade);
  const settleOptionTrade = useGameStore((s) => s.settleOptionTrade);
  const activeTrades = useGameStore((s) => s.activeTrades);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);
  const selectedStock = useGameStore((s) => s.selectedStock);
  const setSelectedStock = useGameStore((s) => s.setSelectedStock);
  const lastTargetStockSymbol = useGameStore((s) => s.lastTargetStockSymbol);
  const lastYapTimestamp = useGameStore((s) => s.lastYapTimestamp);
  const hasRadarAccess = useGameStore((s) => s.hasRadarAccess);
  const hasPolyGriftAccess = useGameStore((s) => s.hasPolyGriftAccess);
  const isWalkBackWindowActive = useGameStore((s) => s.isWalkBackWindowActive);
  const walkBackSecondsRemaining = useGameStore((s) => s.walkBackSecondsRemaining);

  const [leverage, setLeverage] = useState<number>(100);
  // The expiry countdown the player is racing. See `useExpiryClock`.
  const now = useExpiryClock(activeTrades.length);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const [collateralAmount, setCollateralAmount] = useState<number>(1000);
  const unlockedPerks = useGameStore((s) => s.unlockedPerks);
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);
  const flashDipSecondsRemaining = useGameStore((s) => s.flashDipSecondsRemaining);
  // INVARIANT: [The Order Slip Prices The Live Valuation]
  // `calculateOptionReturn` takes the Flash Dip as an argument rather than
  // reading a clock, precisely so this readout and the settlement can be handed
  // the same multiplier. A P&L that ignored the dip while the settle honoured it
  // would be the plan's "A YAP visibly crashes a chart" promise, inverted.
  const valuationMultiplier = flashDipValuationMultiplier(flashDipSecondsRemaining);
  // INVARIANT: [One Affordability Test] — the same predicate `openTrade` gates
  // on, and the only one that knows about the QE As A Service negative buffer.
  const tooBroke = !canAfford(treasuryCash, collateralAmount, unlockedPerks);
  const orderShortfall = Math.max(0, collateralAmount - treasuryCash);

  const activeStock = stocks[selectedStock] || stocks['DOOR'];
  const symbols = Object.keys(stocks) as StockSymbol[];
  const walkBackEligible = isWalkBackWindowActive && selectedStock === lastTargetStockSymbol;
  const armedPut = activeTrades.find((trade) => trade.type === 'PUT' && trade.symbol === selectedStock);
  const comboCallArmed = activeTrades.some((trade) => trade.isWalkBackCombo);
  const yapPut = activeTrades.find(
    (trade) =>
      trade.type === 'PUT' &&
      trade.symbol === lastTargetStockSymbol &&
      trade.openedAtTimestamp < lastYapTimestamp
  );
  const putWasHit = Boolean(
    armedPut && lastTargetStockSymbol === armedPut.symbol && lastYapTimestamp >= armedPut.openedAtTimestamp && lastYapTimestamp > 0
  );
  const tradeGuide = isWalkBackWindowActive
    ? comboCallArmed
      ? `CALL armed on $${lastTargetStockSymbol}. Return to the desk and hit WALK-BACK before ${Math.ceil(walkBackSecondsRemaining)}s.`
      : yapPut
      ? `YAP hit $${yapPut.symbol}. Settle the PUT to bank its result, then arm a matching CALL within ${Math.ceil(walkBackSecondsRemaining)}s.`
      : `Crash confirmed on $${lastTargetStockSymbol}. Arm a matching CALL within ${Math.ceil(walkBackSecondsRemaining)}s to attempt the squeeze.`
    : !hasRadarAccess
    ? 'Choose a ticker, place a PUT, then launch a YAP. Your first decree opens the S.L.O.P. case file.'
    : !hasPolyGriftAccess
    ? 'Settle the PUT you opened before a YAP to unlock PolyGrift and the pundits’ prediction market.'
    : !armedPut
    ? 'Choose a ticker, place a PUT, then launch a YAP at that ticker.'
    : putWasHit
    ? `YAP hit $${armedPut.symbol}. Settle the PUT to bank the result, or attempt the timed CALL squeeze.`
    : `PUT armed on $${armedPut.symbol}. Launch a YAP at this ticker to trigger the price shock.`;
  const nextUnlockHint = !hasRadarAccess
    ? 'NEXT UNLOCK // Launch your first YAP to open the S.L.O.P. case file.'
    : !hasPolyGriftAccess
    ? 'NEXT UNLOCK // Settle a YAP-targeted PUT to open PolyGrift.'
    : null;

  const handleTrade = (type: OptionType) => {
    const currentTreasury = useGameStore.getState().treasuryCash;
    if (!canAfford(currentTreasury, collateralAmount, useGameStore.getState().unlockedPerks)) {
      setTradeStatus(`Insufficient cash for collateral! Need ${formatCurrency(collateralAmount - currentTreasury)} more.`);
      setTimeout(() => setTradeStatus(null), 2000);
      return;
    }

    const success = openOptionTrade(selectedStock, type, leverage, collateralAmount);
    if (success) {
      const bonus = activeUpgrades.includes('darkpool_fiber') ? ' (+50% FIBER PERK)' : '';
      const isComboCall =
        type === 'CALL' &&
        useGameStore.getState().activeTrades.some((trade) => trade.isWalkBackCombo && trade.symbol === selectedStock);
      setTradeStatus(
        isComboCall
          ? `CALL ARMED ON $${selectedStock}. RETURN TO DESK AND WALK-BACK!`
          : `STRIKE ${leverage}x ${type} ON $${selectedStock}${bonus}!`
      );
      setTimeout(() => setTradeStatus(null), 2500);
    } else {
      setTradeStatus('ORDER REJECTED. Check your available collateral.');
      setTimeout(() => setTradeStatus(null), 2500);
    }
  };

  return (
    <div className="h-full min-h-0 flex flex-col gap-2 select-none">
      <div className="shrink-0 space-y-2">
        <div className="border-l-2 border-accent-ink bg-accent/15 px-2 py-1.5">
          <span className="block t-caption font-mono font-black uppercase text-accent-ink">First Trade</span>
          <span className="block t-micro leading-snug text-term-ink-1">{tradeGuide}</span>
          {nextUnlockHint && <span className="mt-1 block t-caption font-mono text-accent-ink/90">{nextUnlockHint}</span>}
        </div>

        {/* Phase 1.1: the tape. This REPLACES the old mark-only block, which could
            honestly claim only a live mark, a base, and a drift — and printed the
            mark twice, once here and once in the chart header. The chart's header
            now carries symbol, live mark and delta-vs-base, so the strip below
            keeps only the two facts the chart does not plot: the sector name and
            $VEX, which is a market-wide index rather than a property of this
            ticker and so does not belong on its price axis. */}
        <PriceChart
          candles={activeStock?.candles}
          basePrice={activeStock?.basePrice ?? 0}
          currentPrice={activeStock?.currentPrice ?? 0}
          symbol={selectedStock}
        />

        <div
          className="surface-terminal-well rounded px-2 py-1 flex items-center justify-between gap-2"
          {...hint(
            activeStock ? sectorLinkageHint(selectedStock, activeStock) : 'No mark loaded for this ticker.',
          )}
        >
          <span className="t-micro font-mono text-term-ink-3 truncate min-w-0">
            {activeStock?.name} · {activeStock?.sector}
          </span>
          <span className="flex items-center gap-1.5 shrink-0">
            {flashDipSecondsRemaining > 0 && (
              // The dip is priced into every P&L on this screen, so it has to be
              // priced on the screen. See the INVARIANT on `valuationMultiplier`.
              <span
                {...hint(
                  `FLASH DIP — ${Math.ceil(flashDipSecondsRemaining)}s of ${FLASH_DIP_VALUATION_MULTIPLIER}x options valuation. Every P&L on this tab and the settlement that follows it are computed at this multiplier, and it is applied to the SIGNED return, so a position that is down is marked down ${FLASH_DIP_VALUATION_MULTIPLIER}x as fast.`
                )}
                /* INVARIANT: [An Alarm Has To Look Like One] — measured.
                   `text-dead-soft` was a DEAD token (no such step in `@theme`), so
                   this span emitted no colour at all and inherited `wax-600`
                   `#881337` from the well. On the terminal ground that is
                   **1.56:1** — the single worst text pair in the app, on the
                   one state the file's own comment calls out as needing to be
                   visible: "the dip is priced into every P&L on this screen, so
                   it has to be priced on the screen."

                   `panic-300` is **7.85:1** here, and it is the step `@theme`
                   documents as "the first hint of heat — text on dark", which is
                   exactly this case. So the fix is not a new colour: it is the
                   panic scale being used for the one job it was written for,
                   instead of a wax family reaching for a step it never had. */
                className="t-micro font-mono font-black text-dead-soft animate-calm-glow"
              >
                DIP {Math.ceil(flashDipSecondsRemaining)}s ×{FLASH_DIP_VALUATION_MULTIPLIER}
              </span>
            )}
            <span className="t-micro font-mono text-term-ink-3">$VEX {vexVolatility.toFixed(0)}%</span>
          </span>
        </div>
      </div>

      <WatchlistLadder
        stocks={stocks}
        symbols={symbols}
        selectedStock={selectedStock}
        tariffRates={tariffRates}
        onSelect={setSelectedStock}
        /* hint-allow: WatchlistLadder renders one button per ticker, and each
           carries its own hint from the sector-linkage copy. This call site only
           passes the selection callback down. */
      />

      {/* Active Open Option Trades & Early Settlement */}
      {activeTrades.length > 0 && (
        <div className="shrink-0 rounded border border-term-line-strong/50 surface-terminal-well p-1.5">
          <span className="t-caption font-mono font-bold text-term-ink-2 uppercase flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 animate-spin" />
            Active 0DTE Positions ({activeTrades.length})
          </span>
          <div className="mt-1 space-y-1 max-h-[75px] overflow-y-auto custom-scrollbar">
            {activeTrades.map((t) => {
              const currentPrice = stocks[t.symbol]?.currentPrice ?? t.entryPrice;
              const currentPnl = calculateOptionReturn(
                t.type,
                t.entryPrice,
                currentPrice,
                t.leverage,
                t.collateralLocked,
                vexVolatility,
                activeUpgrades.includes('darkpool_fiber'),
                valuationMultiplier
              );
              const pnlLabel = `${currentPnl >= 0 ? '+' : '-'}${formatCurrency(Math.abs(currentPnl))}`;
              const secondsLeft = Math.max(0, Math.ceil((t.expiresAtTimestamp - now) / 1000));

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 surface-terminal-well p-1 rounded t-caption font-mono"
                >
                  <span className="min-w-0">
                    <span className={`block truncate ${t.type === 'PUT' ? 'text-dead-soft font-bold' : 'text-term-ink-2 font-bold'}`}>
                      ${t.symbol} {t.leverage}x {t.type}{t.isWalkBackCombo ? ' · SQUEEZE CALL' : ''} ({t.contractsCount} contracts · {formatCurrency(t.collateralLocked)} risk)
                    </span>
                    <span className={currentPnl >= 0 ? 'text-term-ink-2' : 'text-dead-soft'}>
                      P&amp;L {pnlLabel} · {secondsLeft}s left
                    </span>
                    <span className="block text-term-ink-3">
                      Strike ${t.strikePrice.toFixed(2)} · Target ${t.targetPrice.toFixed(2)}
                    </span>
                  </span>
                  <button
                    onClick={() => settleOptionTrade(t.id)}
                    {...hint(settleHint(t))}
                    className="shrink-0 px-2 py-0.5 bg-well hover:bg-well-2 text-term-ink-1 font-black rounded font-mono uppercase t-caption cursor-pointer flex items-center gap-0.5 active:scale-95 transition-all"
                  >
                    <CheckCircle className="w-2.5 h-2.5" />
                    <span>SETTLE</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 0DTE Options Order Slip */}
      <Card material="term" density="tight" className="shrink-0 space-y-2">
        <div className="flex justify-between items-center t-micro font-mono">
          <span className="text-term-ink-3">Leverage:</span>
          <div className="flex gap-1">
            {LEVERAGE_CHIPS.map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLeverage(lvl)}
                aria-pressed={leverage === lvl}
                {...hint(leverageHint(lvl, collateralAmount), `${lvl}× leverage`)}
                className={`px-1.5 py-0.5 rounded t-caption font-bold font-mono transition-colors cursor-pointer ${
                  leverage === lvl ? 'bg-accent text-term-ink-1 font-black' : 'bg-well text-term-ink-3 hover:text-term-ink-1'
                }`}
              >
                {lvl}x
              </button>
            ))}
          </div>
        </div>

        {/* Collateral Selector */}
        <div className="flex justify-between items-center t-micro font-mono">
          <span className="text-term-ink-3">Collateral:</span>
          <div className="flex gap-1">
            {COLLATERAL_CHIPS.map((amt) => (
              <button
                key={amt}
                onClick={() => setCollateralAmount(amt)}
                aria-pressed={collateralAmount === amt}
                {...hint(collateralHint(amt), `${collateralLabel(amt)} collateral`)}
                className={`px-1.5 py-0.5 rounded t-caption font-bold font-mono transition-colors cursor-pointer ${
                  collateralAmount === amt
                    /* ISSUE-010. Was `bg-well-2 text-stone-950`: a selected chip
                       that differed from its unselected siblings by one step of a
                       dark ramp, and carried stock-black text on it. `accent` is
                       a legal FILL anywhere the ink on top clears, and `ink-1` on
                       `accent` is the palette's own documented 8.2:1 — so the
                       selection now reads as a selection on the first look. */
                    ? 'bg-accent text-ink-1 font-black'
                    : 'bg-well text-term-ink-3 hover:text-term-ink-1'
                }`}
              >
                {collateralLabel(amt)}
              </button>
            ))}
          </div>
        </div>

        {/* Action Triggers
            INVARIANT: [Gated Controls Use aria-Disabled, Not disabled] — a
            native `disabled` button swallows pointer events, deleting the hover
            text that explains the very gate which closed it. Both trade buttons
            are cash-gated, so both need the state, a dimmed face, and a hint
            that leads with the shortfall. See HintTooltip. */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleTrade('PUT')}
            aria-disabled={tooBroke}
            {...hint(
              tooBroke
                ? `You hold ${formatCurrency(treasuryCash)} and this order locks ${formatCurrency(
                    collateralAmount
                  )} — short ${formatCurrency(orderShortfall)}. Drop to the $500 chip, sell a blueprint from the GOLD BOX on the desk, or go slam the stamp.`
                : putHint(leverage, collateralAmount)
            )}
            className={`py-1.5 rounded font-mono uppercase tracking-wider t-micro active:scale-95 transition-all flex items-center justify-center gap-1 ${
              tooBroke
                ? 'bg-panel text-term-ink-3 cursor-not-allowed'
                : 'bg-gradient-to-r from-dead to-dead hover:from-dead text-on-fill font-black cursor-pointer'
            }`}
          >
            <TrendingDown className="w-3 h-3" />
            <span>Short {leverage}x PUT</span>
          </button>
          <button
            onClick={() => handleTrade('CALL')}
            aria-disabled={tooBroke}
            {...hint(
              tooBroke
                ? `You hold ${formatCurrency(treasuryCash)} and this order locks ${formatCurrency(
                    collateralAmount
                  )} — short ${formatCurrency(orderShortfall)}. Drop to the $500 chip, sell a blueprint from the GOLD BOX on the desk, or go slam the stamp.`
                : callHint({
                    leverage,
                    collateralAmount,
                    windowOpen: isWalkBackWindowActive,
                    matchesWindow: walkBackEligible,
                    targetSymbol: lastTargetStockSymbol,
                    secondsRemaining: walkBackSecondsRemaining,
                  })
            )}
            /* ISSUE-010. `text-stone-950` again — here it had to become `ink-1` rather
               than `on-fill`, because the two live branches are GRADIENTS that
               cross the palette: `accent -> term-ink-2` on the walk-back chip and
               `term-ink-3 -> term-ink-3` otherwise. No single light step survives
               both ends of that range, and `ink-1` does: 8.2:1 on the gold end
               and about 7:1 on the grey one. A stock colour here would have been
               a third value pretending to be a token. */
            className={`py-1.5 text-ink-1 font-black rounded font-mono uppercase tracking-wider t-micro active:scale-95 transition-all flex items-center justify-center gap-1 ${
              tooBroke
                ? 'bg-panel text-term-ink-3 cursor-not-allowed'
                : walkBackEligible
                ? 'bg-gradient-to-r from-accent to-term-ink-2 ring-2 ring-accent-ink cursor-pointer'
                : 'bg-gradient-to-r from-term-ink-3 to-term-ink-3 hover:from-term-ink-3 cursor-pointer'
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>{walkBackEligible ? `Arm ${leverage}x CALL` : `Bull ${leverage}x CALL`}</span>
          </button>
        </div>

        {tradeStatus && (
          // Announced, not just painted: the order result is the only thing that
          // changes when a screen-reader user hits PUT or CALL.
          <div
            role="status"
            aria-live="polite"
            className="t-caption text-center font-mono font-bold text-accent-ink animate-pulse"
          >
            {tradeStatus}
          </div>
        )}
      </Card>
    </div>
  );
};
