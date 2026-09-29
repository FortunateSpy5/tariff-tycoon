# UX Evaluation & Redesign Plan — 3:00 AM Terminal Panic

**Target:** *EXECUTIVE DEGEN: SHORT THE WORLD* (*The Art of the 3:00 AM Tariff*)
**Status:** 🟡 **P0s SHIPPED** · Phase 0 ready to start · Phases 1–4 proposed
**Date:** 2026-09-29
**Supersedes:** nothing. `UI_REDESIGN_PLAN.md` remains the historical record of the
newsprint/classified pass and is still the source for the region→material table.

> **Why this document exists.** `UI_REDESIGN_PLAN.md` closed the *theme* gap
> (81 → 0 unthemed surfaces) and made the cockpit coherent. It did not ask the
> next question: **does every element on screen mean something, and does the game
> look like the thing it is about?** This plan is that evaluation, plus the
> redesign that answers it.

---

## Method

Read `GAME_DESIGN_DOCUMENT.md`, `UI_DESIGN_SPECIFICATION.md`, `.agents/` rules,
`FEATURE_ROADMAP.md`, `PROJECT_KNOWLEDGE_BASE.md`, and the full `src/` tree. Then
drove the running game in real Chrome (agent-browser) at **1920×1080**,
**2560×1080**, **1366×768** and **1280×720**, exported the live certificate PNG,
and instrumented the DOM to measure dead space, text contrast and hover coverage.
Findings below are measured, not estimated, unless marked *inferred*.

---

# PART 1 — Two P0 bugs (FIXED, verified in-browser)

## P0-1 · The first-slam unlock was consumed by the idle loop, soft-locking the game's entire premise

### Root cause

`deskSlice.tickDesk` and `clickDesk` shared one rule resolver.
`useGameLoop` fires `tickDesk` every **100 ms**, and `resolveTutorialIndex`
contains the first-slam rule:

```ts
if (isFirstSlam(currentIndex)) return 1;   // was reached by EVERY path
```

The first idle frame after page load therefore advanced `tutorialStepIndex`
`0 → 1` with **zero clicks**. From then on `resolveMarketAccess(false, 1)`
returned `false` **forever** — nothing else in the codebase ever set it true.

### What a new player saw (reproduced)

> Directive card: **"STEP 2/5 // OPEN A PAPER PUT — BagHolder Pro is live on your first slam"**
> Left wing: **"CHANNEL SEALED / TO OPEN → Slam the customs stamp once."**

The tutorial pointed at a channel the seal said was locked by an action the player
had **already performed** — and clicking could never satisfy it. The causal
shorting loop, the thing GDD §3.2 calls *"the entire game,"* was unreachable.

The bug was **masked on every run after the first**, because
`onRehydrateStorage` contains a defensive repair:

```ts
state.hasMarketAccess = Boolean(state.hasMarketAccess || state.phase >= 2 || state.totalClicks > 0);
```

So a reload always fixed it. **Only a genuinely new player hit the soft-lock** —
i.e. exactly the audience that decides whether the game gets a second session.

### Fix

Split the resolver by *authority*, not by call site.

| Function | May ADVANCE | May TERMINATE at Phase 2 | Called from |
|---|---|---|---|
| `resolveTutorialIndex` | ✅ (first slam only) | ✅ | `clickDesk` **only** |
| `resolvePassiveTutorialIndex` | ❌ | ✅ | `tickDesk`, `creditOfflineEarnings` |

New invariant **[Only A Real Slam Advances The Chain]** in `onboardingEngine.ts`.
`deskSlice` calls the passive resolver on both passive paths.

### Verified

| State | `idx` | `clicks` | `hasMarketAccess` | `tariffPerSec` |
|---|---|---|---|---|
| fresh save | 0 | 0 | `false` | 0 |
| after 3 s idle | 0 | 0 | `false` | 0 |
| after 1 slam | 1 | 1 | **`true`** | 0 |

---

## P0-2 · Default tariff dials paid $40/s from turn one — 8× a click, before the player had the dials

### Root cause

