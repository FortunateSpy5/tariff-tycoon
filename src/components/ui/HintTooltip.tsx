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
 *
 * INVARIANT: [Hints Off Suppresses The PAINT, Not The Description]
 * `settingsSlice.hintsEnabled` is a COMFORT setting, not an accessibility
 * switch, and the distinction is the whole design here. Turning it off must not
 * delete the explanation from a screen reader, because the gated controls are
 * the ones that NEED it: "SHORT $412. You hold $90." is the only sentence that
 * tells a non-visual player why an `aria-disabled` button cannot be pressed,
 * and a toggle that silently removed it would make the game strictly less
 * playable for exactly the players who cannot read the paint.
 *
 * So the node stays in the tree, clipped to a 1px box instead of removed. The
 * alternative — dropping `aria-describedby` when hints are off — leaves a
 * DANGLING reference: `aria-describedby` points at `role="tooltip"`, and if that
 * element is absent, assistive tech resolves an id that names nothing, which is
 * an unannounced control rather than a quiet one. `opacity: 0` + `clip-path` is
 * used rather than `display: none` / `visibility: hidden` / `hidden` for the
 * same reason: all three REMOVE the node from the accessibility tree, which
 * would undo the decision just made.
 */

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useGameStore } from '../../store/useGameStore';
import { HINT_ATTR } from './hint';
import { placeBubble } from './hintPlacement';

/** Milliseconds the pointer must rest before the bubble appears. */
const HOVER_DELAY_MS = 60;

/** Where the bubble was parked before it was measured. */
const PARKED_PX = -9999;

/**
 * INVARIANT: [Width Is Set By The Longest Hint That Still Fits Beside A Column]
 * The tier is 9.5px monospace, which is ~5.7px a character, so 260px less the
 * 8px padding either side fits ~43 characters a line. The longest hint in the
 * game is now a SEALED hotkey at ~270 characters (a channel paragraph plus the
 * shared suffix), i.e. seven lines; the rewritten `chartHint` is ~230, i.e. six.
 * Both used to be longer — the chart hint was ~600, fourteen lines — but the fix
 * there was to cut the copy, not to widen the bubble. At 288px every hint gained
 * a line and the bubble covered a third of the desk blotter instead of sitting in
 * a gutter the eye can read past. 260 is the last round number above what the
 * remaining copy actually needs.
 */
const MAX_WIDTH_PX = 260;

/**
 * Ceiling on the bubble's height, as a fraction of the viewport.
 *
 * INVARIANT: [The Bubble Can Never Outgrow The Viewport]
 * Seven lines of 9.5px text is ~130px, so at the supported 1366x768 floor the
 * ceiling of 384px is three times the tallest bubble that exists and no hint ever
 * scrolls. The ratio is still a hard ceiling rather than a comfort setting, and
 * the no-overlap branch below depends on it: a bubble capped at half the
 * viewport is guaranteed to fit entirely above OR entirely below an anchor that
 * is not itself taller than half the window, which is what makes the vertical
 * candidate — and therefore the side fallback — a real answer rather than a
 * formality. At 0.6 that guarantee was gone.
 */
const MAX_HEIGHT_RATIO = 0.5;

const BUBBLE_ID = 'executive-degen-hint';

/** Painted face. Split out so the suppressed variant can drop the shadow. */
const VISIBLE_CLASS =
  'pointer-events-none rounded-md border border-gold-600/50 bg-redaction-700 px-2 py-1 font-mono t-caption leading-snug text-newsprint-100 shadow-xl shadow-black/70';

/**
 * Suppressed face. `sr-only`-equivalent WITHOUT the `sr-only` class itself, so
 * the geometry the placement pass needs is still measurable when the toggle is
 * flipped back on mid-hover.
 */
const HIDDEN_CLASS = 'font-mono t-caption';

interface Anchored {
  rect: DOMRect;
  el: HTMLElement;
}

