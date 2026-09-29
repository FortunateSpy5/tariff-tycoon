/**
 * Channel Selection Slice: which cockpit channel each wing is showing.
 *
 * WHY THIS IS A SEPARATE SLICE:
 * Cockpit channel selection has its own invariant — [The Seal Is a Promise, Not
 * a Wall] — and that invariant is load-bearing enough that it does not belong
 * interleaved through the clicker economy in `deskSlice`. It was also the line
 * that pushed `deskSlice` past the 400-line hard ceiling in AGENTS.md.
 *
 * The two slice files are otherwise unrelated: this one owns two strings.
 *
 * INVARIANT: [The Seal Is a Promise, Not a Wall]
 * These setters do NOT reject a sealed channel. Selection is a navigation
 * intent, not an unlock. The player may select any channel at any time and is
 * shown a `SealedDossier` naming the single event that opens it, plus a teaser of
 * what is behind the door. What they may never do is ACT on its contents.
 *
 * The gate therefore lives one layer down, in the panes: a sealed channel never
 * mounts its real body, so no purchase, liquidation, tariff move, or prestige
 * reset is reachable while sealed. See `engine/systems/unlockEngine` for the
 * body gate and `constants/tabDemands` for the copy.
 *
 * The previous design gated selection here as well, which meant a locked channel
 * was not merely unusable — it was invisible, unnameable, and unreachable by
 * keyboard. The four systems the game is named for appeared only as lines in a
 * Career Objectives list, with no affordance of any kind.
 */

import type { StateCreator } from 'zustand';
import type { GameStore } from '../useGameStore';
import type { ChannelSliceContract } from '../../types/store';

/**
 * The slice implements the contract declared in `types/store`. The contract
 * lives apart from the behaviour on purpose — see that file's header — so a
 * reader asking "what can I do to the cockpit channels" reads one declaration
 * rather than scrolling past an implementation.
 */
export interface ChannelSlice extends ChannelSliceContract {}

export const createChannelSlice: StateCreator<GameStore, [], [], ChannelSlice> = (set) => ({
  activeLeftTab: 'stocks',
  /* 'brief' is the Situation Room — the one right-deck channel that is never
     sealed. A new player therefore lands on the Career Objectives with the tab
     strip already populated. See [The Seal Is a Promise, Not a Wall]. */
  activeRightTab: 'brief',
  setActiveLeftTab: (tab) => set({ activeLeftTab: tab }),
  setActiveRightTab: (tab) => set({ activeRightTab: tab }),
});
