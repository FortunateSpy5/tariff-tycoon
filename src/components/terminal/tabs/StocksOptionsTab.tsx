/**
 * Stocks & 0DTE Options Tab
 * High-density fintech terminal displaying live prices, leverage selector, and short/call buttons.
 */

import React, { useState } from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { useGameStore } from '../../../store/useGameStore';
import type { StockSymbol, OptionType } from '../../../types/market';

export const StocksOptionsTab: React.FC = () => {
  const stocks = useGameStore((s) => s.stocks);
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const openOptionTrade = useGameStore((s) => s.openOptionTrade);
  const activeUpgrades = useGameStore((s) => s.activeUpgrades);

  const [selectedStock, setSelectedStock] = useState<StockSymbol>('DOOR');
  const [leverage, setLeverage] = useState<number>(100);
  const [collateralAmount, setCollateralAmount] = useState<number>(1000);
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);

  const activeStock = stocks[selectedStock] || stocks['DOOR'];
  const symbols: StockSymbol[] = ['PAIN', 'DOOR', 'FRUT', 'GIGA', 'MICR'];

  const handleTrade = (type: OptionType) => {
    if (treasuryCash < collateralAmount) {
      setTradeStatus('Insufficient cash for collateral!');
      setTimeout(() => setTradeStatus(null), 2000);
      return;
    }

    const success = openOptionTrade(selectedStock, type, leverage, collateralAmount);
    if (success) {
      const bonus = activeUpgrades.includes('darkpool_fiber') ? ' (+50% FIBER PERK)' : '';
      setTradeStatus(`STRIKE ${leverage}x ${type} ON $${selectedStock}${bonus}!`);
      setTimeout(() => setTradeStatus(null), 2500);
    }
  };

  return (
    <div className="space-y-2 flex-1 flex flex-col justify-between select-none">
      <div>
        {/* Active Stock Candlestick Telemetry */}
        <div className="bg-stone-950 border border-stone-800 rounded-lg p-2.5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-stone-200 text-xs">${selectedStock}</span>
              <span className="text-[10px] text-stone-400 font-mono truncate max-w-[120px]">
                {activeStock?.name}
              </span>
            </div>
            <span className="text-[9px] text-stone-500 font-mono block">
              Base: ${activeStock?.basePrice.toFixed(2)} // Volatility: 420%
            </span>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-sm block text-amber-300">
              ${activeStock?.currentPrice.toFixed(2)}
            </span>
            {activeStock && (
              <span
                className={`text-[9px] font-mono flex items-center justify-end gap-0.5 ${
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

        {/* Watchlist Ladder */}
        <div className="space-y-1 mt-1.5 max-h-[140px] overflow-y-auto custom-scrollbar pr-0.5">
          {symbols.map((sym) => {
            const stk = stocks[sym];
            if (!stk) return null;
            const isSelected = selectedStock === sym;
            const isUp = stk.currentPrice >= stk.basePrice;

            return (
              <div
                key={sym}
                onClick={() => setSelectedStock(sym)}
                className={`flex justify-between items-center p-1.5 rounded border cursor-pointer transition-colors ${
                  isSelected
                    ? 'bg-stone-800/90 border-amber-500/80 shadow-sm'
                    : 'bg-stone-950/80 border-stone-800/80 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-bold text-[11px] text-stone-200">${sym}</span>
                  <span className="text-[9px] text-stone-500 hidden sm:inline">{stk.sector.split(' ')[0]}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[11px] text-stone-300">
                    ${stk.currentPrice.toFixed(2)}
                  </span>
                  <span className={`text-[9px] font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isUp ? '▲' : '▼'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 0DTE Options Order Slip */}
      <div className="bg-stone-950 border border-stone-800 rounded-lg p-2 space-y-2 mt-auto">
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-stone-400">Leverage:</span>
          <div className="flex gap-1">
            {[10, 100, 1000].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setLeverage(lvl)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition-colors ${
                  leverage === lvl ? 'bg-amber-500 text-stone-950 font-black' : 'bg-stone-800 text-stone-400 hover:text-stone-200'
                }`}
              >
                {lvl}x
              </button>
            ))}
          </div>
        </div>

        {/* Collateral Selector */}
        <div className="flex justify-between items-center text-[10px] font-mono">
          <span className="text-stone-400">Collateral:</span>
          <div className="flex gap-1">
            {[500, 1000, 5000].map((amt) => (
              <button
                key={amt}
                onClick={() => setCollateralAmount(amt)}
                className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition-colors ${
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
            className="py-1.5 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 text-stone-950 font-black rounded font-mono uppercase tracking-wider text-[10px] active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <TrendingDown className="w-3 h-3" />
            <span>Short {leverage}x PUT</span>
          </button>
          <button
            onClick={() => handleTrade('CALL')}
            className="py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 text-stone-950 font-black rounded font-mono uppercase tracking-wider text-[10px] active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer"
          >
            <TrendingUp className="w-3 h-3" />
            <span>Bull {leverage}x CALL</span>
          </button>
        </div>

        {tradeStatus && (
          <div className="text-[9px] text-center font-mono font-bold text-amber-400 animate-pulse">
            {tradeStatus}
          </div>
        )}
      </div>
    </div>
  );
};
