# 🔍 Codebase Audit Report — Executive Degen: Short the World

> **Scope:** Full read-only audit of game logic, UI, engine, store, types, constants, hooks, and audio against the design docs (`GAME_DESIGN_DOCUMENT.md`, `UI_DESIGN_SPECIFICATION.md`, `README.md`, `.agents/workflows/FEATURE_ROADMAP.md`).
> **Build status at audit time:** ✅ Clean (`tsc -b && vite build`, exit 0 — 1928 modules, 375.58 kB JS, 58.31 kB CSS).
> **Method:** Static analysis + grep verification. No code was modified.

---

## 1. Executive Summary

The Phase 1 & 2 vertical slice is **functionally solid and shippable**: the tactile clicker, 0DTE options loop, YAP engine, D.U.M.P. liquidation tree, tariffs, and prestige shell all work end-to-end with a clean build. However, the audit surfaced three classes of issues:

1. **Doc ↔ Code drift** — several balance constants and formulas in the code disagree with the GDD and, in two cases, with the game's *own on-screen text*.
2. **Economy dead-ends** — at least one core currency (**Crony Favor**) has **no faucet**, making large parts of the D.U.M.P. tree unreachable in a fresh run.
3. **Specified-but-unimplemented systems** — Inflation Heat, D.U.M.P. hazards, Tier 2 prestige, Phase 4 ontological tariffs, and the viral clip generator are documented but absent or cosmetic-only.

---

## 2. Doc ↔ Code Discrepancies

| # | System | Design Doc Says | Code Actually Does | File |
|---|--------|-----------------|--------------------|------|
| D1 | **Prestige SIS formula** | `SIS = floor((LifetimeCash/10^10)^0.32 + 3×(OptionsProfit/10^9)^0.38)`, threshold **$10^10** | `floor((netWorth/10^6)^0.33)`, threshold **$1M** | `engine/math/formulas.ts` |
| D2 | **Frenzy duration** | 20 seconds | 15 seconds | `store/slices/deskSlice.ts` |
| D3 | **Ink per click** | 1.25 ink | **2 ink** (UI text still says "1.25") | `deskSlice.ts` / `InkMeter.tsx` |
| D4 | **Dry-nib tantrum** | +3.5% per click, can fill to 100% | **+3.0%**, capped at **50%** (UI text says "+3.5%") | `deskSlice.ts` / `TantrumMeter.tsx` |
| D5 | **Ink refill cost** | `$25 × 1.15^n` | base **100**, `×1.15^n`, cap **25,000** | `engine/math/formulas.ts` |
| D6 | **Crash severity** | capped at 0.92 severity | `max(0.08, 1 − (0.25 + tariff/1000)·frenzy·shotgun)` — floor 0.08 multiplier (≈92% max drop) | `store/slices/tradingSlice.ts` |
| D7 | **Prestige reset** | Shell Company seed cash + perk retention | Resets to **Phase 1**, clears **all** access flags, **no** seed cash, **no** perk retention | `store/slices/prestigeSlice.ts` |

> **D3 & D4 are the most user-visible:** the meters literally display numbers the engine does not honor. Either the code or the label must change so the UI never lies to the player.

---

## 3. Economy Dead-Ends (High Priority)

### 3.1 Crony Favor has no faucet ⚠️
`cronyFavor` initializes to **30** (`tradingSlice.ts:32`, `prestigeSlice.ts:62`) and is **only ever decremented**:

- Subpoena Shredder: `−10` (`deskSlice.ts:176`)
- Agency liquidation: `−cronyFavorCost` (25 → 1000) (`dumpSlice.ts:52`)
- Raid bribe: `−50` (`tradingSlice.ts:250`)

A grep across the entire `src/` tree found **zero increments**. Consequences:
- The D.U.M.P. tree (agencies cost 25–1000 favor) is **unreachable** beyond the first cheap agency.
- The raid-bribe safety valve (needs 50) is **unusable** after the first few spends.
- The shredder (needs 10) becomes permanently dead.

**Recommendation:** Add a favor faucet — e.g. +1 favor per YAP landed, +favor per agency liquidated (disaster-capitalism kickback), or a passive drip tied to `slopSuspicion`/tariff activity. This is the single highest-impact gameplay fix.

