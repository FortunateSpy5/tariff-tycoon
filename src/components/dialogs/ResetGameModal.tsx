/**
 * ResetGameModal.tsx
 * Satirical Hard Reset / Chapter 7 Liquidation Confirmation Dialog.
 * Allows player to completely wipe all saved progress from localStorage and reload cleanly.
 *
 * INVARIANT: the confirm button's hint must enumerate the real blast radius of
 * `settingsSlice.hardResetGame` — it removes the single `executive_degen_save_v1`
 * key and reloads, so every field in the store's persist `partialize` list dies
 * with it, INCLUDING Sovereign Immunity Slips. A Flight to the Caymans
 * deliberately preserves those; this does not, and the copy must not imply
 * otherwise. A destructive control that understates its cost is a data-loss bug.
 */

import React from 'react';
import { AlertOctagon, Flame, X, RotateCcw } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { formatCurrency } from '../../engine/math/bigNumber';
import { hint } from '../ui/hint';
import { CUSTOMS_LOCATION } from '../../constants/setting';

interface ResetGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ResetGameModal: React.FC<ResetGameModalProps> = ({ isOpen, onClose }) => {
  const treasuryCash = useGameStore((s) => s.treasuryCash);
  const phase = useGameStore((s) => s.phase);
  const totalClicks = useGameStore((s) => s.totalClicks);
  const sovereignImmunitySlips = useGameStore((s) => s.sovereignImmunitySlips);
  const hardResetGame = useGameStore((s) => s.hardResetGame);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-ink-1/85 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="surface-classified border-2 border-dead-ink/80 rounded-xl max-w-md w-full shadow-2xl shadow-well-2/60 overflow-hidden text-term-ink-1 font-sans relative">
        {/* Top Danger Banner */}
        <div className="bg-gradient-to-r from-dead via-dead to-well-2 p-4 border-b border-dead-ink/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-dead text-term-ink-1">
              <AlertOctagon className="w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className="font-mono font-black text-sm text-term-ink-1 tracking-wider uppercase">
                Chapter 7 Insolvency
              </h2>
              <span className="font-mono t-micro text-term-ink-1 block">
                Total Economic Erasure // Hard Reset
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            {...hint('Stand down. Nothing has been touched yet — the save is exactly as intact as it was one click ago.', 'Cancel and close')}
            className="p-1 rounded-lg text-term-ink-2 hover:text-term-ink-1 hover:bg-well/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5">
          <p className="text-xs text-term-ink-1 leading-relaxed">
            Are you sure you want to <span className="font-bold text-dead-soft">permanently incinerate all save data</span>?
            This will wipe your treasury, liquidate all open positions, cancel active upgrades, and deport you
            directly back to{' '}
            <span className="font-bold text-accent-ink">{CUSTOMS_LOCATION}</span> with{' '}
            <span className="font-bold text-live-soft">$100 seed cash</span>.
          </p>

          {/* Incineration Preview */}
          <div className="bg-well/90 border border-term-line rounded-lg p-3 space-y-1.5 font-mono text-xs">
            <span className="t-micro text-term-ink-2 font-bold block uppercase tracking-wider">
              Assets Marked for Destruction:
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1 t-caption">
              <div className="bg-well-2 p-2 rounded border border-term-line/80">
                <span className="text-term-ink-3 block t-caption">CURRENT STAGE</span>
                <span className="text-accent-ink font-bold">Phase {phase}</span>
              </div>
              <div className="bg-well-2 p-2 rounded border border-term-line/80">
                <span className="text-term-ink-3 block t-caption">TREASURY CASH</span>
                <span className="text-live-soft font-bold">{formatCurrency(treasuryCash)}</span>
              </div>
              <div className="bg-well-2 p-2 rounded border border-term-line/80">
                <span className="text-term-ink-3 block t-caption">LIFETIME CLICKS</span>
                <span className="text-term-ink-1 font-bold">{totalClicks.toLocaleString()}</span>
              </div>
              <div className="bg-well-2 p-2 rounded border border-term-line/80">
                <span className="text-term-ink-3 block t-caption">SOVEREIGN SLIPS</span>
                <span className="text-signal-ink font-bold">{sovereignImmunitySlips || 0} SIS</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-dead/25 border border-dead-ink/50 t-caption text-term-ink-1 font-mono flex items-center gap-2">
            <Flame className="w-4 h-4 text-dead-soft shrink-0 animate-pulse" />
            <span>This action cannot be undone. Browser localStorage will be cleared immediately.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              onClick={onClose}
              {...hint('Pocket the decree and get back to work. Zero consequence, zero cost.')}
              className="flex-1 py-2.5 rounded-lg border border-line-strong bg-well hover:bg-well-2 text-term-ink-1 font-mono text-xs font-bold transition-all cursor-pointer text-center"
            >
              Cancel (Keep Playing)
            </button>
            {/* INVARIANT: the confirm hint states the real blast radius of
                `hardResetGame` — `localStorage.removeItem('executive_degen_save_v1')`
                followed by a reload. The store's persist `partialize` list is the
                wipe surface, so EVERY field below dies with the key. */}
            <button
              onClick={() => {
                hardResetGame();
              }}
              {...hint(
                'Irreversible. Deletes the whole executive_degen_save_v1 key and reloads the page. DESTROYED: your treasury and lifetime cash, every open option contract and its locked collateral, all liquidated agencies, the active tariff dials, the crony favor, your unlocked D.U.M.P. perks, the tutorial state, and every Sovereign Immunity Slip including the lifetime total. KEPT: nothing — not even a Flight to the Caymans slip, because prestige normally preserves those and this does not. You restart at ${CUSTOMS_LOCATION} with $100 and every channel re-sealed.',
                'Wipe save and reset'
              )}
              className="flex-1 py-2.5 rounded-lg bg-dead hover:bg-dead active:scale-95 text-on-fill font-mono text-xs font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-ink-1/60"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Wipe Save & Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