`tariffRates` shipped pre-set at **75–200 %**. `tickTariffRevenue` is a pure
function of those rates, so it paid **$40.28/s** on frame one of a brand-new run
against a **$5.00** stamp slam — with the Tariffs channel still **sealed** and no
dial ever moved by the player.

Measured fresh run, no clicks, no unlocks:

```
tariffRevenuePerSecond: 40.275   clickValue: 5.00   →  idling is 8.1× clicking
```

Consequences: the primary clicker was strictly dominated by doing nothing —
precisely the *"Ten-Minute Wall"* failure mode the first-slam redesign existed to
kill. Phase 2 (~$1 M ≈ 7 h) and the $10 B prestige threshold were both reachable
by leaving the tab open.

### Fix — a gate, not a rebalance

Chosen scope: gate revenue behind the actual unlock. **No exponent changes.**
The Laffer curve in `tariffEngine.ts` is untouched.

1. All six dials start at **0 %** in `deskSlice` initial state.
2. Same in `prestigeSlice.executeFlightToCaymans` (it was smuggling ~$40/s back
   in on the frame a player returned to a run).
3. `BilateralTariffsTab` fallbacks changed `?? nation.defaultTariffRate` → `?? 0`.
   **This was load-bearing:** without it, any missing key would have re-opened the
   faucet and the dial would read one number while the engine paid out on another.
4. New 0 % begging tier: *"No diplomatic correspondence on file. This nation has
   not yet been harmed."* — a nation nobody has tariffed has nothing to beg about.

`canSetTariff` already requires `phase >= 2 && hasTariffAccess`, so revenue can
only begin after the player is **given** the dials and turns them.

### Verified

Fresh save → `tariffRevenuePerSecond: 0`. Tariffs tab: every dial `0%`,
`Duty: +$0.0/s`, header `TOTAL DUTIES: +$0.00/s`.

### Build gates

`npm run build` clean — `tsc` ✓ · `theme:check` 0/0 ✓ · `size:check` ✓ ·
`oxlint` 0 warnings · 84 files.

> `deskSlice.ts` briefly hit **411 lines** (400 hard ceiling) from the new
> invariant comments. Comments were condensed to 396. *Invariant prose must be
> counted too* — `size:check` will fail on a comment-only change.

---

# PART 2 — The evaluation

## The one-line diagnosis

> **The game is written as a trading-desk sim and built as a filing cabinet.**

The satire, the causal loop and the share artifact are all excellent. The screen
is a beige rectangle with a blue circle in it, ~40–60 % empty at any moment — and
the one moment the whole design is built around (*watching the sector you just
nuked go red*) **is not rendered anywhere.**

## What already works — protect these

| Asset | Why it stays |
|---|---|
| **The decree certificate** | The best asset in the repo. 1080×1920, wax seal, redaction bar, `CLASSIFIED // 3:00 AM`, portfolio-at-risk, genuinely funny generated YAP. **This is the viral hook and it lands.** |
| **The material system** | Parchment desk / phosphor CRT / classified wing reads as three distinct *objects*. `theme:check` at budget 0 makes regression impossible. |
| **Motion damping** | `stamp-slam-calm`, `calm-glow`, and a reduced-motion block that covers `animation-*` (not just `transition-*`). Someone already fought the frenzy judder and won. **Do not undo.** |
| **The 8-second Walk-Back** | Best mechanic in the game and the only genuinely *timed* skill expression. Currently under-sold. |
| **The Tariffs tab** | The one dense, well-composed screen: six nations, live income, `Depresses: $FRUT` causality, escalating cables. **This is the quality bar.** |
| **Juice fundamentals** | Procedural audio, ink splatter, floating numbers, frenzy confetti are all present and working. |

## Findings, ranked

### A · The chart does not exist — highest-impact single gap

`UI_DESIGN_SPECIFICATION` §4.2 and `FEATURE_ROADMAP` Phase 2 both promise a
*"live S&Pain 500 mini candlestick/sparkline chart."*