### 3.2 `lastSavedTimestamp` double-count risk
`lastSavedTimestamp` is written every 5s and read by the offline calculator, while `onRehydrateStorage` also calls `creditOfflineEarnings`. Verify these two paths cannot both credit the same elapsed window (potential free-money exploit or, conversely, lost earnings).

---

## 4. Specified-but-Unimplemented Systems

Confirmed absent or cosmetic-only via grep:

| System | GDD Ref | Status |
|--------|---------|--------|
| **Inflation Heat / Civil Unrest** | §3.5 | Only a comment in `deskSlice.ts:336`. No state, no tiers, no mitigation (flyovers/UFO/stimulus). |
| **Fat-Finger Autocorrect mini-event** | §3.3 | Not implemented. |
| **D.U.M.P. hazards** | §3.1 | `hazardDescription` / `hazardPenaltyPercentage` defined but **never applied**; `monetizeHazard` **never called**. Hazards are cosmetic. |
| **Disaster-capitalism silver linings** | §3.1 | Not implemented. |
| **Tier 2 Prestige (America LLC)** | §4 | `incorporateAmericaLLC` exists but **no UI**; `executiveDecrees` unused. |
| **Phase 4 Ontological Tariffs** | §4 | Types exist (`ontologicalTariffs`, `entropyDeficit`) but **no logic/UI**. |
| **Prestige perk tree** | §4 | `unlockPerk` has **no catalog and no UI**; 6 documented perks (Shell Company, 280-Char Macro Wreck, QEaaS, Insider Exemption 401(k), Pardon Assembly Line, Golden Parachute) all missing. |
| **S.L.O.P. 90–99% shredder QTE / 100% filibuster minigame** | §3.4 | Simplified to a single button. |
| **Diplomatic Hostage Begging DMs** | §3.2 | Only static begging tiers in the tariffs tab. |
| **Viral 9:16 clip generator** | Phase 5 | Not implemented. |
| **Streamer mode (Twitch/Kick)** | Phase 5 | Toggle exists; no integration. |

---

## 5. Dead / Unused Code

Tracked or defined but never read/used — safe to wire up or remove:

- `hasSettledYapTrade` — set, never read.
- `dryClicksCount` — tracked, unused (GDD mentions a 30-click jam).
- `contractsCount` — computed, unused.
- `targetPrice` / `strikePrice` on trades — set equal to entry, unused.
- `impactMultiplier` on `YapPost` — unused.
- `YapState` type — defined, unused.
- `PrestigePerk` / `OntologicalTariff` types — defined, unused.
- `totalCashHarvested`, `activeHazardsCount`, `disasterCapitalismRevenue` — tracked, not surfaced in UI.
- `streamerMode` — toggle only.
- `monetizeHazard` — defined, never called.

---

## 6. Prioritized Recommendations

### P0 — Correctness / Playability
1. **Add a Crony Favor faucet** (§3.1). Without it, the D.U.M.P. tree is a dead end.
2. **Reconcile UI text with engine values** for ink consumption (D3) and dry-nib tantrum (D4). The meters must not display numbers the code ignores.
3. **Verify offline double-count** on `lastSavedTimestamp` (§3.2).

### P1 — Doc Alignment
4. Decide the canonical prestige formula and update **either** `formulas.ts` **or** the GDD (D1). The current $1M/0.33 implementation is far more generous than the documented $10^10/0.32+0.38.
5. Align frenzy duration (D2), ink refill base (D5), and crash cap (D6) with the GDD, or amend the GDD to match the shipped balance.

### P2 — Feature Completion (aligns with `FEATURE_ROADMAP.md` Phase 3)
6. **Inflation Heat / Civil Unrest loop** — the largest missing Phase 3 system; adds the active-friction counterweight the economy currently lacks.
7. **Wire D.U.M.P. hazards** — call `monetizeHazard`, apply `hazardPenaltyPercentage`, and surface `disasterCapitalismRevenue` in the UI.
8. **Prestige perk catalog + UI** — implement the 6 documented perks and seed cash on reset (D7).

### P3 — Phase 4 & 5
9. **Tier 2 Prestige (America LLC)** UI + Executive Decrees.
10. **Phase 4 Ontological Tariffs** logic and UI ($10^18 → $10^42).
11. **Viral 9:16 clip generator** and **Streamer mode** integration.

### P4 — Polish
12. Remove or wire the dead code in §5.
13. Implement the S.L.O.P. shredder QTE / filibuster minigame and the Fat-Finger autocorrect event.

---

