/**
 * Breaking News Bar & Header Ticker
 * Displays macro treasury cash, currency counters, sound/shake controls, and a scrolling news ticker.
 */

import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Zap, Radio } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import type { StockSymbol } from '../../types/market';

const HEADLINES = [
  'WALL STREET RALLIES ON 3:00 AM TARIFF POST // ANALYSTS SHOCKED',
  'FRUIT ECOSYSTEM INTRODUCES $3,500 REPLACEMENT POWER CORD',
  'CUSTOMS CONFISCATES 400 WHEELS OF CANADIAN MAPLE BRIE AT GATE 99B',
  'D.U.M.P. HATCHET MEN SPOTTED OUTSIDE WEATHER BUREAU WITH CHAINSAWS',
  'GIGAFLEX WEDGETRUCK RUST DEFENSE DECLARED UNCONSTITUTIONAL',
  'THE S&PAIN 500 INCHES TOWARD RECORD DISASTER // BUY PUTS',
  'SWISS CHANCELLOR OFFERS 40 KLLIK-BLOK BRICKS AS TARIFF SETTLEMENT',
];

export const BreakingNewsBar: React.FC = () => {
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const passiveCashPerSecond = useGameStore((s) => s.passiveCashPerSecond);
  const cronyFavor = useGameStore((s) => s.cronyFavor);
  const sovereignImmunitySlips = useGameStore((s) => s.sovereignImmunitySlips);
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const screenShakeEnabled = useGameStore((s) => s.screenShakeEnabled);
  const toggleScreenShake = useGameStore((s) => s.toggleScreenShake);
  const stocks = useGameStore((s) => s.stocks);
  const isCapsFrenzy = useGameStore((s) => s.isCapsFrenzy);

  return (
    <header className="w-full bg-stone-900 border-b border-stone-800 text-stone-200 select-none shadow-md">
      {/* Top Status Bar */}
      <div className="max-w-7xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-3">
        {/* Logo & Phase Title */}
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-600 animate-pulse" />
          <span className="font-black text-sm tracking-widest text-amber-500 uppercase">
            Executive Degen
          </span>
          <span className="text-xs bg-stone-800 text-stone-400 px-2 py-0.5 rounded border border-stone-700">
            {isCapsFrenzy ? '🚨 CAPS LOCK FRENZY' : '3:14 AM // OVAL TERMINAL'}
          </span>
        </div>

        {/* Currency Counters */}
        <div className="flex items-center gap-4 sm:gap-6 font-mono text-sm">
          {/* Treasury Cash */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-sans">
              Treasury Cash
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-black text-emerald-400">
                {formatCurrency(treasuryCash)}
              </span>
              {passiveCashPerSecond > 0 && (
                <span className="text-xs text-emerald-500/80">
                  +{formatCurrency(passiveCashPerSecond)}/s
                </span>
              )}
            </div>
          </div>

          {/* Crony Favor */}
          <div className="flex flex-col items-end">
            <span className="text-[10px] text-stone-400 uppercase tracking-wider font-sans">
              Crony Favor
            </span>
            <span className="font-bold text-amber-400 flex items-center gap-1">
              🤝 {cronyFavor}
            </span>
          </div>

          {/* Sovereign Immunity Slips */}
          {sovereignImmunitySlips > 0 && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-stone-400 uppercase tracking-wider font-sans">
                Immunity Slips
              </span>
              <span className="font-bold text-indigo-400 flex items-center gap-1">
                📜 {sovereignImmunitySlips}
              </span>
            </div>
          )}
        </div>

        {/* Control Toggles */}
        <div className="flex items-center gap-1">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleScreenShake}
            title={screenShakeEnabled ? 'Disable Screen Shake' : 'Enable Screen Shake'}
            className="p-1.5 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors"
          >
            {screenShakeEnabled ? <Zap className="w-4 h-4 text-amber-400" /> : <ShieldAlert className="w-4 h-4 text-stone-500" />}
          </button>
        </div>
      </div>

      {/* Scrolling Breaking News Ticker */}
      <div className="bg-stone-950 py-1 px-4 border-t border-stone-800 flex items-center gap-3 overflow-hidden text-xs">
        <div className="flex items-center gap-1 font-bold text-red-500 shrink-0 uppercase tracking-wider">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>Breaking:</span>
        </div>

        {/* Ticker items */}
        <div className="flex items-center gap-8 overflow-x-hidden whitespace-nowrap animate-marquee">
          {/* Stock Tickers */}
          {(['PAIN', 'FRUT', 'GIGA', 'DOOR'] as StockSymbol[]).map((sym) => {
            const stock = stocks[sym];
            if (!stock) return null;
            const delta = stock.currentPrice - stock.basePrice;
            const isUp = delta >= 0;
            return (
              <span key={sym} className="font-mono flex items-center gap-1">
                <span className="font-semibold text-stone-300">${sym}</span>
                <span className="text-stone-400">${stock.currentPrice.toFixed(2)}</span>
                <span className={isUp ? 'text-emerald-400' : 'text-red-400'}>
                  {isUp ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}
                </span>
              </span>
            );
          })}

          {/* Satirical Crawl */}
          {HEADLINES.map((headline, idx) => (
            <span key={idx} className="text-stone-400 font-sans tracking-wide">
              {headline}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
};