`StocksOptionsTab.tsx` renders **no chart**. There is a `<div>` labelled *"Active
Stock Candlestick Telemetry"* containing a ticker, a price and a delta — and then
nothing. `priceHistory` is written by `resolveYapShock` and **read by no
component**. Grep confirms zero `<canvas>` / `<svg>` chart code in `src/`.

Consequence: you fire a YAP, a sector crashes, and the only feedback is
`CRASHED $PAIN!` in a thin green toast plus a scrolling headline. GDD's own
framing — *"must instantly plummet the candlestick chart on the left"* — is
undelivered. **This is the emotional payoff of the entire design and it is invisible.**

### B · ~40 % of the centre stage and ~55 % of the right wing is dead space

Measured at 1920×1080:

| Region | Size | Content | Dead |
|---|---|---|---|
| Desk clicker wrapper | 475 px | 271 px button | **204 px (43 %)** |
| Right wing — Caymans | 627×980 | 2 cards | **~640 px** |
| Right wing — Unlocks | 627×980 | 5 rows | **~620 px** |
| Left wing — PolyGrift | 468×980 | 4 cards | **~470 px** |

Panes report 0 % dead-below because they are `flex-1` — the emptiness lives
*inside* a centred child. The desk is a 786×980 sheet of cream with one 240 px
circle floating in it.

### C · No focal moment, and no "3 AM"

Chosen direction: **full 3:00 AM terminal-panic.** The game is currently
uniformly calm newsprint; saturation is near zero and the only red in the app is
the crisis banner. For a streamer game there is no frame that is *louder* than
the others. Frenzy — the best 20 seconds in the game — changes a ring colour and
a badge. **There is no big countdown anywhere.**

### D · Income is invisible

`tariffRevenuePerSecond` appears in exactly two components (Tariffs tab header,
`BreakingNewsBar`). There is **no $/sec readout on the cockpit**, and it only
appears in a channel sealed until Phase 2. The player cannot see their income,
what scales it, or what a dial bought them.

### E · Correct mechanics, dishonest label

The clicker reads **`SIGN TARIFF`**. Clicking it sets no tariff — it adds $50 and
tantrum. The YAP button sets tariffs. Two buttons, one verb, one lies.

### F · The tutorial step-2 seam

Step 1 fires on slam; step 2 says *"Pick a ticker and SHORT a PUT."* No beat
walks the player to the watchlist, and no highlight lands on the ticker rows.
New players bounce here.

### G · Doc ↔ code drift

AGENTS.md: *"A stale doc is a defect."* These are live:

| Claim | Reality |
|---|---|
| `UI_DESIGN_SPECIFICATION` §2 — ultrawide centres the cockpit at `max-w-[1720px] aspect-[16/9] mx-auto` | `App.tsx` has **no max-width**; at 2560 px the desk stretches to 840 px of empty parchment |
| §2 + rules file — root uses `bg-stone-950` | code uses `bg-newsprint-950` |
| Rules file — `[2] POLY-GRIFT / [3] S.L.O.P. Radar` | code order is `radar`, then `polygrift` |
| Rules file — footer `h-9` (36 px) | code is `h-8` (32 px) |
| `FEATURE_ROADMAP` — Phase 3 "D.U.M.P. Chainsaw Engine" **unchecked** | fully implemented and playable |
| `FEATURE_ROADMAP` — Phase 3 "Oligarch Lobbying Tech Tree" **unchecked** | fully implemented and playable |
| `.agents/AUDIT_REPORT.md` | **deleted** in the working tree, still linked from 3 docs |

### H · 18 interactive elements with no hover context

40 buttons; **18 have no `title` / `aria-label`** — including all 9 watchlist rows,
all 6 leverage/collateral chips, both trade buttons, the hero clicker, and the
certificate button. Addressed in Phase 0.

---

# PART 3 — The plan

## Phase 0 — Make it mean something

> *"For each component it should make sense and contribute to the game experience.
> Any text or component should have some meaning. For certain elements it would be
> best if we can get more context on hover."*

### 0.1 The meaning audit

