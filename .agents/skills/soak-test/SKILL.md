---
name: soak-test
description: "Design extended-play soak tests for the idle loops of Executive Degen — offline rehydration, tick drift, numeric overflow past 10^42, and unbounded accumulation over hours. Use before shipping a prestige, offline, or prestige-reset change, or when a bug only appears after long sessions."
---

# Soak Test Skill

Idle games fail differently from action games. Nothing here is about reflexes or
frame pacing — it is about **what a loop does after eight hours, after a week, or
after the numbers stop fitting in a double**. A session that survives five
minutes can still bleed, drift, or overflow.

---

## 0. The Standing Verdict Rule

**A soak test you did not run is `NOT ASSESSED — NO DATA`.** Do not report a
green result from code reading. If you cannot run the loop, say which windows are
untested and what would be needed to test them.

---

## 1. Why This Game Is Unusually Leak-Prone

Four structural properties of **EXECUTIVE DEGEN** guarantee that short
playtesting misses things:

1. **A tick loop runs forever.** `tickDesk` fires continuously; anything appended
   per tick (an array, a log entry, an audio node, a particle) is an unbounded leak.
2. **The numbers are astronomically large.** Phase 4 targets $10^{18} \to $10^{42}$.
   Any `+`/`*` on a plain JS number is already lossy, and `Infinity`/`NaN` spreads
   silently through the whole store once it lands.
3. **State is persisted to `localStorage`.** A leaked field is not just a memory
   problem — it is written to disk every save and re-read on every load.
4. **Offline rehydration is a second, separate code path.** The same arithmetic
   runs at `deltaSeconds = 172800` as at `deltaSeconds = 0.016`, and the two paths
   have historically diverged.

---

## 2. The Six Windows

### 2.1 Long Uptime (2h+)
**Watching for:** unbounded growth in arrays/objects; audio nodes never
disconnected; particle or confetti instances outliving their component;
`requestAnimationFrame` / `setInterval` registered more than once.

**How:** open DevTools → Memory → take a heap snapshot at minute 1 and minute 120
with identical play. A linear climb that never plateaus is a leak. Force GC
between snapshots or the numbers are noise.

**Specific targets here:** the confetti calls, the procedural Web Audio graph in
`src/audio/`, and any `toasts`/`log` array in the store that grows per event.

### 2.2 Tick Drift (long session, sub-second sampling)
**Watching for:** a per-tick error that accumulates. If income is computed as
`rate * deltaSeconds` and `deltaSeconds` is derived from wall-clock, a dropped
frame or a throttled background tab changes the divisor.

**How:** sample `netWorth` at fixed wall-clock intervals across a full session and
compare against the analytic expectation. A gap that grows with elapsed time is
drift, not rounding. Check `Math.min(elapsed, MAX_OFFLINE_SECONDS)` is applied
*before* multiplying, not after.

### 2.3 The 48-Hour Offline Wall
**Watching for:** the cap being applied to the wrong quantity, and the
double-credit path.

**How:** set `lastSavedTimestamp` back by 1h / 24h / 47h / 49h / 30d and reload
each time. Verify:
- 47h credits 47h, 49h credits exactly 48h (`MAX_OFFLINE_SECONDS`).
- Reloading twice in a row does **not** credit the same window twice. The fix in
  `deskSlice.creditOfflineEarnings` stamps `now` *after* crediting; confirm that
  ordering still holds.
- Offline time is **never** a penalty: no margin calls, no decay, no lost
  contracts. Open 0DTE contracts must be extended, not expired — see
  `extendTradesForOffline` in `settlementEngine.ts`.
- Nothing accrues past the cap, and the sub-unit Crony Favor remainder is not
  discarded at `CRONY_FAVOR_MAX` (the `tickPassiveEconomy` headroom bug).

### 2.4 Prestige Loop (repeat 20+ times)
**Watching for:** state that survives a reset when it should not, and state that
is destroyed when it should not. Prestige is where compounding bugs compound.

**How:** script a run that reaches prestige, capture the full store, reset,
capture again, and diff. Assert: shell-company seed cash granted; no
`lifetimeCashEarned` leakage; SIS-derived perks persist; nothing references a
cleared access flag. Then repeat — the tenth reset should behave identically to
the first. Divergence on iteration *n* is the finding.

### 2.5 Numeric Overflow (Phase 3 → 4)
**Watching for:** `Infinity` and `NaN` entering the store, and `Infinity - Infinity`
becoming `NaN` in a display formatter.

**How:** drive the state to $10^{40}+ and exercise every derived readout —
net worth, income/sec, SIS, the D.U.M.P. tree costs, the prestige formula. The
project uses `break_infinity.js` in some paths; confirm which code paths use it
and which still use raw `number`. A mixed strategy is a latent `NaN` bug.

**Specific risk:** `calculatePrestigeSIS` sums two power terms. If either input
is `Infinity`, the result is `Infinity`, and `Math.floor(Infinity)` is still
`Infinity` — which would let a corrupted save prestige infinitely.

### 2.6 Save / Load Corruption
**Watching for:** a schema change shipping without a migration; `partialize`
dropping a field that `onRehydrateStorage` expects.

**How:** hand-edit the `localStorage` payload to (a) remove a key, (b) set a
numeric field to `"banana"`, (c) set `lastSavedTimestamp` to the future, (d) set a
negative value. The game must not white-screen on any of these. Zustand's
`partialize` plus a defensive rehydrate is the intended shape; a bare
`JSON.parse` of untrusted local state is not.

---

## 3. Report Format

```
## Soak Test: [Change / System]

### Verdict: [NOT ASSESSED / PASS / CONCERNS / FAIL]

| Window | Runtime | Method | Result |
|--------|---------|--------|--------|
| Long uptime | | heap snapshot @1m vs @120m | |
| Tick drift | | sampled vs analytic | |
| 48h offline | | 1h/24h/47h/49h/30d | |
| Prestige loop | | 20 resets, state diff | |
| Overflow | | driven to 10^40+ | |
| Save corruption | | 4 malformed payloads | |

### Findings
| Sev | Window | Symptom | Evidence | Likely Cause |

### Not Tested
[windows you could not exercise, and what would be required]
```

The **Not Tested** section is mandatory. An unexercised window reported as
passing is the exact failure this skill exists to prevent.

---

## 4. Invariants That Must Hold Under Soak

These are load-bearing per `AGENTS.md`. If a soak test shows one broken, stop
and fix it rather than recording it as a known issue:

- **[Zero Soft-Locks]** — manual click yield never falls below
  `max($1.00, SIS × $1,000)`, at any point in any window.
- **[Palm-a-Grifto Golf Protocol]** — offline never punishes; frozen volatility;
  passive revenue safe to 48h.
- **[Too Big to Fail]** — a 100% options wipe auto-bails rather than zeroing the
  player out.
- **[Causal Market Volatility]** — crashes come from player YAPs and tariffs,
  never from background RNG accumulating while the tab is idle.

---

## 5. Practical Notes

- `agent-browser` is installed in this project. Use it to drive a real session,
  dump state, and diff across reloads rather than reasoning about it.
- The engine modules in `src/engine/` are pure and DOM-free **by design** — they
  are the right place to soak numerically, without a browser, using `vitest`
  (also installed) with a large simulated `deltaSeconds`.
- Prefer simulating `deltaSeconds = 172800` in a unit test over waiting 48 hours.
  It tests the arithmetic; only a real run tests the persistence.