## 7. What's Working Well

- **Clean architecture:** strict `types → engine → store → components` layering holds; no god-files; slice pattern respected.
- **Idle invariants honored:** 48h offline cap, guaranteed click floor, "Too Big to Fail" bailout, offline trade-expiration extension.
- **Causal volatility:** crashes are driven by player YAPs/tariffs, not passive RNG — matches the design intent.
- **Tactile juice:** recoil, ink splatter, confetti, procedural audio, and `prefers-reduced-motion` handling are all present.
- **Legal safety:** parody roster is consistently used; no real names/brands found.

---

*Generated as a read-only audit. No source files were modified. Do not push to remote without explicit user instruction (per `AGENTS.md`).*

---

## 8. ✅ Fixes Applied (Post-Audit Implementation Pass)

> **Build status after fixes:** ✅ Clean (`tsc -b && vite build`, exit 0 — 1929 modules, 378.16 kB JS, 58.69 kB CSS). `oxlint` clean.

A new single-source-of-truth module **`src/constants/balance.ts`** was introduced so UI text and engine math can never drift again. All tuning values below are now imported from it.

### P0 — Correctness / Playability
| Item | Fix |
|------|-----|
| **Crony Favor faucet** (§3.1) | Added three faucets: **+2 per YAP landed** (`tradingSlice.triggerYapMarketShock`), **+0.05/sec passive drip** (`deskSlice.tickDesk`), and a **25% liquidation kickback** (`dumpSlice.liquidateAgency`). Capped at `CRONY_FAVOR_MAX = 9999`. |
| **UI ↔ engine drift (D3/D4)** | `InkMeter` and `TantrumMeter` now render values imported from `balance.ts` (`INK_PER_CLICK`, `INKED_TANTRUM_PER_CLICK`, `DIET_SODA_TANTRUM_PER_CLICK`, `DRY_TANTRUM_PER_CLICK`). The meters can no longer lie. |
| **Offline double-count** (§3.2) | `partialize` no longer stamps `Date.now()` on every serialization (it now persists the real `lastSavedTimestamp`), and `onRehydrateStorage` stamps `now` after crediting — the offline window can no longer be re-credited on rapid reload. |

### P1 — Doc Alignment
| Item | Fix |
|------|-----|
| **Prestige formula (D1)** | `calculatePrestigeSIS(lifetimeCash, optionsProfit)` now implements the GDD two-term formula `floor((L/10^10)^0.32 + 3×(P/10^9)^0.38)`; threshold raised to **$10^10**. `CaymansPrestigeTab` label/feedback updated to match. |
| **Frenzy duration (D2)** | Now `FRENZY_DURATION_SECONDS = 20`. |
| **Ink refill base (D5)** | `calculateInkRefillCost` base changed **100 → 25** (`min(25 × 1.15^n, 25000)`). |
| **Crash severity (D6)** | Now `min(MAX_CRASH_SEVERITY=0.92, (0.25 + tariff/1000) × frenzy × shotgun)`. |
| **Prestige reset (D7)** | `executeFlightToCaymans` now seeds **Shell Company cash** `max(100, 1e6 × SIS^1.2)` and resets `lifetimeCashEarned`/`lifetimeOptionsProfit` accordingly. |

### Dead Code Wired (§5)
- `dryClicksCount` — now drives the **30-click dry-nib jam** (`DRY_CLICK_JAM_THRESHOLD`), collapsing click yield to 2%.
- `contractsCount` — surfaced in the active-trades list.
- `targetPrice` / `strikePrice` — now set to meaningful PUT/CALL strikes (±5%) and targets (±10%), and displayed per trade.
- `impactMultiplier` — surfaced in the Resolute Blotter directive strip (with tariff % and viral-quote count).
- `totalCashHarvested`, `activeHazardsCount`, `disasterCapitalismRevenue` — surfaced as a stats strip in the D.U.M.P. Agencies tab.
- `hasSettledYapTrade` — confirmed **already read** in `useGameStore.ts` (not dead).

### Still Open (unchanged by this pass)
- Inflation Heat / Civil Unrest, D.U.M.P. hazard penalties (`monetizeHazard` still uncalled), Tier 2 prestige UI, Phase 4 ontological tariffs, prestige perk catalog, viral clip generator, streamer integration, and the unused `YapState` / `PrestigePerk` / `OntologicalTariff` types (reserved for those future systems).
