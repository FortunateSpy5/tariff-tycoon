/**
 * Breaking News Bar & Header HUD (Single 48px Bar)
 * High-density Bloomberg-style top rail: Brand title, scrolling ticker marquee,
 * treasury cash & favor counters, and audio/shake quick toggles.
 */

import React from 'react';
import { Volume2, VolumeX, ShieldAlert, Zap, Radio } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import type { StockSymbol } from '../../types/market';

const HEADLINES = [
  'WALL STREET RALLIES ON 3:00 AM TARIFF POST // ANALYSTS SHOCKED',
  'FRUIT ECOSYSTEM INTRODUCES $3,500 REPLACEMENT POWER CORD',
  'CUSTOMS CONFISCATES 400 WHEELS OF GREAT NORTHERN MAPLE BRIE AT GATE 99B',
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
  const phase = useGameStore((s) => s.phase);

  return (
    <div className="w-full h-12 bg-stone-900/95 border-b border-stone-800 text-stone-200 select-none shadow-md px-3 flex items-center justify-between gap-3 overflow-hidden">
      {/* 1. Left: Brand & Phase Status */}
      <div className="flex items-center gap-2 shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${isCapsFrenzy ? 'bg-red-500 animate-ping' : 'bg-red-600 animate-pulse'}`} />
        <span className="font-black text-xs sm:text-sm tracking-wider text-amber-500 uppercase font-mono">
          Executive Degen
        </span>
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono border font-semibold ${
          isCapsFrenzy 
            ? 'bg-red-950 text-red-300 border-red-600 animate-pulse' 
            : 'bg-stone-800 text-stone-400 border-stone-700'
        }`}>
          {isCapsFrenzy ? '🚨 FRENZY' : phase === 1 ? 'GATE 99B' : 'OVAL // 3 AM'}
        </span>
      </div>

      {/* 2. Center: Seamless Marquee Ticker */}
      <div className="flex-1 min-w-0 flex items-center gap-2 bg-stone-950/80 py-1 px-2.5 rounded-md border border-stone-800/80 overflow-hidden text-xs">
        <div className="flex items-center gap-1 font-bold text-red-500 shrink-0 uppercase tracking-wider text-[11px]">
          <Radio className="w-3 h-3 animate-pulse" />
          <span className="hidden sm:inline">NEWS:</span>
        </div>

        <div className="flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-flex items-center animate-marquee">
            {[0, 1].map((copyIndex) => (
              <div
                key={copyIndex}
                aria-hidden={copyIndex === 1}
                className="inline-flex items-center gap-6 shrink-0 pr-6"
              >
                {(['PAIN', 'FRUT', 'GIGA', 'DOOR', 'MICR'] as StockSymbol[]).map((sym) => {
                  const stock = stocks[sym];
                  if (!stock) return null;
                  const delta = stock.currentPrice - stock.basePrice;
                  const isUp = delta >= 0;
                  return (
                    <span key={sym} className="font-mono text-[11px] inline-flex items-center gap-1">
                      <span className="font-bold text-stone-300">${sym}</span>
                      <span className="text-stone-400">${stock.currentPrice.toFixed(2)}</span>
                      <span className={isUp ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {isUp ? '▲' : '▼'}{Math.abs(delta).toFixed(1)}
                      </span>
                    </span>
                  );
                })}

                {HEADLINES.map((headline, idx) => (
                  <span key={idx} className="text-stone-400 text-[11px] font-sans tracking-wide">
                    • {headline}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Right: Metrics & Controls */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 font-mono">
        {/* Treasury Cash */}
        <div className="text-right">
          <div className="text-xs sm:text-sm font-black text-emerald-400 flex items-baseline justify-end gap-1">
            <span>{formatCurrency(treasuryCash)}</span>
            {passiveCashPerSecond > 0 && (
              <span className="text-[10px] text-emerald-500/80 font-normal">
                +{formatCurrency(passiveCashPerSecond)}/s
              </span>
            )}
          </div>
        </div>

        {/* Crony Favor */}
        <div className="text-right hidden sm:block">
          <span className="text-xs font-bold text-amber-400 flex items-center gap-1" title="Crony Favor">
            🤝 {cronyFavor}
          </span>
        </div>

        {/* Sovereign Immunity Slips */}
        {sovereignImmunitySlips > 0 && (
          <div className="text-right hidden md:block">
            <span className="text-xs font-bold text-indigo-400 flex items-center gap-1" title="Sovereign Immunity Slips">
              📜 {sovereignImmunitySlips}
            </span>
          </div>
        )}

        {/* Audio & Shake Toggles */}
        <div className="flex items-center gap-0.5 border-l border-stone-800 pl-2">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
            className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-stone-300" />}
          </button>
          <button
            onClick={toggleScreenShake}
            title={screenShakeEnabled ? 'Disable Screen Shake [Z]' : 'Enable Screen Shake [Z]'}
            className="p-1 rounded hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
          >
            {screenShakeEnabled ? <Zap className="w-3.5 h-3.5 text-amber-400" /> : <ShieldAlert className="w-3.5 h-3.5 text-stone-500" />}
          </button>
        </div>
      </div>
    </div>
  );
};