export const HintLayer: React.FC = () => {
  // INVARIANT: [The Flag Governs Paint Only] — see the module header. The
  // delegated listeners below are NOT gated on this, because they are what wires
  // `aria-describedby`; a `hintsEnabled`-gated listener would leave the layer
  // mounted and the description unwired, which is the worst of both.
  const hintsEnabled = useGameStore((s) => s.hintsEnabled);
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
    setAnchored({ rect: el.getBoundingClientRect(), el });
    // Position is measured after the bubble renders; until then it is parked
    // off-screen at opacity 0 so the first frame cannot flash in the wrong place.
    setPlaced(null);
  }, []);

  // INVARIANT: [The Text Is Re-read, Not Captured]
  // `show()` early-returns when the pointer is already resting on this element,
  // and a hover can outlast a countdown — "Restocking. 8s" froze on 8 for the
  // full eight seconds while the button beside it ticked 7…0. That is the exact
  // lie this whole layer exists to prevent, and it silently defeats the
  // `aria-disabled`-over-`disabled` pattern, whose stated purpose is telling the
  // player how long until the gate opens.
  const text = anchored ? (anchored.el.getAttribute(HINT_ATTR) ?? '') : '';
  // Read by the observer below to force the re-render that keeps `text` fresh.
  // It is deliberately not otherwise consumed, which is why it is named for its
  // effect rather than its value.
  const [textTick, setTextTick] = useState(0);
  void textTick;

  // INVARIANT: [Something Must Actually Re-render The Bubble]
  // Reading the attribute at render is only half the fix. `HintLayer` holds no
  // store subscription, so an anchor whose countdown ticks does NOT re-render
  // this layer — the derived `text` would recompute to the same stale string and
  // the freeze would survive, now looking deliberate. Observing the attribute
  // itself is the honest trigger: it fires on exactly the re-renders that change
  // the sentence, costs nothing while the pointer is elsewhere, and needs no
  // knowledge of which store field any particular hint was derived from.
  useEffect(() => {
    if (!anchored) return;
    const el = anchored.el;
    // INVARIANT: [The Tick Is UNCONDITIONAL, And It Is A COUNTER]
    // The first version nudged `placed` with `setPlaced(p => p ? { ...p } : p)`,
    // which is a re-render only while `placed` is truthy. That silently fails in
    // exactly one mode: with bubbles switched OFF, `placed` is never set at all
    // (the layout effect returns early), so the nudge is a no-op and the
    // suppressed node's TEXT — the only thing a screen-reader user still has —
    // freezes mid-countdown. The bubble being invisible hides the symptom, which
    // is what makes it a trap.
    //
    // A counter is unconditional and self-evident: any change to the hint text
    // produces a new state value, so the render cannot be skipped by reasoning
    // about what else happens to be null.
    const observer = new MutationObserver(() => setTextTick((n) => n + 1));
    observer.observe(el, { attributes: true, attributeFilter: [HINT_ATTR] });
    return () => observer.disconnect();
  }, [anchored]);

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

  // INVARIANT: [Re-measure When The Text Or Anchor Moves]
  // The bubble's own height depends on the text, and the anchor's box can shift
  // under a resting pointer (a wrapping label, a row that re-sorts on a tick).
  // `text` is in the dependency list precisely so a live countdown re-places the
  // bubble instead of leaving it clipped or anchored to a stale box.
  useLayoutEffect(() => {
    if (!anchored || !bubbleRef.current) return;
    // INVARIANT: [No Placement Maths For A Node Nobody Can See]
    // The suppressed bubble is 1x1, so every number derived from it is fiction.
    // `placed` is deliberately left holding its old value rather than cleared:
    // the suppressed branch never reads it, and `hintsEnabled` is in the
    // dependency list, so switching the bubbles back on re-measures the real box
    // on the spot and cannot reuse a stale offset.
    if (!hintsEnabled) return;
    // The placement maths and its invariants live in `./hintPlacement`: it is
    // pure geometry with no React in it, and keeping it here put the file at the
    // 400-line ceiling.
    const { left, top } = placeBubble(bubbleRef.current.getBoundingClientRect(), anchored.el.getBoundingClientRect(), {
      width: window.innerWidth,
      height: window.innerHeight,
    });
    setPlaced({ left, top });
  }, [anchored, text, hintsEnabled]);

  if (typeof document === 'undefined') return null;
  // INVARIANT: [The Bubble Is Not In The Tree While Idle] — rendering an empty
  // `role="tooltip"` on every frame puts a permanently meaningless node in the
  // accessibility tree. Returning null also makes the `opacity` dance
  // unnecessary; the parked position is still needed for the first paint.
  if (!anchored) return null;

  // INVARIANT: [Hints Off Is A 1px Clip, Not A Missing Node]
  // The description must survive the toggle, so the node does too — clipped and
  // transparent rather than unmounted, because `display: none`, `visibility:
  // hidden` and `hidden` all delete it from the accessibility tree and would
  // leave the `aria-describedby` reference dangling. `width`/`height` collapse to
  // 1px so the clipped box can never intercept a pointer even though the class
  // list keeps `pointer-events-none`; the geometric placement above is skipped in
  // this state because there is nothing to place.
  const style = hintsEnabled
    ? ({
        position: 'fixed',
        zIndex: 999,
        maxWidth: MAX_WIDTH_PX,
        maxHeight: `${Math.round(window.innerHeight * MAX_HEIGHT_RATIO)}px`,
        overflowY: 'auto',
        left: placed?.left ?? PARKED_PX,
        top: placed?.top ?? PARKED_PX,
        opacity: placed ? 1 : 0,
        transition: 'opacity 120ms ease-out',
      } as const)
    : ({
        position: 'fixed',
        zIndex: 999,
        width: 1,
        height: 1,
        overflow: 'hidden',
        clipPath: 'inset(50%)',
        opacity: 0,
        pointerEvents: 'none',
      } as const);

  return createPortal(
    <div
      ref={bubbleRef}
      id={BUBBLE_ID}
      role="tooltip"
      style={style}
      className={hintsEnabled ? VISIBLE_CLASS : HIDDEN_CLASS}
    >
      {text}
    </div>,
    document.body
  );
};
