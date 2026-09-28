/**
 * Breaking News Bar & Header HUD (Single 48px Bar)
 * High-density Bloomberg-style top rail: Brand title, scrolling ticker marquee,
 * treasury cash & favor counters, and audio/shake quick toggles.
 */

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  ShieldAlert,
  Zap,
  Radio,
  RotateCcw,
  Handshake,
  ScrollText,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import { ResetGameModal } from '../dialogs/ResetGameModal';
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
  const [isResetOpen, setIsResetOpen] = useState(false);

  return (
    /* REDESIGN [B2 — Newsprint Rail]:
       This was the last fully un-themed surface and the single most
       screenshot-visible element in the game: a 48px strip of generic dark
       stone running the full width of the cockpit. Under the
       [Newsprint & Classified] direction the top rail is now aged newsprint,
       so the app reads as a stack of government paperwork from the first
       pixel rather than a dark dashboard with a paper accent in the corner.

       The marquee keeps its own dark inset well so the moving text stays
       legible — a light bar with light scrolling text would be unreadable. */
    <div className="surface-newsprint w-full h-12 border-b-2 border-newsprint-900 shadow-md px-3 flex items-center justify-between gap-3 overflow-hidden">
      {/* 1. Left: Brand & Phase Status */}
      <div className="flex items-center gap-2 shrink-0">
        <div className={`w-2.5 h-2.5 rounded-full ${isCapsFrenzy ? 'bg-red-600 animate-ping' : 'bg-wax-500'}`} />
        <span className="font-black text-xs sm:text-sm tracking-wider text-newsprint-900 uppercase font-mono">
          Executive Degen
        </span>
        <span
          className={`t-micro px-1.5 py-0.5 rounded-sm font-mono border font-semibold ${
            isCapsFrenzy
              ? 'bg-wax-500 text-newsprint-50 border-wax-600'
              : 'bg-newsprint-900 text-newsprint-100 border-newsprint-900'
          }`}
        >
          {isCapsFrenzy ? 'FRENZY' : phase === 1 ? 'GATE 99B' : 'OVAL // 3 AM'}
        </span>
      </div>

      {/* 2. Center: Seamless Marquee Ticker — dark inset well on paper stock */}
      <div className="flex-1 min-w-0 flex items-center gap-2 bg-newsprint-950 py-1 px-2.5 rounded-sm border border-newsprint-900 overflow-hidden">
        <div className="flex items-center gap-1 font-bold text-wax-500 shrink-0 uppercase tracking-wider t-micro">
          <Radio className="w-3 h-3" />
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
                    <span key={sym} className="font-mono t-micro inline-flex items-center gap-1">
                      <span className="font-bold text-newsprint-100">${sym}</span>
                      <span className="text-newsprint-300">${stock.currentPrice.toFixed(2)}</span>
                      <span className={isUp ? 'text-phosphor-400 font-semibold' : 'text-red-400 font-semibold'}>
                        {isUp ? '▲' : '▼'}{Math.abs(delta).toFixed(1)}
                      </span>
                    </span>
                  );
                })}

                {HEADLINES.map((headline, idx) => (
                  <span key={idx} className="text-newsprint-200 t-micro font-sans tracking-wide">
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
          <div className="text-xs sm:text-sm font-black text-newsprint-900 flex items-baseline justify-end gap-1">
            <span>{formatCurrency(treasuryCash)}</span>
            {passiveCashPerSecond > 0 && (
              <span className="t-micro text-phosphor-600 font-normal">
                +{formatCurrency(passiveCashPerSecond)}/s
              </span>
            )}
          </div>
        </div>

        {/* Crony Favor — B4: Handshake icon replaces the 🤝 emoji. */}
        <div className="text-right hidden sm:block">
          <span
            className="text-xs font-bold text-wax-500 flex items-center gap-1"
            title="Crony Favor"
          >
            <Handshake className="w-3.5 h-3.5" aria-hidden />
            {Math.floor(cronyFavor)}
          </span>
        </div>

        {/* Sovereign Immunity Slips — B4: ScrollText replaces the 📜 emoji. */}
        {sovereignImmunitySlips > 0 && (
          <div className="text-right hidden md:block">
            <span
              className="text-xs font-bold text-newsprint-800 flex items-center gap-1"
              title="Sovereign Immunity Slips"
            >
              <ScrollText className="w-3.5 h-3.5" aria-hidden />
              {sovereignImmunitySlips}
            </span>
          </div>
        )}

        {/* Audio, Shake & Reset Controls — icons tuned for the paper stock. */}
        <div className="flex items-center gap-0.5 border-l border-newsprint-300 pl-2">
          <button
            onClick={toggleMute}
            title={isMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            className="p-1 rounded text-newsprint-800 hover:bg-newsprint-300/50 transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-wax-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={toggleScreenShake}
            title={screenShakeEnabled ? 'Disable Screen Shake [Z]' : 'Enable Screen Shake [Z]'}
            aria-label="Toggle screen shake"
            className="p-1 rounded text-newsprint-800 hover:bg-newsprint-300/50 transition-colors cursor-pointer"
          >
            {screenShakeEnabled ? (
              <Zap className="w-3.5 h-3.5 text-wax-500" />
            ) : (
              <ShieldAlert className="w-3.5 h-3.5 text-newsprint-300" />
            )}
          </button>
          <button
            onClick={() => setIsResetOpen(true)}
            title="Reset Game / Wipe Local Save"
            aria-label="Reset game"
            className="p-1 rounded text-newsprint-800 hover:bg-wax-500 hover:text-newsprint-50 transition-colors cursor-pointer ml-0.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ResetGameModal isOpen={isResetOpen} onClose={() => setIsResetOpen(false)} />
    </div>
  );
};
