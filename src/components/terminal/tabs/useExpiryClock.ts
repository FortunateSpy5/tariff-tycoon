/**
 * A coarse wall clock for render-time countdowns.
 *
 * WHY THIS EXISTS
 * The 0DTE positions panel computed `Date.now()` during render. That is an
 * impure call, so the React Compiler refuses to optimize the component and
 * `oxlint`'s `react/purity` rule flags it; and more importantly, the expiry
 * countdown is the number the player is racing. A value derived at render time
 * is only as fresh as the last re-render, so a component that settles rarely
 * shows a stale "43s left" while the contract is actually about to expire.
 *
 * It also undercuts the order slip's own copy: the PUT and CALL hover states
 * tell the player the contract is worth $0 at 60 seconds. If the on-screen
 * number disagrees with that, the hover text is a lie.
 *
 * WHY useSyncExternalStore AND NOT useState + useEffect
 * Two earlier versions failed, and both failures are worth recording:
 *
 * 1. `useState(() => Date.now())` with a 250ms interval. The initialiser runs
 *    ONCE at mount, so when the last position settles the interval is cleared
 *    and `now` freezes at its last tick. Open another position and the first
 *    tick lands 250ms later — during which `secondsLeft` came from a clock that
 *    stopped when the panel went quiet, and showed "1200s left" for a quarter
 *    of a second on the one countdown this hook exists to keep honest.
 * 2. Re-seeding with `setNow(Date.now())` inside the effect body. That fixes the
 *    staleness and trips `react/set-state-in-effect` — a cascading render.
 *
 * Moving the re-seed into the render body fixes (1) and trips `react/purity`
 * instead, because `Date.now()` is impure wherever it is called. The external
 * store sidesteps both: the clock is a genuine external mutable source, which is
 * exactly what `useSyncExternalStore` exists for. React reads the snapshot
 * during render without the call appearing in the component at all, so the
 * component stays pure, and a subscriber arriving between ticks gets a FRESH
 * snapshot immediately rather than waiting for the next interval.
 *
 * The interval is shared and reference-counted, so ten open positions run one
 * timer rather than ten, and a tab with nothing open runs none.
 */

import { useSyncExternalStore } from 'react';

/** How often the shared clock advances. Fine enough that 1s never visibly lags. */
const TICK_MS = 250;

let currentTime = Date.now();
let timer: ReturnType<typeof setInterval> | null = null;
const subscribers = new Set<() => void>();

/** Called by React when a subscriber mounts or unmounts. */
function subscribe(onChange: () => void): () => void {
  subscribers.add(onChange);
  // INVARIANT: [Start On The First Subscriber, Stop On The Last]
  // Mounting is a render-phase commit, so `Date.now()` here is not a render-time
  // impurity. Starting eagerly instead would leave a timer running for a tab
  // with no open positions, which is the state this hook is supposed to cost
  // nothing in.
  if (timer === null) {
    currentTime = Date.now();
    timer = setInterval(() => {
      currentTime = Date.now();
      subscribers.forEach((fn) => fn());
    }, TICK_MS);
  }
  return () => {
    subscribers.delete(onChange);
    if (subscribers.size === 0 && timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  };
}

/** The snapshot. Must be referentially stable between ticks or React loops. */
function getSnapshot(): number {
  return currentTime;
}

/** A subscription that never fires, so no timer runs for a settled panel. */
const idleSubscribe = () => () => {};

/**
 * The current time, refreshed on a shared interval for as long as something is
 * observing it.
 *
 * @param activeCount Open positions. Zero unsubscribes, so a settled tab costs
 *                    nothing — the panel only reads this while it has a position
 *                    to count down.
 */
export function useExpiryClock(activeCount: number): number {
  // INVARIANT: [Swap The Subscribe Fn, Never The Hook]
  // `useSyncExternalStore` re-subscribes when this function identity changes,
  // which is the supported way to make a subscription conditional — calling the
  // hook conditionally would be a rules-of-hooks violation, and reading
  // `Date.now()` in the caller to gate it would put the impurity back in a
  // render. So the hook count stays fixed and the SUBSCRIPTION is what turns on
  // and off, which is the only saving `activeCount` was ever for.
  return useSyncExternalStore(activeCount > 0 ? subscribe : idleSubscribe, getSnapshot, getSnapshot);
}
