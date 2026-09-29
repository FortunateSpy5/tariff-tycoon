/**
 * HintTooltip — the ONE hover/focus context layer for the whole cockpit.
 *
 * The `hint()` attribute builder and its own contract live in `./hint`, so this
 * module exports a component and nothing else (React Fast Refresh).
 *
 * INVARIANT: [No Element On Screen May Be Unhoverable]
 * Every interactive element in `src/components` must explain itself: what it
 * costs, what it does to the economy, and what it is for. `npm run hover:check`
 * makes the claim falsifiable.
 *
 * WHY A GLOBAL LAYER AND NOT A WRAPPER
 * The obvious design is `<HintTooltip>{children}</HintTooltip>`. In a zero-scroll
 * cockpit that is a layout hazard: the wrapper becomes the flex item instead of
 * the button, so every row of chips and every watchlist row would need its inner
 * button forced back to `w-full`, and one mistake would reflow the cockpit. This
 * layer instead renders ONE bubble, portalled to `document.body`, driven by
 * delegated pointer and focus events against any `[data-hint]` element. It adds
 * zero DOM to any call site, so no layout can drift, and dynamically mounted rows
 * are covered for free.
 *
 * WHY NOT `title`
 * The native tooltip is unstyleable, arrives after a delay, and cannot be paired
 * with an accessible name. It also cannot be read by assistive tech at all, and
 * `title` was how 12 controls ended up nameless.
 *
 * INVARIANT: [An `aria-label` Must Never Hide Live Information]
 * `aria-label` REPLACES a control's accessible name. So on a button whose visible
 * text is a live reading — "Refill $25.00", "COOLING DOWN (3s)", "CALL NEEDED" —
 * a static label erases the very thing the player needs. That is why the rule is
 * "pass a name only when the visible text is cryptic or absent". The hint text
 * is not lost either way: `show()` wires `aria-describedby`, so it is announced
 * as the description of whatever the control actually calls itself.
 *
 * INVARIANT: [Disabled Controls Still Need To Explain Themselves]
 * A native `disabled` button swallows pointer events in Chromium, so its hover
 * context would vanish exactly when the player most needs it ("restocking in
 * 3s"). Gated controls therefore use `aria-disabled` plus a handler guard. See
 * `GoldBoxProp`.
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { HINT_ATTR } from './hint';

/** Milliseconds the pointer must rest before the bubble appears. */
const HOVER_DELAY_MS = 60;

/** Gap between the anchor and the bubble, and the viewport edge margin. */
const EDGE_PX = 8;

const MAX_WIDTH_PX = 288;

/**
 * Ceiling on the bubble's height, as a fraction of the viewport.
 *
 * INVARIANT: [The Bubble Can Never Outgrow The Viewport]
 * The longest hints are the *gated* ones, which are the entire reason this
 * system exists. At 288px a 600-character hint is ~14 lines tall; on a short
 * window that is taller than the space between the anchor and either edge, and
 * the placement maths below would place it at a negative offset — clipped off
 * the top of the screen with no way to read the rest.
 */
const MAX_HEIGHT_RATIO = 0.6;

const BUBBLE_ID = 'executive-degen-hint';

interface Anchored {
  text: string;
  rect: DOMRect;
  el: HTMLElement;
}

