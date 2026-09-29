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
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 select-none animate-in fade-in duration-200">
      <div className="surface-classified border-2 border-wax-600/80 rounded-xl max-w-md w-full shadow-2xl shadow-redaction-700/60 overflow-hidden text-newsprint-100 font-sans relative">
        {/* Top Danger Banner */}
        <div className="bg-gradient-to-r from-wax-600 via-wax-600 to-redaction-700 p-4 border-b border-wax-500/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-wax-500 text-newsprint-50">
              <AlertOctagon className="w-5 h-5 font-black" />
            </div>
            <div>
              <h2 className="font-mono font-black text-sm text-newsprint-50 tracking-wider uppercase">
                Chapter 7 Insolvency
              </h2>
              <span className="font-mono t-micro text-newsprint-200 block">
                Total Economic Erasure // Hard Reset
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            {...hint('Stand down. Nothing has been touched yet — the save is exactly as intact as it was one click ago.', 'Cancel and close')}
            className="p-1 rounded-lg text-newsprint-300 hover:text-newsprint-50 hover:bg-redaction-500/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3.5">
          <p className="text-xs text-newsprint-200 leading-relaxed">
            Are you sure you want to <span className="font-bold text-wax-400">permanently incinerate all save data</span>?
            This will wipe your treasury, liquidate all open positions, cancel active upgrades, and deport you
            directly back to{' '}
            <span className="font-bold text-gold-400">{CUSTOMS_LOCATION}</span> with{' '}
            <span className="font-bold text-emerald-400">$100 seed cash</span>.
          </p>

          {/* Incineration Preview */}
          <div className="bg-redaction-500/90 border border-redaction-700 rounded-lg p-3 space-y-1.5 font-mono text-xs">
            <span className="t-micro text-newsprint-300 font-bold block uppercase tracking-wider">
              Assets Marked for Destruction:
            </span>
            <div className="grid grid-cols-2 gap-2 pt-1 t-caption">
              <div className="bg-redaction-700 p-2 rounded border border-redaction-700/80">
                <span className="text-newsprint-400 block t-caption">CURRENT STAGE</span>
                <span className="text-gold-400 font-bold">Phase {phase}</span>
              </div>
              <div className="bg-redaction-700 p-2 rounded border border-redaction-700/80">
                <span className="text-newsprint-400 block t-caption">TREASURY CASH</span>
                <span className="text-emerald-400 font-bold">{formatCurrency(treasuryCash)}</span>
              </div>
              <div className="bg-redaction-700 p-2 rounded border border-redaction-700/80">
                <span className="text-newsprint-400 block t-caption">LIFETIME CLICKS</span>
                <span className="text-newsprint-100 font-bold">{totalClicks.toLocaleString()}</span>
              </div>
              <div className="bg-redaction-700 p-2 rounded border border-redaction-700/80">
                <span className="text-newsprint-400 block t-caption">SOVEREIGN SLIPS</span>
                <span className="text-stampblue-400 font-bold">{sovereignImmunitySlips || 0} SIS</span>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded bg-wax-600/25 border border-wax-500/50 t-caption text-newsprint-100 font-mono flex items-center gap-2">
            <Flame className="w-4 h-4 text-wax-400 shrink-0 animate-pulse" />
            <span>This action cannot be undone. Browser localStorage will be cleared immediately.</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 pt-2">
            <button
              onClick={onClose}
              {...hint('Pocket the decree and get back to work. Zero consequence, zero cost.')}
              className="flex-1 py-2.5 rounded-lg border border-newsprint-700 bg-redaction-500 hover:bg-redaction-700 text-newsprint-100 font-mono text-xs font-bold transition-all cursor-pointer text-center"
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
              className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-500 active:scale-95 text-stone-950 font-mono text-xs font-black tracking-wider uppercase transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-lg shadow-red-950/60"
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