For every label ask: **what is this, why does it exist, what does the player do
with it?** Three verdicts — **LOAD-BEARING** (keep, maybe promote) ·
**DECORATIVE** (delete, or give it a job) · **LIAR** (fix the text).

| Element | Verdict | Action |
|---|---|---|
| `GATE 99B` | ⚠️ **Real-world reference.** Composite of JFK TWR / JFK Terminal 4 gates (the "Gate 40s"); "Liberty International" is fictional. Low legal risk, but reads as real | Rename to `GATE 99B, THE DEEPLY TERMINAL ANNEX` so it is unmistakably invented; record the reasoning in `legal-compliance-and-parody.md` |
| `AGENT 412` | Load-bearing (the stamp's identity) | Hover: *"The Customs Service's most decorated confiscator. Badge number rumored to be load-bearing."* |
| `GOLD BOX` | ⚠️ **Weak.** $500 on an 8 s cooldown for +8 % S.L.O.P. Trivial early, noise late. Its real cost is suspicion and nothing surfaces that | Reposition as the **early-game cash bridge** — the tutorial needs ~$500 in 10 s. Wire the tutorial to it; surface the S.L.O.P. cost on hover |
| `SHREDDER` | ⚠️ **Dead in Phase 1.** `canShredSubpoenas` requires `phase >= 2`, but the prop renders from turn one, so it looks enabled and silently fails | Apply the existing *seal is a promise* treatment, or hide until Phase 2 |
| `RED PHONE` / `CRISIS CALL` | Load-bearing, well-voiced | Keep; fix layout (2.4) |
| `SIGN TARIFF` on the clicker | **Liar** | → **`SIGN ORDER`**. Phase 1's `CONFISCATE` is correct and funny — keep it |
| Gold Box glyph | Minor | Swap jewellery-looking glyph for `Archive` — it is a document box |
| Directive sheet | Under-used | The best real estate on the desk holds **one static sentence**. Make it the live YAP feed + reply swarm |
| `CAREER OBJECTIVES` | ⚠️ **Never-ending.** Stays forever, half struck through | Auto-collapse completed rows; the list should shrink as you win |
| `ISSUE A CERTIFICATE` | Load-bearing but **buried and unnamed** | Promote to a top-level action, rename **`[ SHARE THE DAMAGE ]`**, subtitle *"Exports a 1080×1920 PNG of your latest decree."* |
| `CITADULL HFT FEED` / `0MS LATENCY` | Pure decoration | Keep one, delete the other |
| `CABINET GOVERNANCE / READY` | Dead — never changes | Delete, or replace with a live readout (2.5) |

### 0.2 The hover-context pass

Add `title` to all 18 uncovered elements, in voice. **Rule: hover explains
mechanism and stakes — never restates the label.**

- Watchlist row → *"DoorPlug Dynamics. Commercial jets held together by blue tape & prayer. Base $145.00 · volatility 1.8×. Tariffs on The Overthinker Union depress this."*
- `100x` → *"100× leverage. A 10 % adverse move wipes the collateral. 0DTE: gone in 60 seconds."*
- `+$500` collateral → *"Collateral locked. You can lose at most this. Wins scale with leverage and VEX."*
- Hero clicker → *"Slam to issue an executive order. Costs 1.25 ink (regens 0.5/s). Builds Tantrum — 100 % triggers CAPS LOCK FRENZY, 10× for 20 s."*
- `GOLD BOX` → *"Sell a classified bathroom blueprint offshore: +$500 cash, +8 % S.L.O.P. suspicion. 8 s cooldown."*
- `SHREDDER` → *"Burn subpoena paperwork: −25 % suspicion for 10 Crony Favor. Oval Office instrument."*

Ship one shared `<HintTooltip>` primitive (or extend `Card`) so these cannot
drift, and pair every `title` with an `aria-label` — `title` alone is not
accessible and does not appear on touch.

> **Gate:** no element on screen may be unhoverable.

---

## Phase 1 — Fill the dead space *(surgical, no visual risk)*

- **1.1 Build the chart** *(approved)*. Replace ~5 of 9 watchlist rows with a real
  candlestick / area chart for the selected ticker. `priceHistory` → SVG polyline +
  candles. YAP crash animates down over ~250 ms with a red impact flash and a
  marker on the YAP point. Compact rows to ~30 px so all 9 fit without scrolling.
- **1.2 Right wing.** Give Caymans and Unlocks real content — the **6 SIS perks
  from GDD §5 are entirely unimplemented** and the perk tree currently renders
  nothing. Add a prestige-progress projection so a sub-$10 B player can see the climb.
- **1.3 Career Objectives.** Collapse completed rows; promote next-up objective to 2× size.

---

## Phase 2 — Go loud *(chosen direction: 3 AM terminal-panic)*

- **2.1 Palette.** Darken the surround; keep parchment as the **desk only**; push
  wax-red / gold saturation; add a `panic` scale that fires on frenzy / crisis / raid.
- **2.2 The desk becomes an object.** Wood/leather surround, blotter under the
  stamp, props as *objects resting on paper* (drop-shadow + slight rotation) rather
  than cards. GDD's "parchment directive" and "physical props" stop competing.
- **2.3 The clicker gets weight.** Replace the plain circle with a layered-SVG
  **Rubber Stamp / Golden Sharpie** (handle, barrel, nib, ink staining). Fills 204 px
  of dead space with something worth screenshotting.
- **2.4 Crisis layout.** The banner's content overflows its own box (`MAX` wraps to a
  second line). Rebuild as a proper alarm strip with a real countdown.
