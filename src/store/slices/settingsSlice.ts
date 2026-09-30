/**
 * Settings Slice: Manages audio preferences, screen recoil, and save lifecycle.
 */

import type { StateCreator } from 'zustand';
import type { GameStore } from '../useGameStore';
import { sound } from '../../audio/soundEngine';

export interface SettingsSlice {
  isMuted: boolean;
  screenShakeEnabled: boolean;
  /**
   * Whether `HintLayer` paints the hover bubble. The accessible description
   * (`aria-describedby` → the same string) is deliberately NOT gated on this —
   * see the INVARIANT in `HintTooltip.tsx`.
   */
  hintsEnabled: boolean;
  lastSavedTimestamp: number;

  /**
   * First-visit nudges the player has already dismissed. See `FirstVisitCoach`.
   *
   * INVARIANT: [Dismissal Is Permanent, Not Per Session]
   * These prompts exist to fix a first impression. A prompt that reappears on
   * every reload stops being an introduction and becomes a nagging mechanic the
   * player learns to click through without reading — which is strictly worse
   * than never showing it, because it also trains them to ignore the one line
   * of chrome that might have been telling them something.
   *
   * A plain array of ids rather than booleans so adding a nudge cannot collide
   * with an existing key, and so a wipe can enumerate them.
   */
  dismissedCoachMarks: string[];
  dismissCoachMark: (id: string) => void;

  toggleMute: () => void;
  toggleScreenShake: () => void;
  toggleHints: () => void;
  updateLastSaved: () => void;
  hardResetGame: () => void;
}

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set, get) => ({
  isMuted: false,
  screenShakeEnabled: true,
  // INVARIANT: [Hints Default ON] — the hover layer is not a garnish, it is the
  // only place the game states what a control COSTS. A returning player's save
  // predates this key entirely, and `partialize` restores `undefined` for a key
  // a save never wrote, so the default is what a rehydrating store must use.
  // Defaulting to `false` would silently delete every explanation on upgrade.
  hintsEnabled: true,
  lastSavedTimestamp: Date.now(),
  dismissedCoachMarks: [],

  dismissCoachMark: (id) => {
    // Guarded against a double-fire racing itself into a duplicate entry: the
    // array is persisted, and a doubled id would persist a doubled id forever.
    const current = get().dismissedCoachMarks;
    if (current.includes(id)) return;
    set({ dismissedCoachMarks: [...current, id] });
  },

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    sound.setMuted(nextMuted);
    set({ isMuted: nextMuted });
  },

  toggleScreenShake: () => {
    set({ screenShakeEnabled: !get().screenShakeEnabled });
  },

  // No side effect beside the flag, unlike `toggleMute`: there is no audio
  // device to silence and no page API to release. The bubble's own mounted state
  // is driven by the store flag in `HintLayer`.
  toggleHints: () => {
    set({ hintsEnabled: !get().hintsEnabled });
  },

  updateLastSaved: () => {
    set({ lastSavedTimestamp: Date.now() });
  },

  hardResetGame: () => {
    try {
      localStorage.removeItem('executive_degen_save_v1');
    } catch {
      // ignore
    }
    window.location.reload();
  },
});
