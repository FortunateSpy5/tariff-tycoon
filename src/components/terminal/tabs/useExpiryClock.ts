/**
 * A coarse wall clock for render-time countdowns.
 *
 * WHY THIS EXISTS
 * The 0DTE positions panel computed `Date.now()` during render. Two problems:
 * it is an impure call, so the React Compiler refuses to optimize the component
 * and `oxlint` flags it; and more importantly, the expiry countdown is the
 * number the player is racing. A value derived at render time is only as fresh
 * as the last re-render, so a component that settles rarely shows a stale
 * "43s left" while the contract is actually about to expire.
 *
 * It also undercuts the order slip's own copy: the PUT and CALL hover states
 * tell the player the contract is worth $0 at 60 seconds. If the on-screen
 * number disagrees with that, the hover text is a lie.
 *
 * Only mounted while at least one position is open, so a settled tab costs
 * nothing.
 */

import { useEffect, useState } from 'react';

export function useExpiryClock(activeCount: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // No synchronous setState here: the first interval tick lands 250ms later,
    // and the `useState` initialiser already supplied a fresh value. Setting
    // state during the effect body would trigger a cascading render on mount.
    if (activeCount === 0) return;
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, [activeCount]);

  return now;
}
