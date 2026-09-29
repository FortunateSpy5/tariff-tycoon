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
