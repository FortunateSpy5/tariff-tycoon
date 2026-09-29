/**
 * Watchlist Ladder — all nine BagHolder Pro tickers as a full-height ladder.
 *
 * WHY EXTRACTED
 * The ladder used to be a 33-line inline `.map` inside `StocksOptionsTab`, which
 * put the row markup between the trade-guide copy and the order slip and made
 * the tab file grow every time a row learned to explain itself. It is a presentational
 * list with no store reads of its own, so it takes its data as props and the tab
 * keeps only the wiring.
 */

import React from 'react';
import type { StockDefinition, StockSymbol } from '../../../types/market';
import { Card } from '../../ui/Card';
import { hint } from '../../ui/hint';
import { stockHint } from './stockHint';

interface WatchlistLadderProps {
  stocks: Record<StockSymbol, StockDefinition>;
  symbols: StockSymbol[];
  selectedStock: StockSymbol;
  tariffRates: Record<string, number>;
  onSelect: (symbol: StockSymbol) => void;
}

/** Price with no decimal noise; rows are ~30px tall and cannot afford two lines. */
function rowPriceLabel(stock: StockDefinition): string {
  return `$${stock.currentPrice.toFixed(2)}`;
}

export const WatchlistLadder: React.FC<WatchlistLadderProps> = ({
  stocks,
  symbols,
  selectedStock,
  tariffRates,
  onSelect,
}) => (
  /* Watchlist Ladder (All 9 Stocks) — rows share the available height so the
     ladder fills its column instead of leaving a gap beneath the last row. */
  <Card material="term" density="flush" className="flex-1 min-h-0 flex flex-col overflow-hidden">
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar divide-y divide-phosphor-600/20 flex flex-col">
      {symbols.map((sym) => {
        const stk = stocks[sym];
        if (!stk) return null;
        const isSelected = selectedStock === sym;
        const isUp = stk.currentPrice >= stk.basePrice;
        const delta = (stk.currentPrice - stk.basePrice).toFixed(2);
        // The row's visible text is a bare ticker, a sector fragment, a price and
        // a lone ▲/▼ glyph, so it needs a real accessible name, not a symbol.
        const name = `$${sym}, ${isUp ? 'up' : 'down'} ${delta} from base at ${rowPriceLabel(stk)}`;

        return (
          <button
            type="button"
            key={sym}
            onClick={() => onSelect(sym)}
            aria-pressed={isSelected}
            {...hint(stockHint(sym, stk, tariffRates), name)}
            className={`w-full text-left flex justify-between items-center px-2 py-1.5 min-h-[30px] flex-1 cursor-pointer transition-colors ${
              isSelected
                ? 'bg-phosphor-900 text-gold-300 shadow-[inset_2px_0_0_0] shadow-gold-500'
                : 'hover:bg-phosphor-900/60'
            }`}
          >
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold t-micro text-phosphor-300">${sym}</span>
              <span className="t-caption text-phosphor-600 hidden sm:inline">{stk.sector.split(' ')[0]}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-semibold t-micro text-phosphor-300">{rowPriceLabel(stk)}</span>
              <span
                className={`t-caption font-mono ${isUp ? 'text-emerald-400' : 'text-red-400'}`}
                aria-hidden
              >
                {isUp ? '▲' : '▼'}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  </Card>
);