export const HintLayer: React.FC = () => {
  const [anchored, setAnchored] = useState<Anchored | null>(null);
  const [placed, setPlaced] = useState<{ left: number; top: number } | null>(null);
  const bubbleRef = useRef<HTMLDivElement | null>(null);
  const activeRef = useRef<HTMLElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const hide = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Detach the description. Only remove the attribute if we are the ones who
    // put it there — the element may have shipped with its own.
    const el = activeRef.current;
    if (el?.getAttribute('aria-describedby') === BUBBLE_ID) el.removeAttribute('aria-describedby');
    activeRef.current = null;
    setAnchored(null);
    setPlaced(null);
  }, []);

  const show = useCallback((el: HTMLElement) => {
    if (el === activeRef.current) return;
    const text = el.getAttribute(HINT_ATTR);
    if (!text) return;
    // INVARIANT: [Exactly One Element Is Described At A Time]
    // `hide()` is the only other place that strips `aria-describedby`, and a
    // sweep across several controls calls `show()` repeatedly WITHOUT ever
    // calling `hide()` in between — so the previously-anchored element kept a
    // stale `aria-describedby` pointing at a bubble that no longer described it.
    // A screen reader would then read out the wrong hint for a control the
    // player had already left.
    const previous = activeRef.current;
    if (previous?.getAttribute('aria-describedby') === BUBBLE_ID) {
      previous.removeAttribute('aria-describedby');
    }
    activeRef.current = el;
    // INVARIANT: `role="tooltip"` is inert to assistive tech unless something
    // points at it. One global bubble can only describe one element at a time,
    // which is exactly what the layer's single-anchor model guarantees.
    el.setAttribute('aria-describedby', BUBBLE_ID);
    setAnchored({ text, rect: el.getBoundingClientRect(), el });
    // Position is measured after the bubble renders; until then it is parked
    // off-screen at opacity 0 so the first frame cannot flash in the wrong place.
    setPlaced(null);
  }, []);

  useEffect(() => {
    const closestHint = (target: EventTarget | null): HTMLElement | null => {
      const el = target instanceof Element ? target : null;
      return el?.closest<HTMLElement>(`[${HINT_ATTR}]`) ?? null;
    };

    const onPointerOver = (e: PointerEvent) => {
      const el = closestHint(e.target);
      if (!el) {
        hide();
        return;
      }
      if (el === activeRef.current) return;
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(() => {
        timerRef.current = null;
        // INVARIANT: [A Detached Anchor Shows Nothing] — the 60ms delay is long
        // enough for the anchored element to unmount. This app deletes hovered
        // nodes routinely (a dismissed run summary, a liquidated agency row, a
        // cleared feedback toast, a watchlist row that re-sorts on a tick), and
        // a detached node's `getBoundingClientRect()` is all zeros — which would
        // pin the bubble to the top-left corner of the screen showing the hint
        // for an element that no longer exists. `pointerout` never fires for a
        // removed element, so nothing would ever clear it.
        if (!el.isConnected) return;
        show(el);
      }, HOVER_DELAY_MS);
    };

    const onPointerOut = (e: PointerEvent) => {
      const el = closestHint(e.target);
      const to = e.relatedTarget;
      if (el && to instanceof Node && el.contains(to)) return;
      hide();
    };

    /** A tap already focuses, and the focus handler will show the bubble. */
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      hide();
    };

    // Keyboard parity: a focused control must say the same thing a hovered one does.
    const onFocusIn = (e: FocusEvent) => {
      const el = closestHint(e.target);
      if (el) show(el);
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide();
    };

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('pointerout', onPointerOut);
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('focusin', onFocusIn);
    document.addEventListener('focusout', hide);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('scroll', hide, true);
    window.addEventListener('resize', hide);
    return () => {
      // INVARIANT: the cleanup is symmetric. Leaving the pending timer armed
      // would let it fire into an unmounted component — harmless today only
      // because `show()` has no side effects yet.
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('pointerout', onPointerOut);
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', hide);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('scroll', hide, true);
      window.removeEventListener('resize', hide);
    };
  }, [hide, show]);

  useLayoutEffect(() => {
    if (!anchored || !bubbleRef.current) return;
    const bubble = bubbleRef.current.getBoundingClientRect();
    const above = anchored.rect.top - bubble.height - EDGE_PX;
    const below = anchored.rect.bottom + EDGE_PX;
    // INVARIANT: [The Bubble Can Never Leave The Viewport] — clamp on BOTH
    // axes. Clamping only the horizontal one let a bubble taller than the space
    // available resolve to a negative `top`, clipping the top of the text with
    // nothing to scroll it back into view.
    const top = Math.max(
      EDGE_PX,
      above >= EDGE_PX ? above : Math.min(below, window.innerHeight - bubble.height - EDGE_PX)
    );
    const centered = anchored.rect.left + anchored.rect.width / 2 - bubble.width / 2;
    const left = Math.max(EDGE_PX, Math.min(centered, window.innerWidth - bubble.width - EDGE_PX));
    setPlaced({ left, top });
  }, [anchored]);

  if (typeof document === 'undefined') return null;
  // INVARIANT: [The Bubble Is Not In The Tree While Idle] — rendering an empty
  // `role="tooltip"` on every frame puts a permanently meaningless node in the
  // accessibility tree. Returning null also makes the `opacity` dance
  // unnecessary; the parked position is still needed for the first paint.
  if (!anchored) return null;

  return createPortal(
    <div
      ref={bubbleRef}
      id={BUBBLE_ID}
      role="tooltip"
      style={{
        position: 'fixed',
        zIndex: 999,
        maxWidth: MAX_WIDTH_PX,
        maxHeight: `${Math.round(window.innerHeight * MAX_HEIGHT_RATIO)}px`,
        overflowY: 'auto',
        left: placed?.left ?? -9999,
        top: placed?.top ?? -9999,
        opacity: placed ? 1 : 0,
        transition: 'opacity 120ms ease-out',
      }}
      className="pointer-events-none rounded-md border border-gold-600/50 bg-redaction-700 px-2 py-1 font-mono t-caption leading-snug text-newsprint-100 shadow-xl shadow-black/70"
    >
      {anchored.text}
    </div>,
    document.body
  );
};
