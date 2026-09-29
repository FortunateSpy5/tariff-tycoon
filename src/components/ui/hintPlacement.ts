/**
 * Hint placement — where the bubble goes, as pure arithmetic.
 *
 * WHY THIS IS NOT IN `HintTooltip.tsx`
 * The placement pass is geometry with no React in it: given a bubble box, an
 * anchor box and a viewport, it returns an offset. That is testable, and the
 * component file was already at the AGENTS.md 400-line hard ceiling. The split
 * mirrors `chartHaptics` beside `PriceChart` — record separate from promise.
 */

/** Gap between the anchor and the bubble, and the viewport edge margin. */
export const EDGE_PX = 8;

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
}

export interface Viewport {
  width: number;
  height: number;
}

export interface Placement {
  left: number;
  top: number;
  /** Which candidate won. Read by tests and by the comment below, not the UI. */
  branch: 'vertical' | 'side-right' | 'side-left' | 'unplaceable';
}

/** Do two boxes share any area? */
export function overlaps(a: Box, b: Box): boolean {
  return a.left < b.right && a.left + a.width > b.left && a.top < b.bottom && a.top + a.height > b.top;
}

/**
 * Place the bubble: above the anchor if it fits, otherwise below, otherwise
 * beside it, and always inside the viewport.
 *
 * INVARIANT: [The Bubble Must Never Cover The Control It Describes]
 * WHY THE OLD BEHAVIOUR WAS WRONG
 * `position: fixed` plus a viewport clamp guarantees the bubble is INSIDE the
 * window and nothing more. It says nothing about what is underneath it, and for
 * a control pinned to an edge — the hotkey dock along the bottom, a column
 * button against the right wall — the only vertical slot left is the one the
 * anchor itself occupies. The clamp is what pushed the bubble there in the first
 * place, and the opacity fade sold the overlap as intentional. A tooltip that
 * paints over the label the player is reading costs them the very information
 * it exists to give.
 *
 * The fix treats "still overlapping" as a placement FAILURE and retries on the
 * horizontal axis, where the cockpit has slack: the desk is a three-column grid,
 * so the gutter beside a centre-stage button is routinely 300px of nothing.
 *
 * INVARIANT: [A Side Is Only Taken When The Bubble Fits There]
 * Picking the roomier side unconditionally and clamping afterwards produces a
 * bubble shoved back across the anchor — the identical defect one axis over. The
 * `room >= bubble.width` test is what makes the no-overlap claim provable rather
 * than aspirational: when it passes, the placed box is horizontally disjoint
 * from the anchor, so no vertical position can overlap it. When it fails there is
 * no honest answer on a viewport narrower than the bubble plus the anchor, and
 * `unplaceable` says so instead of pretending the vertical slot was chosen on
 * merit. The bubble is scrollable, so the copy stays reachable.
 *
 * INVARIANT: [The Viewport Clamp Is A Hard Guarantee, Not A Preference]
 * Both axes clamp unconditionally, including on the side branch. A bubble whose
 * text ran off the top of the screen with no way to scroll it back was a real
 * defect, and no placement cleverness is allowed to reintroduce it.
 */
export function placeBubble(bubble: Box, box: Box, viewport: Viewport): Placement {
  const clampX = (x: number) => Math.max(EDGE_PX, Math.min(x, viewport.width - bubble.width - EDGE_PX));
  const clampY = (y: number) => Math.max(EDGE_PX, Math.min(y, viewport.height - bubble.height - EDGE_PX));
  const above = box.top - bubble.height - EDGE_PX;
  const below = box.bottom + EDGE_PX;
  const top = Math.max(EDGE_PX, above >= EDGE_PX ? above : Math.min(below, viewport.height - bubble.height - EDGE_PX));
  const centered = box.left + box.width / 2 - bubble.width / 2;
  const left = clampX(centered);

  if (!overlaps({ ...bubble, left, top }, box)) return { left, top, branch: 'vertical' };

  const rightRoom = viewport.width - box.right - EDGE_PX;
  const leftRoom = box.left - EDGE_PX;
  const side: 'side-right' | 'side-left' = rightRoom >= leftRoom ? 'side-right' : 'side-left';
  if (Math.max(rightRoom, leftRoom) < bubble.width) return { left, top, branch: 'unplaceable' };

  // Align the bubble's own vertical centre with the anchor's, so a short bubble
  // beside a tall button still reads as belonging to it.
  const centredY = box.top + box.height / 2 - bubble.height / 2;
  return {
    left: clampX(side === 'side-right' ? box.right + EDGE_PX : box.left - bubble.width - EDGE_PX),
    top: clampY(centredY),
    branch: side,
  };
}
