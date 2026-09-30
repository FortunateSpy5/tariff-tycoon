/**
 * InkParticles — the stamp's physical aftermath: ink splatter and the floating
 * cash figure, both positioned in the HOST's coordinate space.
 *
 * WHY THIS IS ITS OWN MODULE
 * `ClickerButton` had reached the AGENTS.md 400-line hard ceiling, and this is
 * the most separable thing in it: ~70 lines of JSX and two data shapes that own
 * no economy, no store subscription, and no decision. The coordinate contract
 * below is the only thing that had to travel with them intact.
 *
 * INVARIANT: [Particles Are Measured Against The Box They Render In]
 * Both layers are `position: absolute` children of the HOST, but a click's
 * coordinates are naturally relative to the BUTTON. Those are two different
 * boxes: the host is as wide as the wider of the stamp and the caption, so once
 * the stamp shrinks — a ringing crisis takes the desk from ~300px to ~130px — the
 * host stays wide and every droplet lands displaced from the click that made it.
 * 11px at 1080p, and it grows from there.
 *
 * So the parent measures against its own ref and passes the resulting
 * coordinates straight down. Nothing here re-derives a position from the click.
 *
 * INVARIANT: [Cleanup Is On Animation End, Never A Timer]
 * Both layers self-delete when their one-shot animation ends. A timer that
 * unmounts a droplet that is still blooming truncates the effect; a droplet that
 * outlives its animation is dead weight in the DOM forever. `ClickerButton`
 * additionally caps both arrays, so a player mashing at 10 clicks a second
 * cannot grow them without bound between frames either.
 */

import React from 'react';

export interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  text: string;
}

/** Ink splatter droplet. One-shot, self-cleaning on animation end. */
export interface InkSplatter {
  id: number;
  x: number;
  y: number;
  size: number;
  /** A token reference (`var(--color-…)`), not a hex. Phase 1 stamps blue;
   *  the Golden Sherpie bleeds gold; a frenzy bleeds red. */
  color: string;
}

export const InkParticles: React.FC<{
  splatters: readonly InkSplatter[];
  floatingNumbers: readonly FloatingNumber[];
  /**
   * A particle finished its one-shot animation and should be dropped.
   *
   * INVARIANT: [The Name Is The Contract]
   * This is deliberately `onAnimationEnd` and not a bespoke `onSplatterEnd` /
   * `onFloaterEnd` pair. `check-hover-coverage.mjs` exempts lifecycle handlers by
   * name and treats every other `on[A-Z]` prop as something a PLAYER can
   * activate, which is the right default and the reason the gate has never
   * reported a false negative. Renaming these to something more descriptive
   * would have made the gate demand a hover tooltip for a droplet — so the props
   * are named for the event they actually are, and the array shape carries the
   * meaning instead.
   *
   * One callback for both layers, not two, because the parent mints ids from a
   * SINGLE shared counter (`nextIdRef`), so an id is unique across both lists and
   * the handler can drop it from either without knowing which fired.
   */
  onAnimationEnd: (id: number) => void;
}> = ({ splatters, floatingNumbers, onAnimationEnd }) => (
  <>
    {/* Ink splatter — physical feedback that the stamp actually bleeds. */}
    {splatters.map((s) => (
      <span
        key={s.id}
        onAnimationEnd={() => onAnimationEnd(s.id)}
        className="absolute rounded-full pointer-events-none animate-ink-bloom z-20"
        style={{
          left: `${s.x}px`,
          top: `${s.y}px`,
          width: `${s.size}px`,
          height: `${s.size}px`,
          backgroundColor: s.color,
          boxShadow: `0 0 ${s.size}px ${s.color}`,
        }}
      />
    ))}

    {floatingNumbers.map((floater) => (
      <span
        key={floater.id}
        onAnimationEnd={() => onAnimationEnd(floater.id)}
        className="absolute font-black text-xs sm:text-sm pointer-events-none animate-float-fade font-mono text-live-ink drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-30"
        style={{ left: `${floater.x}px`, top: `${floater.y - 15}px` }}
      >
        {floater.text}
      </span>
    ))}
  </>
);