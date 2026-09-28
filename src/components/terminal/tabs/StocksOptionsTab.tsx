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
import { Card } from '../../ui';

export const StocksOptionsTab: React.FC = () => {
  const stocks = useGameStore((s) => s.stocks);
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
  const [collateralAmount, setCollateralAmount] = useState<number>(1000);
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);

  const activeStock = stocks[selectedStock] || stocks['DOOR'];
  const symbols = Object.keys(stocks) as StockSymbol[];
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
    if (currentTreasury < collateralAmount) {
      setTradeStatus('Insufficient cash for collateral!');
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
        <div className="border-l-2 border-amber-500 bg-amber-950/30 px-2 py-1.5">
          <span className="block t-caption font-mono font-black uppercase text-amber-400">First Trade</span>
          <span className="block t-micro leading-snug text-stone-300">{tradeGuide}</span>
          {nextUnlockHint && <span className="mt-1 block t-caption font-mono text-amber-300/90">{nextUnlockHint}</span>}
        </div>

        {/* Active Stock Candlestick Telemetry */}
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-2 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-stone-200 text-xs">${selectedStock}</span>
              <span className="t-micro text-stone-400 font-mono truncate max-w-[120px]">
                {activeStock?.name}
              </span>
            </div>
            <span className="t-caption text-stone-500 font-mono block">
              Base: ${activeStock?.basePrice.toFixed(2)} // Volatility: {vexVolatility.toFixed(0)}%
            </span>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-sm block text-amber-300">
              ${activeStock?.currentPrice.toFixed(2)}
            </span>
            {activeStock && (
              <span
                className={`t-caption font-mono flex items-center justify-end gap-0.5 ${
                  activeStock.currentPrice >= activeStock.basePrice ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {activeStock.currentPrice >= activeStock.basePrice ? (
                  <TrendingUp className="w-2.5 h-2.5" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5" />
                )}
                {(activeStock.currentPrice - activeStock.basePrice).toFixed(2)}
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Watchlist Ladder (All 9 Stocks) — rows share the available height so the
          ladder fills its column instead of leaving a gap beneath the last row. */}
      <Card density="flush" className="flex-1 min-h-0 flex flex-col overflow-hidden bg-stone-950/60">
        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-stone-800/70 flex flex-col">
          {symbols.map((sym) => {
            const stk = stocks[sym];
            if (!stk) return null;
            const isSelected = selectedStock === sym;
            const isUp = stk.currentPrice >= stk.basePrice;

            return (
              <button
                type="button"
                key={sym}
                onClick={() => setSelectedStock(sym)}
                aria-pressed={isSelected}
                className={`w-full text-left flex justify-between items-center px-2 py-1.5 min-h-[30px] flex-1 cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-stone-800/90 text-amber-200 shadow-[inset_2px_0_0_0] shadow-amber-500'
                    : 'hover:bg-stone-900/70'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[11px] text-stone-200">${sym}</span>
                  <span className="t-caption text-stone-500 hidden sm:inline">{stk.sector.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[11px] text-stone-300">
                    ${stk.currentPrice.toFixed(2)}
                  </span>
                  <span className={`t-caption font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isUp ? '▲' : '▼'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>

      {/* Active Open Option Trades & Early Settlement */}
      {activeTrades.length > 0 && (
        <div className="shrink-0 rounded border border-emerald-900/60 bg-stone-950 p-1.5">
          <span className="t-caption font-mono font-bold text-emerald-400 uppercase flex items-center gap-1">
            <Clock className="w-2.5 h-2.5 animate-spin" />
            Active 0DTE Positions ({activeTrades.length})
          </span>
          <div className="mt-1 space-y-1 max-h-[75px] overflow-y-auto custom-scrollbar">
            {activeTrades.map((t) => (
              (() => {
                const currentPrice = stocks[t.symbol]?.currentPrice ?? t.entryPrice;
                const currentPnl = calculateOptionReturn(
                  t.type,
                  t.entryPrice,
                  currentPrice,
                  t.leverage,
                  t.collateralLocked,
                  vexVolatility,
                  activeUpgrades.includes('darkpool_fiber')
                );
                const pnlLabel = `${currentPnl >= 0 ? '+' : '-'}${formatCurrency(Math.abs(currentPnl))}`;
                const secondsLeft = Math.max(0, Math.ceil((t.expiresAtTimestamp - Date.now()) / 1000));

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 bg-stone-900/90 border border-stone-800 p-1 rounded t-caption font-mono"
                  >
                    <span className="min-w-0">
                      <span className={`block truncate ${t.type === 'PUT' ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}`}>
                        ${t.symbol} {t.leverage}x {t.type}{t.isWalkBackCombo ? ' · SQUEEZE CALL' : ''} ({t.contractsCount} contracts · {formatCurrency(t.collateralLocked)} risk)
                      </span>
                      <span className={currentPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        P&amp;L {pnlLabel} · {secondsLeft}s left
                      </span>
                      <span className="block text-stone-500">
                        Strike ${t.strikePrice.toFixed(2)} · Target ${t.targetPrice.toFixed(2)}
                      </span>
                    </span>
                    <button
                      onClick={() => settleOptionTrade(t.id)}
                      title="Lock in the current result and close this position"
                      className="shrink-0 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-stone-950 font-black rounded font-mono uppercase t-caption cursor-pointer flex items-center gap-0.5 active:scale-95 transition-all"
                    >
                      <CheckCircle className="w-2.5 h-2.5" />
                      <span>SETTLE</span>
                    </button>
                  </div>
                );
              })()
            ))}
          </div>
        </div>
      )}

      {/* 0DTE Options Order Slip */}
      <Card density="tight" className="shrink-0 bg-stone-950 space-y-2">
        <div className="flex justify-between items-center t-micro font-mono">
          <span className="text-stone-400">Leverage:</span>
          <div className="flex gap-1">
            {[10, 100, 1000].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLeverage(lvl)}
                className={`px-1.5 py-0.5 rounded t-caption font-bold font-mono transition-colors cursor-pointer ${
                  leverage === lvl ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {lvl}x
              </button>
            ))}
          </div>
        </div>

        {/* Collateral Selector */}
        <div className="flex justify-between items-center t-micro font-mono">
          <span className="text-stone-400">Collateral:</span>
          <div className="flex gap-1">
            {[500, 1000, 5000].map((amt) => (
              <button
                key={amt}
                onClick={() => setCollateralAmount(amt)}
                className={`px-1.5 py-0.5 rounded t-caption font-bold font-mono transition-colors cursor-pointer ${
                  collateralAmount === amt
                    ? 'bg-emerald-500 text-stone-950 font-black'
                    : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                ${amt >= 1000 ? `${amt / 1000}k` : amt}
              </button>
            ))}
          </div>
        </div>

        {/* Action Triggers */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => handleTrade('PUT')}
            className="py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 text-stone-950 font-black rounded font-mono uppercase tracking-wider t-micro active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <TrendingDown className="w-3 h-3" />
            <span>Short {leverage}x PUT</span>
          </button>
          <button
            onClick={() => handleTrade('CALL')}
            title={isWalkBackWindowActive && selectedStock !== lastTargetStockSymbol
              ? `Only a CALL on $${lastTargetStockSymbol} qualifies for this walk-back window`
              : isWalkBackWindowActive
              ? `Arm a $${lastTargetStockSymbol} CALL before the ${Math.ceil(walkBackSecondsRemaining)}s window closes`
              : 'Open a regular CALL position'}
            className={`py-1.5 text-stone-950 font-black rounded font-mono uppercase tracking-wider t-micro active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer ${isWalkBackWindowActive && selectedStock === lastTargetStockSymbol ? 'bg-gradient-to-r from-amber-400 to-emerald-400 ring-2 ring-amber-300' : 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500'}`}
          >
            <TrendingUp className="w-3 h-3" />
            <span>{isWalkBackWindowActive && selectedStock === lastTargetStockSymbol ? `Arm ${leverage}x CALL` : `Bull ${leverage}x CALL`}</span>
          </button>
        </div>

        {tradeStatus && (
          <div className="t-caption text-center font-mono font-bold text-amber-400 animate-pulse">
            {tradeStatus}
          </div>
        )}
      </Card>
    </div>
  );
};
