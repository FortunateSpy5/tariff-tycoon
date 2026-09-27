/**
 * Settings Slice: Manages audio preferences, screen recoil, and streamer mode.
 */

import type { StateCreator } from 'zustand';
import type { GameStore } from '../useGameStore';
import { sound } from '../../audio/soundEngine';

export interface SettingsSlice {
  isMuted: boolean;
  screenShakeEnabled: boolean;
  streamerMode: boolean;
  lastSavedTimestamp: number;

  toggleMute: () => void;
  toggleScreenShake: () => void;
  toggleStreamerMode: () => void;
  updateLastSaved: () => void;
  hardResetGame: () => void;
}

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set, get) => ({
  isMuted: false,
  screenShakeEnabled: true,
  streamerMode: false,
  lastSavedTimestamp: Date.now(),

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    sound.setMuted(nextMuted);
    set({ isMuted: nextMuted });
  },

  toggleScreenShake: () => {
    set({ screenShakeEnabled: !get().screenShakeEnabled });
  },

  toggleStreamerMode: () => {
    set({ streamerMode: !get().streamerMode });
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
