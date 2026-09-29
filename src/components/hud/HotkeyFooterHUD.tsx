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
 *
 * Every key and every toggle now carries a `hint()` rather than a `title`: the
 * dock is the only manual in the game, so a key that explains nothing is a key
 * that does not exist. Native tooltips were unstyleable, absent on touch, and
 * could not be paired with the `aria-label` these icon buttons need.
 */

import React from 'react';
import { Lightbulb, Maximize2, Volume2, VolumeX, Vibrate } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { INK_REFILL_COST_CAP, INK_REFILL_COST_GROWTH } from '../../constants/balance';
import { hint } from '../ui/hint';

/** The first refill, quoted by the [R] key hint. */
const INK_REFILL_BASE = 25;

interface KeyHint {
  key: string;
  label: string;
  /**
   * Hover/focus copy for the key. Explains what pressing it DOES to the
   * economy, never what the visible label already says. INVARIANT: the list is
   * the only manual the player has, so every key owes an explanation.
   */
  detail: string;
  /**
   * The key is visible and functional but its channel is still sealed. A sealed
   * key is dimmed rather than hidden — [The Clipping Footer]'s invariant applies
   * with more force here, since a key that is not listed is a key that does not
   * exist as far as the player is concerned.
   */
  sealed?: boolean;
}

/** Appended to any key whose channel is still sealed. */
const SEALED_SUFFIX =
  ' Sealed — press it anyway. Selecting a locked channel is free and exposes nothing; the dossier just tells you what opens it.';

/**
 * What each channel and gated action IS. The dock is the only manual in the
 * game, so a key that cannot say what it does is a key that does not exist.
 */
const CHANNEL = {
  stocks:
    'BagHolder Pro: the 0DTE options desk. Open leveraged PUTs and CALLs, then settle them into whatever the YAP broke.',
  yap: 'Post a 3:00 AM YAP. It crashes the target sector, spikes VEX volatility, and dumps S.L.O.P. suspicion on you in exchange.',
  radar:
    'S.L.O.P. Radar: live suspicion heat, raid timers, and the option to bribe the inquest lead with crony favor.',
  polygrift:
    'Prediction markets on the de-dollarization thesis. Bet that the trade war resolves the way you need it to.',
  brief: 'The Situation Room. Where the run stands, what the next milestone costs, and what is currently bleeding.',
  dump:
    'The D.U.M.P. liquidation tree. Hatchet an agency for instant cash and a permanent perk, and take a quarter of the favor cost back as a kickback.',
  unlocks:
    'Crony Unlocks. Buy the desk props — shredder, dark-pool fiber, tungsten nib — with the political capital you skimmed off your own speeches.',
  tariffs:
    'Bilateral tariff dials across the six parodied blocs. Duty scales with the rate, so the dial is the only faucet that pays while the tab is shut.',
  caymans:
    'Tier 1 prestige. File Chapter 11, flee to the Caymans, and convert lifetime cash into permanent Sovereign Immunity Slips that survive the reset.',
  vent:
    'Burn the whole tantrum meter for VEX relief down to the baseline. Deliberately worse than riding it to 100% for a CAPS LOCK FRENZY — a trade, not an upgrade path.',
  walkBack:
    'The walk-back window is open. Force-settle the combo CALLs you opened after the YAP landed and pump the price once more on the way out.',
} as const;

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
    {
      key: 'SPACE',
      label: 'Stamp',
      detail:
        'Confiscate one more pallet. Yield scales with your phase and your remaining ink — a dry nib keeps a bankruptcy floor so the desk can never soft-lock, but it earns nothing worth the ink.',
    },
    {
      key: 'R',
      label: 'Ink',
      detail:
        `Refill the Golden Sharpie. Price starts at $${INK_REFILL_BASE} and compounds ${INK_REFILL_COST_GROWTH}x per refill, capped at $${INK_REFILL_COST_CAP.toLocaleString('en-US')}, plus 2% of the treasury. Ink is a cost center, not a convenience.`,
    },
    { key: 'Z', label: 'Shake', detail: 'Screen recoil on every slam. Pure juice, zero economy. Nothing else changes.' },
    { key: 'M', label: 'Mute', detail: 'Silence every squeak, thud, and cha-ching. The economy does not notice.' },
    { key: 'F', label: 'Full', detail: 'Go fullscreen so the cockpit fills the monitor. Layout only — no numbers move.' },
  ];

  const channel = (key: string, label: string, unlocked: boolean, detail: string): KeyHint => ({
    key,
    label,
    detail,
    sealed: !unlocked,
  });

  hints.push(channel('1', 'Stocks', hasMarketAccess, CHANNEL.stocks));
  // [Y] fires a real YAP, which is a genuine gated ACTION — unlike channel
  // selection, peeking at the market must not be possible from the keyboard.
  if (hasMarketAccess) {
    hints.push({ key: 'Y', label: 'YAP', detail: CHANNEL.yap });
  }

  hints.push(channel('2', 'Radar', hasRadarAccess, CHANNEL.radar));
  hints.push(channel('3', 'PolyGrift', hasPolyGriftAccess, CHANNEL.polygrift));
  // [B] is the always-open Situation Room, so it is never sealed.
  hints.push({ key: 'B', label: 'Brief', detail: CHANNEL.brief });
  hints.push(channel('D', 'D.U.M.P.', phase >= 2, CHANNEL.dump));
  hints.push(channel('U', 'Upgrades', hasCronyUnlocksAccess, CHANNEL.unlocks));
  hints.push(channel('T', 'Tariffs', hasTariffAccess, CHANNEL.tariffs));
  hints.push(channel('C', 'Caymans', hasPrestigeAccess, CHANNEL.caymans));

  if (canVent) hints.push({ key: 'V', label: 'Vent', detail: CHANNEL.vent });
  if (isWalkBackWindowActive) hints.push({ key: 'W', label: 'Walk-Back', detail: CHANNEL.walkBack });

  return hints;
}