- **2.5 Make it a cockpit.** Prominent `$X/s` with a source breakdown; the frenzy
  **20-second countdown** as a large number; the walk-back window as a shrinking ring.
- **2.6 Ultrawide.** Implement the `max-w-[1720px]` the spec already claims.

---

## Phase 3 — Viral & streamer

- **3.1** Promote `[ SHARE THE DAMAGE ]` to a top-level action.
- **3.2** Show the last YAP in full on the desk; wire the `@MadBagsJim` reply swarm
  (`yapEngine` has the content, it is not connected).
- **3.3 Fat-finger autocorrect** — the single funniest beat in the GDD, entirely
  unimplemented. `$DOOR` → `$DORK`, +10 000 % pump, 45-second dilemma
  (retract / double down / secretly dump offshore). **This is the clip.**
- **3.4 Streamer mode.** `!YAP` / `COOKED` chat commands filling a blood-pressure
  meter; chat tariff votes; raid-triggered Special Counsel. GDD §6.2 already
  specifies all of it. Chat integration is the most reliable virality lever in
  the genre.
- **3.5** Drop `100% TRANSFORMATIVE PARODY` from the certificate footer — it costs
  viral real estate on every single share. Keep the disclaimer in repo docs instead.

---

## Phase 4 — Doc hygiene

Fix every row of Finding G. Delete the stale `.agents/AUDIT_REPORT.md`
references. Then add a **doc-drift check** to `npm run build`, asserting the
things that actually drifted:

- the chart component exists,
- `max-w-[1720px]` is present in `App.tsx`,
- the footer height matches the rules file.

Cheap, and it stops the exact failure mode AGENTS.md warns about.

---

## Sequencing

**Phase 0 → 1.1 (chart) → 2.3 + 2.5 (focal moment + cockpit readouts) →
2.1 + 2.2 (palette + desk) → Phase 3 → Phase 4.**

Phase 0 first: it is cheap, it makes everything after it legible, and it is what
was asked for.

---

## Definition of done

- [ ] No element on screen is unhoverable; every hover explains stakes, not labels
- [ ] No label lies about what its control does
- [ ] Every panel earns its pixels — no surface is empty while an adjacent one scrolls
- [ ] A YAP visibly crashes a chart, in the same millisecond, on the same screen
- [ ] The 20-second frenzy countdown is unmissable
- [ ] The certificate is one click from anywhere in the game
- [ ] Zero doc ↔ code drift, enforced by a build gate
- [ ] `npm run build` clean · `oxlint` clean · no file over 400 lines
