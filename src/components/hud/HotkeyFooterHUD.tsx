/**
 * HotkeyFooterHUD — a compact, non-clipping keyboard dock.
 *
 * DESIGN RATIONALE [The Clipping Footer]:
 * The previous footer packed ~20 text nodes and 11 borders into a fixed 36px
 * dock. It used `overflow-x-hidden`, so on narrower viewports the hotkey list was
 * silently truncated with no scrollbar and no indication that keys existed past
 * the cut. It also duplicated the mute and screen-shake toggles that already
 * live in the ticker, and spent scarce pixels on a "100% TRANSFORMATIVE SATIRE"
 * strapline that competed with the keys for the same row.
 *
 * The rebuild:
 *   - one scrollable row, so nothing is ever silently hidden
 *   - icon-only controls on the right, strapline removed
 *   - agent actions (stamp/shake/mute/full) always visible, so the dock stays
 *     useful even with zero unlocks
 *
 * INVARIANT: never set `overflow-hidden` on the key list. If the row cannot fit,
 * it must scroll rather than truncate — a hotkey the player cannot see is a
 * hotkey that does not exist.
 */

import React from 'react';
import { Maximize2, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

interface KeyHint {
  key: string;
  label: string;
  /**
   * The key is visible and functional but its channel is still sealed. A sealed
   * key is dimmed rather than hidden — [The Clipping Footer]'s invariant applies
   * with more force here, since a key that is not listed is a key that does not
   * exist as far as the player is concerned.
   */
  sealed?: boolean;
}

/**
 * Builds the visible key list from live unlock state.
 *
 * Channel keys are ALWAYS listed. They used to be appended only once their
 * channel was unlocked, which meant a new player's dock taught five keys and
 * hid the seven that describe the rest of the game.
 */
function useKeyHints(): KeyHint[] {
  const hasMarketAccess = useGameStore((s) => s.hasMarketAccess);
  const hasRadarAccess = useGameStore((s) => s.hasRadarAccess);
  const hasPolyGriftAccess = useGameStore((s) => s.hasPolyGriftAccess);
  const phase = useGameStore((s) => s.phase);
  const hasCronyUnlocksAccess = useGameStore((s) => s.hasCronyUnlocksAccess);
  const hasTariffAccess = useGameStore((s) => s.hasTariffAccess);
  const hasPrestigeAccess = useGameStore((s) => s.hasPrestigeAccess);
  const isWalkBackWindowActive = useGameStore((s) => s.isWalkBackWindowActive);
  // Only surface the Vent key once it is actually actionable, so the dock does
  // not teach a key that silently does nothing.
  const canVent = useGameStore((s) => !s.isCapsFrenzy && s.frenzyCooldownSecondsRemaining <= 0 && s.tantrumMeter >= 10);

  const hints: KeyHint[] = [
    { key: 'SPACE', label: 'Stamp' },
    { key: 'R', label: 'Ink' },
    { key: 'Z', label: 'Shake' },
    { key: 'M', label: 'Mute' },
    { key: 'F', label: 'Full' },
  ];

  const channel = (key: string, label: string, unlocked: boolean): KeyHint => ({
    key,
    label,
    sealed: !unlocked,
  });

  hints.push(channel('1', 'Stocks', hasMarketAccess));
  // [Y] fires a real YAP, which is a genuine gated ACTION — unlike channel
  // selection, peeking at the market must not be possible from the keyboard.
  if (hasMarketAccess) hints.push({ key: 'Y', label: 'YAP' });

  hints.push(channel('2', 'Radar', hasRadarAccess));
  hints.push(channel('3', 'PolyGrift', hasPolyGriftAccess));
  // [B] is the always-open Situation Room, so it is never sealed.
  hints.push({ key: 'B', label: 'Brief' });
  hints.push(channel('D', 'D.U.M.P.', phase >= 2));
  hints.push(channel('U', 'Upgrades', hasCronyUnlocksAccess));
  hints.push(channel('T', 'Tariffs', hasTariffAccess));
  hints.push(channel('C', 'Caymans', hasPrestigeAccess));

  if (canVent) hints.push({ key: 'V', label: 'Vent' });
  if (isWalkBackWindowActive) hints.push({ key: 'W', label: 'Walk-Back' });

  return hints;
}

export const HotkeyFooterHUD: React.FC = () => {
  const hints = useKeyHints();
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const screenShakeEnabled = useGameStore((s) => s.screenShakeEnabled);
  const toggleScreenShake = useGameStore((s) => s.toggleScreenShake);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const iconBtn = 'p-1 rounded transition-colors cursor-pointer shrink-0 hover:bg-redaction-500';

  return (
    <footer className="h-8 w-full bg-redaction-700 border-t border-redaction-500 px-2 flex items-center justify-between gap-2 font-mono t-caption text-newsprint-400 select-none shrink-0 z-30">
      {/* Key list: scrolls rather than truncating. See the invariant above. */}
      <nav
        aria-label="Keyboard shortcuts"
        className="flex items-center gap-2.5 overflow-x-auto custom-scrollbar min-w-0 flex-1"
      >
        {hints.map(({ key, label, sealed }) => (
          <span
            key={key}
            className={`flex items-center gap-1 shrink-0 ${sealed ? 'opacity-45' : ''}`}
            title={sealed ? `${label} — sealed. Press to see what opens it.` : undefined}
          >
            <kbd className="px-1 py-px rounded bg-redaction-500 border border-redaction-500 text-newsprint-200 font-bold">
              {key}
            </kbd>
            <span>{label}</span>
          </span>
        ))}
      </nav>

      {/* Icon-only controls with explicit pressed state for screen readers. */}
      <div className="flex items-center gap-0.5 shrink-0 border-l border-redaction-500 pl-2">
        <button
          onClick={toggleScreenShake}
          title={screenShakeEnabled ? 'Disable Screen Shake [Z]' : 'Enable Screen Shake [Z]'}
          aria-label="Toggle screen shake"
          aria-pressed={screenShakeEnabled}
          className={`${iconBtn} ${screenShakeEnabled ? 'text-gold-400' : 'text-newsprint-600'}`}
        >
          <Vibrate className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleMute}
          title={isMuted ? 'Enable Sound [M]' : 'Mute Sound [M]'}
          aria-label="Toggle sound"
          aria-pressed={!isMuted}
          className={`${iconBtn} ${isMuted ? 'text-wax-400' : 'text-newsprint-400 hover:text-newsprint-100'}`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={toggleFullscreen}
          title="Toggle Fullscreen [F]"
          aria-label="Toggle fullscreen"
          className={`${iconBtn} text-newsprint-400 hover:text-newsprint-100`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