export const HotkeyFooterHUD: React.FC = () => {
  const hints = useKeyHints();
  const isMuted = useGameStore((s) => s.isMuted);
  const toggleMute = useGameStore((s) => s.toggleMute);
  const screenShakeEnabled = useGameStore((s) => s.screenShakeEnabled);
  const toggleScreenShake = useGameStore((s) => s.toggleScreenShake);
  const hintsEnabled = useGameStore((s) => s.hintsEnabled);
  const toggleHints = useGameStore((s) => s.toggleHints);

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
        {hints.map(({ key, label, detail, sealed }) => (
          <span
            key={key}
            className={`flex items-center gap-1 shrink-0 ${sealed ? 'opacity-45' : ''}`}
            {...hint(sealed ? `${detail}${SEALED_SUFFIX}` : detail)}
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
          {...hint(
            screenShakeEnabled
              ? 'Screen recoil is ON — the whole cockpit jumps on every slam and every settling option. Turn it off if the physics gets old. [Z]'
              : 'Screen recoil is OFF — every slam lands silently, with no desk thud and no recoil. Purely cosmetic either way. [Z]',
            'Toggle screen shake'
          )}
          aria-pressed={screenShakeEnabled}
          className={`${iconBtn} ${screenShakeEnabled ? 'text-gold-400' : 'text-newsprint-600'}`}
        >
          <Vibrate className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleMute}
          {...hint(
            isMuted
              ? 'Audio is muted. Sharpie squeaks, paper blotter thuds, and the cha-ching on a settled contract are all switched off. [M]'
              : 'Audio is live. Every stamp squeaks and every settlement rings the treasury. Mute it if the 3:00 AM desk is keeping you awake. [M]',
            'Toggle sound'
          )}
          aria-pressed={!isMuted}
          className={`${iconBtn} ${isMuted ? 'text-wax-400' : 'text-newsprint-400 hover:text-newsprint-100'}`}
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>

        {/* INVARIANT: [The Hints Toggle Explains What It Does NOT Switch Off]
         * The trap here is writing "turn off the explanations" and letting a
         * player conclude the game got quieter for everyone. It does not: the
         * hotkeys above keep working, and `aria-describedby` — the sentence a
         * screen reader reads for this very button — stays wired, because
         * `HintLayer` clips the bubble to 1px rather than unmounting it. Stating
         * both explicitly is what keeps the copy from being a lie by omission.
         * The cost is stated too: a gated control like the money printer or the
         * ink refill says WHY it is shut only in that bubble, so a player who
         * dismisses this is choosing to hover-blind themselves. */}
        <button
          onClick={toggleHints}
          {...hint(
            hintsEnabled
              ? 'Hover bubbles are ON. Every button, chip and row states what it costs before you risk money on it. Switching this off hides the bubbles only — the hotkeys keep working and screen readers still hear every explanation, so a player who cannot see the bubble loses nothing. A gated control says why it is shut only in the bubble, though: the printer, the ink refill and the trade slip all go mute.'
              : 'Hover bubbles are OFF — nothing explains a control before you press it. Hotkeys and screen-reader descriptions are untouched, so the keys in this dock and the spoken explanations still work. Turn it back on before you trade real money: a gated button such as the money printer or the ink refill states its shortfall only in the bubble.',
            'Toggle hover hint bubbles'
          )}
          aria-pressed={hintsEnabled}
          className={`${iconBtn} ${hintsEnabled ? 'text-gold-400' : 'text-newsprint-600'}`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={toggleFullscreen}
          {...hint(
            'Go fullscreen so the cockpit fills the monitor instead of the browser chrome. Layout only — no number on the desk moves, and offline earnings still collect on the same 48-hour clock. [F]',
            'Toggle fullscreen'
          )}
          className={`${iconBtn} text-newsprint-400 hover:text-newsprint-100`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </footer>
  );
};
