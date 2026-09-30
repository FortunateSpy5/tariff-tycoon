# UX Evaluation & Redesign Plan — 3:00 AM Terminal Panic

**Target:** *EXECUTIVE DEGEN: SHORT THE WORLD* (*The Art of the 3:00 AM Tariff*)
**Status:** 🟢 **P0s SHIPPED** · 🟢 **Phase 0 SHIPPED** · 🟢 **Phase 1 SHIPPED** · Phases 2–4 proposed
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

## Phase 0 — Make it mean something ✅ COMPLETE

> *"For each component it should make sense and contribute to the game experience.
> Any text or component should have some meaning. For certain elements it would be
> best if we can get more context on hover."*

### What actually shipped

**The primitive.** `src/components/ui/hint.ts` exports `hint(text, name?)`, which
writes `data-hint` and, where the element's visible text is not a sufficient
accessible name, `aria-label` — in one call, so they cannot drift apart again.
`src/components/ui/HintTooltip.tsx` exports the single `<HintLayer>`: one bubble,
portalled to `document.body`, driven by delegated pointer/focus listeners against
any `[data-hint]`.

Three decisions worth recording, because the obvious alternative is worse:

- **A delegated layer, not a wrapper.** `<HintTooltip>{children}</HintTooltip>` was
  the brief. In a zero-scroll cockpit the wrapper becomes the flex item instead of
  the button, so 9 watchlist rows and 3 chip rows would each have needed their
  inner button forced back to `w-full` — and one mistake reflows the cockpit. The
  layer adds zero DOM to any call site, so no layout can drift.
- **`data-hint`, not `title`.** The native tooltip is unstyleable, arrives after a
  delay, does not appear on touch, and is not exposed to assistive tech. It also
  cannot be paired with anything — which is precisely how 12 `title`-only elements
  ended up with no accessible name. Every `title` in the tree was **converted**,
  not supplemented, so no element shows two tooltips.
- **`aria-disabled`, not `disabled`, on gated controls.** Chromium swallows
  pointer events on a natively disabled button, so the hint explaining *why* a
  control is unavailable would vanish at exactly the moment it is needed. Four
  pre-existing `disabled` buttons were converted for this reason.

**The gate.** `npm run hover:check` (budget 0, inside `npm run build`) parses
every JSX opening tag, tracks brace/quote depth so an `onClick={() => …}` arrow
does not truncate the tag, and fails on any operable element with no hint.
It was hardened after review — see [Phase 0 review round] below.

```text
43 operable elements without a hint   (start of Phase 0.2)
 0 operable elements without a hint   (end)
```

Verified in-browser at 1920×1080 on a fresh save and a seeded Phase 2 save:
**41 hinted elements on screen, 0 operable without a hint, 0 nameless icon
buttons, 0 hinted elements left natively `disabled`, 0 residual `title`
attributes, 1 tooltip layer mounted, zero scroll, zero console errors.**

### 0.1 The meaning audit — as shipped

For every label ask: **what is this, why does it exist, what does the player do
with it?** Three verdicts — **LOAD-BEARING** (keep, maybe promote) ·
**DECORATIVE** (delete, or give it a job) · **LIAR** (fix the text).

| Element | Verdict | Shipped |
|---|---|---|
| `GATE 99B` | ⚠️ **Real-world reference.** Composite of JFK TWR / JFK Terminal 4 gates (the "Gate 40s") | → **`GATE 99B, THE DEEPLY TERMINAL ANNEX`**, centralised in `constants/setting.ts` (it was hard-coded into seven strings that were already inconsistent). New general test recorded in `legal-compliance-and-parody.md` §1.5: *could this string appear, unironically, on a sign in the real world?* GDD, README, PKB and the layout rules updated. |
| `AGENT 412` | Load-bearing (the stamp's identity) | Hint added, via the clicker contract |
| `GOLD BOX` | ⚠️ **Weak.** Trivial early, noise late; its real cost surfaced nowhere | **Repositioned as the early-game cash bridge.** The player starts with $100 and the order slip wants $1,000 of collateral, so the tutorial's own paper PUT is unaffordable until this is used — tutorial step 1 now names it. **Two bugs fixed:** the component discarded `sellClassifiedSecrets()`'s boolean and showed `+$500 CASH` on clicks the 8 s cooldown had rejected, and it had no cooldown readout at all. It now reads the store's own `lastSecretSaleTimestamp`, shows `Restocking (Ns)`, and prices the heat against the raid bribe. |
| `SHREDDER` | ⚠️ **Dead in Phase 1.** `canShredSubpoenas` requires `phase >= 2`, but the prop rendered from turn one, fully styled, and silently failed — then reported the wrong reason (`COOLDOWN ACTIVE`) | **Seal-is-a-promise treatment.** Below Phase 2 it renders the same prop, non-interactive, naming the threshold that opens it. A hidden prop teaches nothing; a sealed one is a promise. The S.L.O.P. Radar copy was gated the same way. |
| `RED PHONE` / `CRISIS CALL` | Load-bearing, well-voiced | Kept; hints only. Layout fix is still Phase 2.4 |
| `SIGN TARIFF` on the clicker | **Liar** — it set no tariff | → **`SIGN ORDER`**. Phase 1's `CONFISCATE` kept, and its hint now uses the *same verb as its own face* — an earlier draft had the hover saying "issue an executive order" under a `CONFISCATE` label, which is the same lie in a new place |
| Gold Box glyph | Minor | Already `Archive` — no change needed |
| Directive sheet | Under-used: the best real estate on the desk held one static sentence | **Extracted to `<DirectiveSheet>`** and made a *named* wire — header says which document it is, the body is the live post, the footer is the post's own telemetry (tariff, impact, quote count). The `@MadBagsJim` reply swarm is deliberately **not** here; that is Phase 3.2. |
| `CAREER OBJECTIVES` | ⚠️ **Never-ending.** Stays forever, half struck through | **Collapses as you win.** Finished rows fold into a `Certified:` line, the next unfinished objective is promoted with a `NEXT //` marker and a calm-glow ring, and each row's hover now states the *live reading and what completing it opens* rather than restating the `detail` printed beneath it. Progress bars gained `role="progressbar"`. |
| `ISSUE A CERTIFICATE` | Load-bearing but **buried and unnamed** | → **`[ SHARE THE DAMAGE ]`**, subtitle *"Exports a 1080×1920 PNG of your latest decree."* Top-level promotion to the chrome is still Phase 3.1 |
| `CITADULL HFT FEED` / `0MS LATENCY` | Pure decoration | **Deleted `CITADULL HFT FEED`**, kept the live one, and routed the left footer through `<StatusStrip>` — that hand-rolled footer was the reason the two wings' labels had drifted. `StatusStrip` gained an `accent` so the left wing keeps its phosphor identity |
| `CABINET GOVERNANCE / READY` | Dead — never changes | **Replaced with a live readout**: `readPhaseProgress` reports the gap to the next rung (`NEXT $1.00M` → `$0.25M TO GO`). It is the one number shown nowhere else that always has stakes |

### 0.2 The hover-context pass

**Rule: hover explains mechanism and stakes — never restates the label.**
**INVARIANT: [Stated Numbers Are True]** — a hint that quotes a number the
simulation does not use is a lie told at the exact moment the player is about to
risk money, so the copy is *computed from* `constants/balance.ts` and the engines
rather than typed. `stockHint.ts` is a headless module for that reason.

Two more copy defects the pass surfaced, both found by reading the live DOM:

- `INK_REFILL_COST_GROWTH` is **1.35**, but `formulas.ts`'s own KaTeX citation
  still read `1.15^n` and the figure had leaked into the `[R]` key hint. The code
  is the truth; the citation is what was stale, and it is now corrected.
- `StockDefinition.name` values ending in a period (`Fruit Ecosystem Inc.`)
  produced `Inc..` in the generated hint.

### Carried into later phases

- **Finding E (income is invisible)** is untouched — the prominent `$X/s` with a
  source breakdown is Phase 2.5. Only the *legal* figure now appears on the cockpit,
  on the Tariffs tab.
- **Finding F (the step-2 seam)** is untouched — walking the player from the
  directive card to a highlighted ticker row is Phase 1 work.
- **Finding A (the chart does not exist)** is untouched and still the highest-impact
  gap in the game. Phase 1.1.

---

## Phase 0 review round ✅ COMPLETE

Phase 0 was reviewed by five independent passes — infrastructure, desk, terminal
and deck, copy/voice/legal, and adversarial QA — and every finding that survived
verification was fixed. The dominant theme was **the hover system introducing new
lies of its own**, which is the one failure mode a self-auditing change is worst
at catching.

### The copy lies that shipped in Phase 0 and were removed

| Where | The lie | The truth |
|---|---|---|
| `ExecutiveGauges` | **`10x CASH · INK RESTORED`** — a *visible* label | `inkFrenzyEngine` freezes the tank and explicitly forbids a refund: *"a free refill would make the frenzy self-sustaining and break the drain"*. Now `INK HELD` |
| `stockHint` | **"0DTE: worth $0 in 60 seconds regardless"** | Expiry settles at the prevailing mark. A player who believed this sat on a *winning* position until it expired. This was the single most expensive line shipped |
| `stockHint` | **"the 10% target is where the contract actually pays"** | `calculateOptionReturn` is linear; nothing happens at 5% or 10%. Now named as reference marks |
| `stockHint` | SQUEEZE CALL warned as a rounding error | Hand-settling one skips the combo branch and prices it post-crash — **the entire stake**. Now says so |
| `objectiveHint` | **"with ink restored"** on the frenzy objective | Same engine invariant, three files from the label above |
| `objectiveHint` | "$1M opens the whole right deck at once" | It opens `dump` and nothing else |
| `PaneShell` | "**Wagers priced by how the trade war is actually resolving**" | `predictionSlice` says in terms that it is "deliberately NOT causal" — a raw `Math.random()` roll |
| `PaneShell` | "Crony Unlocks — the desk props … bought with political capital" | The shredder is not an upgrade, and `buyUpgrade` spends treasury cash, not favor |
| `PaneShell` | Tariffs "the only faucet that keeps paying with the tab shut" | Autopen and every liquidated agency also pay offline |
| `ResoluteBlotterCenter` | Shotgun "+25% more heat" | 12 → 16 is **+33%**; VEX 25 → 35 is +40% |
| `ResoluteBlotterCenter` | "spikes VEX — which pays MORE on every 0DTE position" | The vol factor multiplies the *signed* delta, so it accelerates losses too. Dangerous advice |
| `ResoluteBlotterCenter` | Waiting on the Red Phone "adds retaliatory heat" | Heat is charged once at resolution, `4 × (tier+1)` |
| `GoldBoxProp` | Cooldown shown to broke players | The store **waives** it below $50, so a broke player read "Restocking (5s)", was marked disabled, and was paid anyway |
| `DirectiveSheet` | "the quote count is the only prestige this economy offers" | It is `Math.random()` and is read by nothing. Prestige is Sovereign Immunity Slips |
| `DirectiveSheet` | "The reply swarm arrives with it" | A Phase 3.2 feature that does not exist |
| `BreakingNewsBar` | "spent on permanent perks in the Caymans vault" | `unlockPerk` is called from no component. Now marked `// roadmap:` |
| `ClickerButton` | Dry hint quotes a flat 10% | After 30 dry clicks the nib **jams** to 2% — and the gauge said "−90%" |
| `CaymansPrestigeTab` | Told the player their save could be beaten by "sizing up and holding a position" | A balance designer confessing an exploit, in the imperative |

### Three defects the code review found in the *engine*, surfaced by the copy

1. **The quoted refill price was not the charged price.** `refillInk` inlined
   `min(base + 2% of treasury, base × 4)` while the UI rendered
   `calculateInkRefillCost` — the base curve only. A player holding $10M was
   quoted **$25** and charged **$100**. Fixed by lifting the whole expression
   into `calculateInkRefillTotal` and having both sides call it; the copy now also
   states the 4× ceiling rather than implying the 2% is always "on top".
2. **`defaultTariffRate` was still the fallback in both engines.** The P0-2
   invariant says an absent key means "not tariffed", and `deskSlice` and
   `BilateralTariffsTab` both honoured that — but `marketEngine` and
   `tariffEngine` still fell back to the *default* rate. A missing key would have
   applied a silent 175% punitive drag while every surface displayed 0% and a
   relief rally. Both now read `?? 0`.
3. **The Laffer curve was duplicated into a component.** `BilateralTariffsTab`
   re-implemented `tariffEngine`'s five constants so its readout could agree with
   itself — the `phaseEngine` hazard again, and the per-point hint built on it
   was **~100× too large**. `lafferRateMultiplier`, `tariffPhaseWeight` and
   `nationDutyPerSecond` are now exported from the engine and imported.

### The `aria-disabled` rule, applied to itself

The invariant "a gated control must use `aria-disabled`, never `disabled`" was
written into the docs and then **violated by seven of the ten new gated
controls** — including the primary YAP button, whose "needs 20 ink" explanation
was unreachable exactly when a new player was stuck. All eleven gated controls
now use `aria-disabled` plus a handler guard, and the four that could fail
silently (`SlopRadarTab` bribe and shredder, `DumpAgenciesTab`, and the two
trade buttons) now say why.

### Accessibility fixes to the layer itself

- **`role="tooltip"` was inert.** Nothing pointed at it, so no assistive tech ever
  read a hint. `show()` now wires `aria-describedby` on the anchor — and
  `show()` *also* strips it from the previous anchor, because a sweep across
  several controls never calls `hide()` in between and was leaving a stale
  description pointing at the wrong bubble. Verified live: exactly one
  `aria-describedby` after a 10-control sweep, zero after leave.
- **`aria-label` was erasing live information.** On a button whose visible text is
  a reading — `Refill $25.00`, `COOLING DOWN (3s)`, `CALL NEEDED` — a static label
  *replaces* the accessible name. Eleven such labels were removed; the rule is
  now "pass a name only when the visible text is cryptic or absent".
- **A detached anchor pinned the bubble to the corner.** This app deletes hovered
  nodes routinely (dismissed run summary, liquidated agency, cleared toast). A
  60ms-old `getBoundingClientRect()` on a removed node returns zeros, and
  `pointerout` never fires — so the bubble sat at the top-left until the pointer
  wandered elsewhere. Now guarded with `isConnected`, and verified.
- The bubble clamps on **both** axes (it could resolve to a negative `top` and
  clip its own text), returns `null` when idle so no empty tooltip lives in the
  accessibility tree, caps its height, clears its pending timer on unmount, and
  no longer swallows touch taps.
- `--viewport-scale` is now mirrored onto `<html>`, so the portalled bubble
  inherits it. It was the one thing on screen not participating in the sub-1080p
  scale.

### The gate, hardened against its own bypasses

The first version could be satisfied by `hint('')` and ignored most React event
props. It now requires the `hint()` builder with a **non-empty literal**, matches
`/^on[A-Z]/` on tokenised attribute *names* (so `data-x="onClick=1"` no longer
counts), treats `role`/`tabIndex`/`contentEditable` as operable, and honours
`hint-allow` only inside a real comment and anywhere in the tag's line range.
Probed with 24 cases: every demonstrated bypass is caught, and composed
components (`<TabStrip onSelect={…} />`) no longer false-positive.

### Two bugs the adversarial pass found in Phase 0's own new code

- **The deck footer printed `-$28.96M TO GO`.** `readPhaseProgress` took the
  near-threshold branch when cash exceeded the next rung, which happens for a
  frame before `nextPhaseFor` promotes the phase. Clamped.
- **The portalled tooltip ignored the viewport scale** — see above.

### Also fixed

The shredder's local cooldown desynced from the store (and from its own `[S]`
hotkey); `Objectives`' `liquidation` row completed by buying an upgrade; the
`situationRoom` snapshot hardcoded `slopSuspicion: 0`; an icon-only dismiss
button had hover text and no accessible name; a `canShredSubpoenas` function
name was interpolated into player-facing copy; the `src/components/ui/index.ts`
barrel was deleted and all eight imports converted to concrete modules;
`AGENTS.md`, `agentic-code-architecture.md` and `README.md` were corrected —
the README had four wrong frenzy numbers including the ink-restore mechanic.

### Legal: one verbatim agency acronym removed

The legal pass flagged `D.O.E.-N.U.K.E.` in the liquidatable-agency roster.
`D.O.E.` is the real, exact, two-letter acronym of the US **Department of
Energy**, and the expansion sat one word from the real one ("En**ergetic**" vs
"En**ergy**"). The other nine acronyms in that roster are invented — `N.O.C.L.O.U.D.`
is not NOAA, `F.A.T.` is not FDA, `S.M.O.G.` is not EPA, `C.O.U.G.H.` is not CDC,
and most are ordinary English words — so this was a single targeted fix, not a
roster-wide one.

Renamed to `D.E.E.P.-N.U.K.E.`, which keeps the pun and closes the gap. The
generalised test is now written into `legal-compliance-and-parody.md` §1.5:
*for an acronym, is this exact letter sequence already in use by a real body? A
near-miss is safe; a verbatim is not.*

---

## Phase 1 — Fill the dead space *(surgical, no visual risk)*

### 1.1 Build the chart 🔄 IN PROGRESS

> **Scope note — this supersedes the brief below.** The plan said to draw the
> chart from `priceHistory`. That is not honest data: `priceHistory` is twenty
> **closes** at the 10 Hz tick — two seconds of data with no open, high or low.
> Slicing it into candle-shaped rectangles would have fabricated every wick, so
> the chart would display a volatility range the simulation never produced, in
> the one surface whose entire job is to tell the player the truth about their
> positions. That is Finding A's "lie" problem repeated in a new place.
>
> So 1.1 builds the data it actually needs: a real OHLC time-bucketing engine
> (`candleEngine.ts`, pure, unit-verified) that the 10 Hz tick feeds, so every
> wick on screen is a price the market actually printed. The crash scar is
> stamped by `triggerYapMarketShock` and `executeWalkBack` — the engines that
> *cause* crashes — never inferred by the chart from a suspiciously large red
> candle, or a tariff drag would wear the mark of a YAP the player did not
> fire.

- **1.1 Build the chart** ✅ **SHIPPED.** `<PriceChart>` in `src/components/terminal/`,
  mounted in `StocksOptionsTab` where the mark-only block used to be. Real OHLC
  candles, 20 × 2s buckets ≈ 40 s of tape. Pure geometry in `chartHaptics.ts`,
  copy in `chartCopy.ts`, animation keyframes in `index.css`. The mark-only block
  was **replaced, not stacked** — it printed the live mark twice (once there, once
  in the chart header), and the chart's header now carries symbol, mark and
  delta-vs-base. The strip below it keeps only what the chart does not plot: the
  sector name and `$VEX`, which is a market-wide index, not a property of the
  ticker, and so does not belong on its price axis.

  **Four defects the chart surfaced, all fixed:**

  1. **A clarification was rendered as a crash.** `stampPlayerMove` marks both
     player-caused moves, so the walk-back rally was stamped `crash: true` — drawn
     as a red down-arrow at the candle low, with a chip reading `YAP -0%` on a
     *green* candle, and an accessible name saying "most recent 1% down". Renamed
     the field to a neutral `playerMove`, and split verb/sign/colour/anchor by
     direction. Copy now reads `CLARIFY +2%`.
  2. **Direction could not be derived from the candle body at all.** The
     clarification window is 8 s and a bucket is 2 s, so a YAP and its walk-back
     routinely share one bucket — and that bucket still closes *below* the
     pre-crash open, because it measures from its own open. Reading `c` vs `o`
     therefore reported the player's successful squeeze as `YAP -65%`. The
     stamping engine is the only party that knows which side of the print its own
     move landed on, so it records `playerMoveDirection` and the renderer reads it.
  3. **The base price crushed the chart to a 4-pixel sliver.** Forcing
     `basePrice` into the domain unconditionally is right for a stock that drifted
     5% and catastrophic for one that drifted 100,000x — which is what the live
     data showed (GIGA at $23M against a $180 base). The candles became
     unreadable at exactly the magnitude the game's first phase reaches. The base
     is now kept only while it costs the plot less than `BASE_SPAN_BUDGET` of its
     own span, and when dropped the rule is omitted rather than clamped to an edge
     — drawing it would put a line across the frame implying a price the plot
     excludes. The header and hover copy say so explicitly.
  4. **A dead-flat tape pinned itself to the bottom edge.** The `1e-9` absolute
     range floor is an order of magnitude larger than the padding computed from
     it, so on a flat tape the padding came out ~6e-11, the domain collapsed to a
     point, and every candle rendered at the frame's bottom instead of centred.
     Floored relatively to the price instead, so it is equally invisible on a $2
     stock and a $2B one. An absolute "is the base near the data" test was tried
     first and rejected: with a $180 base against a $19M tape, "within 3× the
     range" is satisfied by a figure 100,000× smaller than the data.

  Also fixed: axis labels clipped out of their 46-unit gutter at 7 digits
  (`$1982822` → `$1.98M` above $1M; exact figures stay in the header and hover
  copy, so the abbreviation is never the only source).

## Phase 1.2 — the perk constellation, and four bugs it surfaced

`unlockedPerks` was a `Record<string, boolean>` and `unlockPerk` was **called from
no component**. The most expensive channel in the game had a prestige button and
~640px of nothing. All six GDD §5 perks now do what their names say, and the
`$1M → $10B` stretch where the channel is open but the gate is shut has a readout
on it.

**Shipped.** `constants/perks.ts` (costs + every effect constant) ·
`engine/systems/perkEngine.ts` (the six rules, pure) · `store/slices/perkSlice.ts`
(the one perk with a clock) · `PerkConstellation` + `PrestigeProgressCard` ·
`prestigeProjection.ts` (headless, so the card and its hover cannot disagree).

| Perk | Cost | What it does |
|---|---|---|
| Shell Company Inception | 1 | ×2 base tap, compounding with the Tungsten Nib |
| 280-Character Macro Wreck | 2 | 4%/slam Flash Dip: ×6 options valuation for 8s |
| QE As A Service | 3 | Spend to **−$50B** |
| Insider Exemption 401(k) | 5 | 1.5% of the open book's **peak** every 60s |
| The Pardon Assembly Line | 8 | −65% liquidation prices, raids abolished |
| Golden Parachute Super-PAC | 13 | 15% of passive income survives the filing |

### Three rulings, taken rather than guessed

- **Perk 1 is half of what GDD says.** `executeFlightToCaymans` has *always*
  granted `$1M × SIS^1.2` seed cash, and the Caymans hover copy promises it. It
  is the floor that stops a returning player starting soft-locked, so the
  purchasable half is the **+100% tap**. GDD §5 now records the split rather
  than quietly disagreeing with the store.
- **Perk 4's auto-order-placement half is not implemented, and is labelled
  roadmap.** `calculateOptionReturn` is linear in the signed move, so a long
  straddle is *structurally* unprofitable — every state where only one leg pays
  needs a move bigger than 1/leverage and the flat side pays nothing. Shipping it
  would charge a player permanent currency for a guaranteed loss. The **yield**
  clause, which is the half with a number in it, is implemented literally: 1.5%
  of the open book's peak value every 60s, paid only for holding leveraged risk.
- **The projection leads with the shortfall**, then states the curve honestly:
  the exponent is 0.32, so doubling lifetime earnings multiplies the cash term
  by **1.25**, not 2. `nextSlipCash` names the next whole Slip's actual price
  and `lifetimeCashForSlips` inverts the real constants rather than restating the
  formula in a component.

### Four defects the build surfaced, all fixed

1. **The stamp's `+X / tap` tag was understated by 100%.** `ClickerButton` called
   `calculateClickValue` and `clickDesk` then applied the Tungsten Nib's
   doubling *at the call site* — so the hero number in the game was wrong for
   anyone who owned the cheapest upgrade in the shop. It is the
   `calculateInkRefillTotal` bug again: two code paths, one number, no gate.
   `engine/systems/clickPayout.ts` is now the single source, and the Shell
   Company multiplier lands in the same product. Verified live at four
   multiplier states — printed tag and charged cash agree exactly.
2. **A tax on a negative balance is a rebate.** The ink refill carried `2% ×
   treasury`, and QE As A Service makes −$50B reachable on purpose, so `2% ×
   −$50B` made the next refill **negative** — a player at exactly −$50B bought a
   $25 refill and was paid $999,999,966. Found by driving the live store, not by
   reading the code. `calculateInkRefillTotal` now clamps the taxable base at 0.
3. **A raid was a money printer for the perk that enables it.**
   `Math.max(10, cash - fine)` — the anti-soft-lock floor — also *lifted* a
   negative treasury to $10. Spend to −$50B, get raided, wake up at $10. The
   floor now applies only to a player who had at least $10 to lose; the
   Red Phone's own `< $10` gate and the click floor are what actually prevent a
   soft-lock, and the docstring that credited this line with the job was wrong.
4. **The loan repaid 63% of itself and the tooltip said 100%.** The debt floor
   was proportional to the deficit, so it paid a shrinking amount into a
   shrinking balance — measured at 63% repaid after a full window, because
   compounding never quite arrives. It is now `min(deficit, $50B/1200)`: a
   constant rate that is *exactly* self-liquidating in 1200 slams, landing on
   zero and never a surplus, and unchanged by a dry or jammed nib.

### Five defects the QA and review round found, all fixed

The first pass shipped three bugs; this one found five more, four of them in the
new code and all of them in the same family: **a rule that was self-limiting by
accident rather than by construction.**

1. **The Red Phone bailout was an unlimited faucet** — the worst of them.
   `triggerRedPhoneBailout` has **no cooldown and never had one**. The only thing
   stopping a spam was that its $25,000 payout lifted the treasury back over the
   `$10` broke threshold, which re-armed the gate on the next frame. QE As A
   Service removes the lift entirely, so a player at −$50B is below that threshold
   *permanently*. Measured: **200 bailouts in 200 clicks, $5,000,000 gained**, and
   the counter never stopped. The tooltip had been calling it "the bankruptcy
   floor, not a faucet" the whole time.
2. **The Gold Box emergency sale was the same bug at a third the size.** Its
   cooldown is waived below $50 for the same reason and the same reason failed:
   **300 sales in 300 clicks, $150,000.** Its `isBroke` face was also a local
   `treasuryCash < 50`, so the label would have shown "restocking waived" on a
   button that was refusing.
   Both are fixed by one shared predicate, `isBrokeNotInDebt` — a rescue is for a
   player who is **low**, never one who is **in debt**, because a debt is repaid
   by the click floor and does not need rescuing. Verified: both fire **0/200** in
   debt and still fire exactly **once** for a genuinely broke player.
3. **The 401(k) paid a peak belonging to a settled position.** The peak is state
   that *outlives* the positions that produced it, so an emptied book still
   carried a claim: **$1,500 paid for a book that no longer existed.** The first
   version of the engine read "an empty book peaks at zero" — true of a book that
   was always empty, false of one that emptied. The probe that "proved" the
   invariant started the peak at 0 and could not reach the case; **a test that
   cannot fail is not a test**, and the new one constructs the stale peak directly.
4. **Reloading the page paid an instant 401(k) match, repeatably.**
   `lastAutoMatchTimestamp` is deliberately not persisted (it is run state), so a
   save rehydrated it as `0` — and `now − 0` is about 56 years, so the first tick
   after every reload found the window long overdue. A clock that starts at zero
   now opens its window **now**. The fix was initially only half-placed: the
   engine returned the new timestamp and `perkSlice` committed only
   `peakBookValue`, so the clock never armed and every reload re-armed it for
   free. Caught only by re-measuring in the browser after the engine looked fixed.
5. **The projection overstated its own reward.** `nextSlipGain` was a difference
   of whole *rungs*, as though the SIS formula added integers. It floors a **sum
   of two fractional terms**, so the real gain is a difference of two *floors* —
   at $10¹⁰ the card read "worth **2** more Slips" when filing there pays exactly
   **1**. Swept across 28 cash/profit combinations, it disagreed at most of them
   and always in the player's disfavour. Both sides now come from
   `calculatePrestigeSIS` itself, and the probe asserts the equality directly.

### Two honest behaviours worth knowing

- **The Flash Dip accelerates losses.** It multiplies the *signed* return, like
  the VEX vega multiplier, so a CALL held through one is marked down 6× as fast
  as a PUT pays. Every surface that prices options now takes the multiplier as
  an argument and says so out loud — the plan records the VEX tooltip that failed
  to as the most expensive line ever shipped here.
- **A spent Slip is not a click multiplier.** The balance card's
  `+N% Click Yield Multiplier` sat directly under a balance the player can now
  spend down, so six Slips and five perks bought read `+60%` on a balance worth
  one. Only unspent Slips yield, and the line beneath says what the spent ones
  became.

**Verified:** `npm run build` clean · `oxlint` clean · no file over 400 lines ·
**73 assertions** in `scripts/probe-perks.mts` green, plus a live-store pass that
bought all six perks (14 → 3 Slips, Pardon and Parachute correctly refused at
3 with nothing charged, double-buys and unknown ids refused and free), measured
the stamp at four multiplier states, drove the treasury to −$50B and confirmed
the refill rebate, the raid lift, the bailout faucet and the Gold Box faucet are
all closed, watched a settle pay $301,000 under a dip against $51,000 without,
reloaded ten times to confirm no free match, and filed twice to confirm the
parachute carries $150 of a $1,000 rate and run-state clears while lifetime
counters survive. A **pre-change save** rehydrates with its 12 Slips, its
upgrades and its phase intact, grants nothing for an unknown legacy perk key,
and leaves every new field at a safe zero.

### What this cost in structure

`deskSlice` and `tradingSlice` were both at the 400-line ceiling. Two slices
were extracted rather than prose deleted: `deskEconomySlice` (the three *spend*
verbs — `buyUpgrade`, `refillInk`, `ventTantrum`, split by direction of cash
flow) and `perkSlice` (the one perk that pays on a clock). `openOptionTrade`'s
body moved to `orderPlacement.ts`. **Invariant prose was not cut to make room** —
the plan notes that a comment-only change fails `size:check` too.

### 1.3 — the collapse that did not collapse

The comment claimed finished rows "collapse into a single struck-through summary
line", and the code rendered every finished row *and* the summary. Completed
objectives now render **zero** rows and exist only in `Certified:` (verified
live), and the nearest unfinished objective is genuinely promoted — `text-sm`
with a gold left rule and a taller bar, against `t-caption` for the rest. A
`NEXT //` prefix in the same type size is a whisper, and this panel's whole job
on the first screen is to point at the shortest path.

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

Phase 0 is done. It was cheap, it made everything after it legible, and it is what
was asked for. `npm run hover:check` now runs inside `npm run build` at budget 0,
so "no element on screen is unhoverable" is a number rather than an intention.

---

## Definition of done

- [x] No element on screen is unhoverable; every hover explains stakes, not labels
      — *43 → 0, enforced by `npm run hover:check`*
- [x] No label lies about what its control does — *`SIGN TARIFF` → `SIGN ORDER`;
      the sealed shredder no longer looks operable; the Gold Box no longer claims
      to pay on a rejected sale; the prestige label no longer hides that locked
      collateral counts*
- [ ] Every panel earns its pixels — no surface is empty while an adjacent one scrolls
      — *the Caymans channel went from ~640px of dead space to a full pane that
      overflows by 94px; every other measured dead region is still open*
- [x] A YAP visibly crashes a chart, in the same millisecond, on the same screen
      — *`PriceChart` ships a real OHLC candlestick tape; the impact marker and
      flash are stamped by the engines that cause the move, and both directions
      (YAP crash, walk-back clarification) render correctly*
- [ ] The 20-second frenzy countdown is unmissable
- [ ] The certificate is one click from anywhere in the game
- [ ] Zero doc ↔ code drift, enforced by a build gate
- [x] `npm run build` clean · `oxlint` clean · no file over 400 lines

---

## The price model — FIXED, and it was four bugs, not one

This began as "stock prices scale too much" and turned out to be the most
consequential defect in the codebase. It is recorded here in full because the
*shape* of the failure is the lesson: each fix was individually reasonable, and
three of them made the game worse before the fourth fixed it.

### The symptom

At the shipped 10Hz cadence, one idle hour took a $32 stock to $139M. Measured
across all nine tickers: `DOOR` at **140,037x** its base, `PAIN` at **645,860x**,
in a single session.

### Bug 1 — the random walk was not centred

`noise = (rand() - 0.49) * 0.01 * vol`. `Math.random()` has mean 0.5, so this left
a mean of **+0.01** on a ±0.01 multiplier: a permanent +0.01% drift *every tick*,
~56x/hour. `$PAIN` had the same bug at `0.495`. Both are now `0.5`.

### Bug 2 — the relief rally paid out for doing nothing

`tariffPressureFor` granted `+0.0002`/tick to any linked nation below 50%. At
game start *every* nation is below 50% (P0-2 set all six dials to zero), so it was
unconditional: +0.2%/sec, ~1,378x/hour, for taking no action at all. Making it
proportional to "distance below 50%" did **not** fix it, because a 0% tariff is
the *starting* state — so the bonus was maximal precisely when the player had
done nothing.

The fix is conceptual rather than a smaller number: **50% is the neutral trade
relationship.** Below it a linked stock's fair value recovers; above it, fair
value is dragged down. Every term is a signed deviation from neutral, so the
resting level is always the issue price and *no dial setting can manufacture
permanent growth*. Relief is deliberately the weaker force — otherwise the
optimal play is to zero every dial and walk away, which is what the old term was.

### Bug 3 — I rebuilt the original bug inside the fix

Removing the bias was necessary but insufficient: a multiplicative walk with no
drift still compounds *variance*, so a stock still reached 5.3x base in an idle
hour. Adding mean reversion fixed that, and then the first attempt at a fair-value
anchor was `fair * (1 + pressure)` — a one-way integrator, which is Bug 2 again.
A 10-hour soak reached **52,000x** on `$PAIN`.

### Bug 4 — the anchor, and the one that mattered

`meanReversion` pulls price toward `fairValue`, so **`fairValue` is the expected
future price**, and every question about whether an option pays reduces to where
it sits. The first anchor ignored player shocks ("a shock should decay, not be
absorbed") — which is exactly backwards:

> if the anchor stays at the pre-crash price, then `E[P(60s)]` is the pre-crash
> price, so a 0DTE PUT struck above it pays **nothing**, however violent the YAP
> was.

Measured, a 50% crash retained **1%** of itself after 30 seconds. The player's
1000x position, and the entire causal loop, quietly did not work — with nothing
on screen to explain why. The next anchor was a full EMA, which follows the price
completely and therefore chases whatever reversion is pulling toward; the lagged
feedback rang and every ticker diverged to the floor over 100 hours.

The working shape does both, in opposite directions, which is what a market's
resting estimate actually does:

- **absorbs** a print (so a crash is immediately the new price), and
- **relaxes** toward the issue price (so nothing compounds, ever).

`fairValue: fair + (price - fair) * 0.02 + (base - fair) * 0.02`

Note the two rates are now **equal**. The `0.0005` above was the *bug* this
paragraph is describing — a 40:1 absorb-to-relax ratio, documented two lines
earlier in this same file as the failure. Quoting it here as the shipped code
was the same class of error the repo treats as a defect: a knowledge base
repeating a number the simulation does not use.

The correct equilibrium for that update is `F = (AB·P + RL·base) / (AB + RL)` —
both terms positive, rates **added**. An earlier draft of the code comment wrote
`(AB·P − RL·base) / (AB − RL)`, which has the wrong sign, the wrong operator, and
evaluates to its own `0/0` at the equal rates that ship. Correct, it shows fair
value is a convex combination of price and base, hence trapped in their hull and
incapable of running away — which is the actual reason the model is bounded.

Reversion is additionally **graded by how long the current price has held**
(`SHOCK_GRADING_TICKS = 6000`, ten times the 60s option window): a level the
market has occupied for minutes is an equilibrium and snaps back hard; a level
reached one tick ago is a shock and is left alone. The two constants are not
independent — a grid search over both found only a narrow band where the game
works, and the window must be far longer than `TRADE_DURATION_MS` or reversion
reaches full strength exactly when the option settles.

**This window was documented but not implemented, and the gap was load-bearing.**
The age was read by scanning the candle array for a `playerMove` scar, and
`CANDLE_HISTORY_LENGTH` caps that buffer at 20 × 2s = **40 seconds** — shorter
than both the grading window and the 60-second option. So the ramp topped out at
0.067 and then took a **15x step** to full strength the instant the scar was
evicted, forty seconds into a sixty-second option, and the realised window was
0.67x the option rather than the documented 10x. Worse, its *length* was set by a
constant whose stated job is "how many buckets the chart keeps": retuning the
chart to 40 buckets would have silently doubled the restore force on the game's
core mechanic, and nothing in the chart code said so.

The fix is `StockDefinition.lastPlayerMoveAt` — engine state, stamped by
`stampPlayerMove` from the same `now` that wrote the candle, persisted, and
entirely independent of anything the renderer wants to draw. The relationship is
now stated rather than assumed: if `CANDLE_HISTORY_LENGTH` or
`CANDLE_INTERVAL_MS` is ever retuned past 6000 ticks, the two stop being
independent and that coupling is silent.

Measured after the fix, and it is not a wash — the real window pays *better*,
because reversion is now genuinely weak during the whole settlement:

| grading window | 50% YAP returns at t+60s |
|---|---|
| 400 ticks (the broken 40s) | −35.3% |
| 6000 ticks (the real 600s) | **−48.4%** |

with the 1h band 0.58x..1.58x, a 10h soak peaking at 1.37x, a legacy $17,148
`$PAIN` back to 1.06x in 30 minutes, and no non-finite price in 2,700 runs.

### Verified

| requirement | before | after |
|---|---|---|
| 0DTE pays on a 50% YAP | 1% retained at 30s | **100%** of runs at t+60s |
| 1-hour price band | 56x … 18,000,000x | **0.2x … 3.4x** |
| 10-hour soak | 52,000x on `$PAIN` | **max 7.3x**, mean 1.26x |
| 100-hour soak | diverged to the floor | mean 1.26x, all tickers reverting |
| 0% dials vs 500% | 0% was strictly better | 500% is strictly better |

Confirmed live: a YAP took `$DOOR` from **$155.03 to $61.64** (-60%), fair value
followed to $137.30, and the price was still **-55.8% at t+45s** — so a 0DTE
struck before the YAP settles well in profit. The chart read
`1 impact, most recent a YAP 60% down`.

**The chart's `BASE_SPAN_BUDGET` work is still correct and still needed** — it is
what let the chart stay honest while this was broken, and it is what keeps a
legitimately volatile ticker legible.

### Three bugs the LIVE game found, which no simulation had

Each of these passed every offline check and was caught only by watching the
real thing run. All three are the same shape as the four above: a term that pays
out for *existing* rather than for a player action.

1. **The shock grade was measured off the wrong clock.** Reversion strength is
   graded by how long the current price level has held, and the cheap signal for
   that is the newest candle's `t` — which is the OPEN stamp of a **2-second
   bucket**, and so advances every two seconds forever. The age could never
   exceed 20, the grade never rose above 0.3%, and reversion ran at a
   three-hundredth of its strength: silently off. Now measured from the newest
   `playerMove` scar, which is the only event that should hold reversion off.

2. **Absorption was 40× relaxation, so "returns to base" was not a property.**
   At equilibrium `(P − F)·ABSORB = (base − F)·RELAX`, so
   `F = (AB·P − RL·base)/(AB − RL)`. With `ABSORB = 0.02` and `RELAX = 0.0005`
   that is a 40:1 ratio and fair value settles at **103% of the price** — the
   anchor was pinned to the tape it exists to stabilise, and relaxation was a
   rounding error. The two rates are now **equal**, the smallest relaxation that
   actually dominates. A `$PAIN` holding a legacy $18,497 level returned to
   $5,269 against a $5,200 base.

3. **`$PAIN`'s constituent link was ADDITIVE.** The beta term was
   `(averageConstituent - 100) * 0.04` — **+$2.00 into the index every tick**,
   unconditional. Identical in kind to the relief rally: a permanent drift paid
   for existing. It was nearly invisible at a $5,200 base (0.04%/tick) and
   dominant at a legacy $18,000 one (+4.5% per 40 seconds), so the index climbed
   and reversion fought it forever. It is now a change-over-change **ratio**: an
   index moves with its basket, and pays nothing for existing.

After all seven fixes, every one of the nine tickers sits between **0.82x and
1.11x** of its base price and holds there, and all nine now draw their base rule
on the chart (before these fixes, seven of nine omitted it).

### The chart's base label, which overflowed

`BASE $220.00` was 63px of text in a 46-unit gutter and was clipped by the
cockpit's `overflow-hidden`. The word "BASE" was redundant — the label is already
gold against two phosphor edge labels, the rule it annotates is gold too, and the
header says "VS BASE" on every frame. Four characters bought no information and
cost the number's legibility. The tone carries the distinction, which is what
`AxisLabel.tone` exists for.

Removing it was necessary but not sufficient: `$5,383.17` on `$PAIN` is nine
characters and still overflowed by 4.7px. The label formatter now abbreviates on
**measured width** rather than on round-number milestones, with the character
budget taken from the browser (the `t-caption font-mono` tier advances a uniform
**5.225px**, measured in-page, so 8 characters is 41.8px against a 44px gutter).
An earlier attempt budgeted 7 against an *assumed* 5.9px/char — wrong in the safe
direction, throwing away a character the gutter could hold.

Each suffix is tried at decreasing precision and the first that fits wins, with
the sign spending its character from the same budget (`-$10.0Qi` is 8ch, not 7).
The ladder climbs to `Oc` at $1e39 so it covers the GDD's $10^42 ceiling, and
`$999,999` branches into `M` at `999_000` so it cannot round UP into the longer
`$1000.0K`. Verified by calling the real function across **61 orders of magnitude
on both signs** — 366,732 calls, zero overflows, zero malformed output. In the
live game all nine tickers now show 16.8–27.3px of clearance.

Measuring beat guessing here, and twice: the assumed character width, and the
assumed sign width, were both wrong in ways only a real measurement exposed.

---

## Phase 1.1 review round

An adversarial QA pass over the whole Phase 0 + 1.1 diff found eleven defects.
All are fixed; the two it could not confirm are recorded below.

### A copy lie the build could not catch

- **The ink-refill tooltip quoted 4× the button.** `calculateInkRefillTotal`
  returns `min(base + 0.02·treasury, base·4)`, so when the cap binds the price IS
  `base·4` — and the hint then multiplied it again, printing **$400** beside a
  button labelled **$100.00**. It binds at $3,750 of treasury, which is Phase 1.
  The multiplication is gone; the copy now says the price is pinned at the
  figure the button shows.
- **PolyGrift called a 0.1% return "A real edge".** The verdict gated on `ev > 1`
  in DOLLARS on a $1,000 wager, so the `subpoena_raid` NO side at **+$1.00** and
  the `brie_ban` YES side at **+$8.00** both claimed a real edge. Now gated on
  the return RATE, and the rate is printed beside the dollars so the adjective is
  checkable against the number.
- **`10x CASH · INK RESTORED` was still on the tantrum meter.** The ink gauge had
  been corrected to "Ink held — none consumed, none refunded"; this twin label
  kept promising a refund `inkFrenzyEngine` explicitly forbids. Now
  `${FRENZY_CLICK_MULTIPLIER}x CASH · INK HELD`.

### A hint layer that froze on the one copy that must not

- **`HintLayer` captured `data-hint` once.** `show()` early-returns when the
  pointer is already resting on an element, and nothing re-read the attribute —
  so "Restocking. 8s" sat on 8 for the full eight seconds while the button
  beside it ticked 7…0. That silently defeats the whole `aria-disabled`-over-
  `disabled` pattern, whose stated reason for existing is telling the player how
  long until the gate opens. The text is now read at render time **and** a
  `MutationObserver` on the attribute forces the re-render, because the layer
  holds no store subscription and would otherwise recompute the same stale
  string. Verified in-browser: rewriting the attribute under a resting pointer
  updates the bubble with no re-hover.
- **The `--viewport-scale` mirror was the arithmetic backwards.** Every `t-*`
  tier computes `9.5px / var(--viewport-scale)` and the root then applies
  `transform: scale(...)`; the two cancel, so cockpit type renders at its
  authored physical size at any viewport. The portalled bubble gets the division
  half only. Mirroring the scale onto `<html>` therefore made the tooltip
  ~19% **larger** than the cockpit at every viewport under 840px tall — including
  1280×720 and 1366×768, both required sizes. `<html>` is now pinned to `1`.

### The gate could be passed by an unhoverable element

`hover:check` was defeatable three ways. All are closed, and the gate is now
probed with 16 cases:

- **A handler smuggled through a component.** `<Card onClick={shred} />` passed
  with zero violations, because capitalised tags were exempt and `Card` spreads
  `...rest` onto its own `<div>` — a genuinely clickable element with no hint.
  Component tags carrying an `on*` prop are now judged, and the five call sites
  that only pass a callback down (`TabStrip`, `WatchlistLadder`,
  `RunSummaryCard`, `ResetGameModal`) declare a `hint-allow` marker naming the
  component that renders the hinted button.
- **`hint-allow` inside a string.** The `//` alternative matched anywhere on the
  line, so `className="p-2 // hint-allow"` silenced the gate. The root cause was
  worse than the finding: `blankComments` treated that `//` as a real comment and
  blanked the REST OF THE LINE, including the `onClick` — so the element stopped
  being operable and was skipped entirely. The smuggled marker hid the handler
  too. String literals are now tracked explicitly.
- **One marker silencing two elements.** The marker is bounded to the tag's own
  line range plus one line above, since a JSX comment cannot live inside a
  single-line tag.

Also: `onMouseEnter`/`onFocus`-style handlers no longer count as operable. A
hover-only or focus-only handler makes an element *react*, not *operate* —
there is nothing a keyboard or AT user can trigger — and flagging those trained
developers to sprinkle hints on decorative wrappers. Click, change, submit and
key handlers all stay in scope.

### Remaining defects

- **Two gated buttons were silent no-ops.** `ExecutiveGauges`' refill and vent
  were converted from `disabled` to `aria-disabled` and left with a bare
  `if (!can) return;` — strictly worse than `disabled`, since an `aria-disabled`
  button still takes focus and still fires on Enter. A keyboard player pressed
  "Refill $27.00" and got no toast, no announcement, nothing. Both now refuse
  out loud in a `role="status"` strip, matching every other gate converted in
  this pass.
- **`useExpiryClock` served a stale clock for 250ms of every position.** The
  `useState` initialiser runs once at mount, so after the last position settled
  the interval was cleared and `now` froze; opening another position showed
  "1200s left" for a quarter second on the countdown the hook exists to keep
  honest. Re-seeding in the effect body fixed the staleness and tripped
  `react/set-state-in-effect`; moving it into the render body tripped
  `react/purity` instead. Rewritten on `useSyncExternalStore` — the clock is a
  genuine external mutable source, which is what that hook is for. The component
  is pure again, the interval is shared and reference-counted, and a settled tab
  runs no timer.
- **Career Objectives promoted the FURTHEST goal.** `rows.find(r => !r.isDone)`
  is declaration order, and `CAREER_OBJECTIVES` is ordered by theme, not by
  distance — so a fresh save was pointed at "Cross the motorcode threshold"
  ($1.00M) while "First CAPS LOCK FRENZY" (target: 1) sat unpromoted below it.
  Now sorted by `current / target`.
- **Nine constants were re-typed in components** with "mirrors X in Y" comments
  — the exact hazard `RAID_BRIBE_COST` was promoted out to prevent. All nine now
  come from `deskPropsSlice` / `predictionSlice`, and `BRIBE_HEAT_REDUCTION` is
  derived from the per-favor rate rather than restated as `16`.
- **`GoldBoxProp` never looked gated.** `cursor-pointer` and `active:scale-95`
  were unconditional on a button that refuses a click for 8s in every 8. It now
  branches on the cooldown like its sibling prop.
- **`CertificateExporter` / `RunSummaryCard` used native `disabled`** for a
  transient `busy`, deleting the hover text that explains the export — the same
  rule, exempted for a short fuse. Both converted.
- **The telemetry footer read `BAGHOLDER PRO FEED`** on a pane hosting three
  channels. `StatusStrip`'s label is non-interactive, so it carries no hint and
  the mislabel was permanently unfixable from the UI. Now `${TABS.length} CHANNELS`.

### Not fixed — needs a ruling

- **Non-focusable explanatory surfaces are mouse-only.** Six hints sit on bare
  `<div>`s and `<span>`s: the sealed shredder card, `DirectiveSheet`, the Career
  Objective rows, the selected-ticker strip, the hotkey dock, and the BagHolder
  seal. `HintLayer`'s keyboard parity works by listening for `focusin`, which
  never fires on an element with no `tabIndex`, and `aria-label` on a role-less
  `<div>` is ignored outright. So a keyboard-only player reaches none of that
  copy — worst on the hotkey dock, which its own docstring calls "the only manual
  in the game". This is a real gap but it is a design decision, not a typo: the
  fix is a visible focus ring on decorative surfaces, or a parallel set of
  visually-hidden descriptions, and either has a legibility cost in a zero-scroll
  cockpit. Flagged for Phase 3, where the right wing is being rebuilt anyway.

### Found by the tooltip pass, still open

- **Two gates refuse silently.** `ResoluteBlotterCenter:105` (money printer) and
  `GoldBoxProp:71` return without a message. The second is the worse: its refusal
  is a *visible overlay* that is not `role="status"`, so the shortfall is shown
  to sighted players and silent to everyone else — the exact inversion the
  AGENTS.md rule exists to prevent.
- **`BreakingNewsBar:175` ships `aria-pressed={!isMuted}`** — "pressed" when
  unmuted. Defensible as "sound is on", but it reads inverted next to the shake
  and hints buttons, which use `aria-pressed={enabled}`.
- **`chartHint` lost the marker-colour glossary** when it was shortened. The two
  clauses ("a red spike under the low is a YAP, a green one over the high is a
  walk-back clarification") were true and were the most confusing pair in the
  game. The honest home for them is `describeChart`, which is the accessible
  name and has no length budget.

## Phase 1.2 — the hint layer, revisited

Three defects, all reported from play rather than from the audit, all fixed in
`HintTooltip.tsx` / `chartCopy.ts` / `settingsSlice.ts`.

### The bubble painted over the control it described

`position: fixed` plus a two-axis viewport clamp guarantees the bubble is *inside*
the window. It says nothing about what is underneath it, and for a control pinned
to an edge — the hotkey dock along the bottom, a column button against the right
wall — the only vertical slot left is the one the anchor occupies. The clamp is
what pushed the bubble there in the first place, and the `opacity` fade sold the
overlap as intentional.

Overlap is now treated as a placement *failure* and retried on the horizontal
axis, which is where the cockpit has slack: the desk is a three-column grid, so
the gutter beside a centre-stage button is routinely 300px wide. The side is only
taken when the full bubble width fits in that gutter — picking the roomier side
unconditionally and clamping afterwards produces the identical defect one axis
over. When neither gutter can hold the bubble the function returns
`branch: 'unplaceable'` and keeps the vertical slot: there is no honest answer on
a viewport narrower than the bubble plus the anchor, and the bubble is scrollable,
so the copy stays readable. The arithmetic is pure and lives in
`src/components/ui/hintPlacement.ts`, because keeping it inline put
`HintTooltip.tsx` on the 400-line hard ceiling.

### The longest hint was the first thing to be cut, not the first thing read

`chartHint` ran to ~600 characters and opened on "tape, last N seconds — not a
session", burying the live mark under two sentences of mechanism. It is now ~230
characters and opens on the mark and its drift. The four things that survive are
the four that are not visible anywhere else: the window is seconds, the base rule
may be absent, only the player's own actions spike the tape, and the last candle
can trail the header by up to one bucket. What went is duplication, not truth —
candle anatomy, the severity bound, the excursion arithmetic and the window
high/low are all drawn by the chart or carried by `describeChart`.

`MAX_WIDTH_PX` 288 → 260 and `MAX_HEIGHT_RATIO` 0.6 → 0.5. The ratio is not a
comfort setting: a bubble capped at half the viewport is what guarantees a
candidate is either fully above or fully below its anchor, which is the property
the no-overlap branch above depends on.

### A toggle, and what it deliberately does not switch off

`settingsSlice.hintsEnabled` (dock lightbulb, persisted). The decision that
matters is that it is a **comfort** setting, not an accessibility switch: with
hints off the bubble is clipped to a 1px box rather than unmounted, so
`aria-describedby` still resolves and every control still has its spoken
description. The alternative — dropping the attribute — leaves a dangling
`idref`, and `display: none` / `visibility: hidden` / `hidden` all remove the node
from the accessibility tree, which would silently undo the decision.

The four `hint(text, name)` families — `ClickerButton`, `WatchlistLadder`,
`ResetGameModal` and the dock's icon buttons — keep their names. With the bubble
off, those names are all a screen-reader user has, and a gated control with no
name explains nothing at all.

---

## Adversarial review round (follow-up to the chart/price-model commit)

An independent review agent was pointed at commit `552514a` with instructions to
find defects and prove them, and to report nothing rather than invent. It ran 30
fixtures against a patched copy of the gate and derived the fair-value fixed
point independently. Findings are recorded here whether or not they were fixed,
because a finding that was checked and dismissed is still information.

### Fixed

| # | finding | severity | resolution |
|---|---|---|---|
| 1 | `SHOCK_GRADING_TICKS` was not the grading window. The scar was read from the candle array, capped at 40s, so the ramp topped out at 0.067 and took a 15x step at t+40s of a 60s option. | MAJOR | `lastPlayerMoveAt` engine state. Documented above. |
| 2 | The fair-value equilibrium was written `(AB·P − RL·base)/(AB − RL)` — wrong sign, wrong operator, and `0/0` at the rates that ship. | MAJOR | Corrected to `(AB·P + RL·base)/(AB + RL)`, with the failed form recorded so nobody re-derives it. |
| 3 | The hint layer's re-render trigger was `setPlaced(p => p ? {...p} : p)`, a no-op when `placed` is null — which is the *only* state it is ever in with bubbles off, freezing the one description a screen-reader user still has. | MAJOR | Replaced with an unconditional `setTextTick(n => n+1)` counter, and verified in-browser that the suppressed node's text still tracks the attribute. |
| 4 | `hover:check` passable four ways: a `hint()` nested in a handler body, `data-hint=` smuggled inside a `className` or `aria-label`, a `.jsx` file unscanned, and a hyphenated custom element skipped. Plus a trailing bare attribute (`contentEditable` with nothing after it) read as inert. | MAJOR | Rewrote the tag reader as a real attribute parser (`scripts/lib/jsx-attrs.mjs`) and matched on attribute NAME rather than on characters. 29 probes, 0 failures. |
| 5 | `axisPriceLabel` had a second decimal loop byte-identical to a strict subset of the first — it fired **0 times in 13,396 labels** — and its comment described a "bigger unit" escalation the code did not perform. | MINOR | Deleted. The sci-notation escape it guarded is genuinely live (`-$1.0E5`). |
| 6 | `describeChart` — the `<svg>`'s `aria-label`, the one string a screen reader hears — spelled "two-second buckets" in words, desynchronising silently if `CANDLE_INTERVAL_MS` were retuned, and emitting "1 two-second buckets". | MINOR | Interpolates `BUCKET_SECONDS` like every other duration. |
| 7 | `types/market.ts` cited `FAIR_VALUE_PULL`, a symbol that exists nowhere (renamed to `FAIR_VALUE_ABSORB`/`FAIR_VALUE_RELAX`), sending a reader to a symbol that isn't there. | MINOR | Cites both real constants. |
| 8 | `UI_DESIGN_SPECIFICATION.md` carried the "DOES NOT EXIST" audit paragraph **twice, character for character**, on a chart that now ships. | MINOR | Replaced once with the shipped description. |
| 9 | This file quoted `* 0.0005` as the shipped relax rate, in the same paragraph that explains `0.0005` was the bug. | MINOR | Corrected to `0.02` with the distinction stated. |
| 10–12 | Prose describing the *unclamped* world immediately above the clamp; a stale `1e-9` span floor that is now relative; `TICK_MS = 100` duplicated as a literal in `useGameLoop`. | MINOR | 10 and 11 fixed. 12 left: the duplicate is honestly documented as a manual coupling, and a shared constant would trade a comment for an import without removing the coupling. |
| 13 | A JSDoc `/** hint-allow */` exempted an element. | MINOR | Rejected by a `(?!\*)` guard. Every real marker in the tree is a JSX block or `//` comment, so this cost nothing. |

### Checked, and left alone

- **`BASE_SPAN_BUDGET` fires at 5%, not just at absurd levels.** A base 5% off a
  calm tape loses the dashed rule and its gold BASE label while the header still
  prints the drift in dollars. This is *disclosed*, not hidden: the hover copy says
  "off-window, so no rule is drawn", and the constant's own docstring states the
  rule it implements. The constant exists to stop a 100,000x base from flattening
  the candles. Loosening it is a design call, not a bug fix, so it is recorded
  here rather than made silently.
- **Fair value settles at the MIDPOINT `(price + base)/2`, not at base.** The
  review flagged the code comment as claiming otherwise. Re-derived in both
  directions: holding price pinned leaves the anchor stranded at 2.15x base, but
  the live coupled system converges to 0.95x base within 30 minutes, because mean
  reversion drags the *price* down and absorption drags fair value after it. The
  guarantee is real and **coupled, not local**; the comment now says exactly that.
- **No BLOCKER.** The 0DTE pays, the gates pass, `fairValue` persists and degrades
  safely from a pre-field save, and `axisPriceLabel` is over budget 0 times across
  520 swept values (max 8 characters, verified against the real function rather
  than a reimplementation of it).

---

# PART 4 - The Chekhov audit: nothing on screen is a throwaway

**Status: NOT STARTED. This is a phase, not a fix. It is scoped here so the audit
has a definition of done rather than a vibe.**

## The complaint, stated precisely

Satire is allowed to be loud. It is not allowed to be *decorative*. The
distinction that matters:

- **Atmosphere** is text that could be deleted with no mechanical consequence and
  no lost meaning. "THE DEEPLY TERMINAL ANNEX" in the top bar is a setting, a
  joke, and a bit of lettering. It is not a Chekhov's gun.
- **Chekhov's gun** is text that either *is* a mechanic, or *promises* a
  mechanic, or *is* load-bearing worldbuilding that recurs. Every string on
  screen must be in one of those three classes. A fourth class exists today -
  **filler** - and it is invisible in code review because each individual string
  reads as harmless.

The failure mode this phase exists to stop: a player who has played two hours
cannot answer "what was that for?" about a third of what they have read. Every
unanswered string is a small tax on the feeling that the world is real, and the
whole premise of the game is a world that is real except that it is funny.

## What the audit is NOT

It is **not** "delete all flavour". Volume 4 of this document argued the
opposite: the game has a tone problem, not a surplus-text problem. It is also
**not** "make every number matter" in the sense of wiring all of them into the
economy. Some things should stay pure atmosphere, and the point of putting them
in writing is so the decision is deliberate instead of accidental.

## The rule to test each string against

> If a player deleted this string, would they lose **a mechanic, a promise, or
> the world's coherence**? If not, it is either *cut* or *made load-bearing*.
> There is no third option of leaving it as filler.

## Seed findings, from the examples raised

These are the confirmed instances. They are seeds, not the list — the audit has
not been run.

| # | string | class today | what it should be |
|---|---|---|---|
| 1 | `THE DEEPLY TERMINAL ANNEX` (top bar, `setting.ts:20`) | **filler.** A location name used in a header, and nowhere else in the fiction | Either a real place with rooms the player visits, or cut. It currently reads as a setting because it is set in a typeface, which is the weakest possible form of "setting" |
| 2 | `viralQuotesCount` (`yapEngine.ts:162`) | **the worst instance.** `Math.floor(Math.random() * 45000 + 5000)`, printed as "N viral quotes" on the DirectiveSheet, read by **nothing** | Delete, or make it mean something. It is a number with a unit and no referent, printed to two significant figures of precision |
| 3 | `impactMultiplier` (`yapEngine.ts:164`) | **filler with a real number.** `1.0 + tariffRate / 100` — so a 500% tariff prints "Impact ×6.00", a figure large enough to read as a damage multiplier | Either it multiplies something, or it stops being formatted to two decimals. `DirectiveSheet.tsx:45` already admits it "is never fed back into the crash" |
| 4 | `Tariff N%` (DirectiveSheet footer) | **ambiguous by collision.** A tariff *rate* (an input, in dials) and a tariff *percentage* (an output, a consequence) are the same string | This is a Chekhov violation of the subtlest kind: both referents are real, so nothing looks wrong, and the player has to guess which one they are reading |
| 5 | `timestamp: "...s ago"` (`yapEngine.ts:151`) | **filler.** A random 2–46s, and the post is a permanent record | Either it is the real age of the post or it is cut |
| 6 | `BIZARRE_GRIEVANCES` / `PUNITIVE_DECREES` / `UNHINGED_OUTROS` / `DEVICE_OUTROS` / typo injection / bot archetypes (`yapEngine.ts:133-146`) | **mixed, and unexamined.** These are five independent random draws composing one sentence, so **any four of them can be combined into a sentence that was never authored** | Each fragment must make sense *in combination with any other*, or the pools must be combinatorially constrained. This is the highest-volume Chekhov surface in the game and the one most likely to produce accidental nonsense |
| 7 | `preferredStock \|\| stockSymbols[random]` (`yapEngine.ts:126`) | **mechanic, but silently random** | A YAP that nukes a random sector is a mechanic; a YAP that nukes a sector for no reason is a shrug. This one is a *design* question, not a copy question |

Item 6 deserves emphasis because it is a class of bug no amount of reading the
UI will catch. The sentence is assembled from independent uniform draws, so the
combinatorial space is the product of all pool sizes, and it is enormous. A
reader sees one sentence at a time and cannot audit a space of that size by
sampling. The audit needs either a generator constraint or an exhaustive
combination check, and I have not established which is feasible.

## Method

1. **Enumerate the population, mechanically.** Grep every string literal that
   reaches a rendered surface, plus every `Math.random()` in the game loop
   (there are 20 call sites; `predictionSlice.ts:80` documents itself as the only
   *remaining* one that resolves game state, which is a useful prior).
2. **Classify each** into mechanic / promise / worldbuilding / filler.
3. **For every filler, choose** cut, or make load-bearing, or keep-and-document
   as atmosphere. Record the choice. A deliberate atmosphere string is fine; an
   accidental one is the defect.
4. **For item 6 specifically**, decide between a constrained generator and an
   exhaustive check, then implement whichever is cheaper.
5. **Gate it.** The existing gates cover hover coverage, theme, and file size —
   none of which can see a throwaway string. A new gate is the only way this does
   not regress: something that flags a numeric literal rendered with a unit and
   no consumer.

## Definition of done

- [ ] Every player-facing string is classified, and the classification is in this
      file rather than in a reviewer's head
- [ ] `viralQuotesCount` and `impactMultiplier` either drive something or are cut
- [ ] The YAP sentence pools are either combinatorially constrained or exhaustively
      checked
- [ ] `THE DEEPLY TERMINAL ANNEX` is a place, or it is not there
- [ ] A build gate fails on a unit-bearing number with no consumer
- [ ] Two hours of play, six strings sampled at random, all answerable to
      "what was that for?"

## Open question for the player

Items 1 and 7 are design decisions, not defects, and I would rather not guess:

- **The customs desk as a place.** Phase 1.2 has the right wing largely empty
  (~40% of centre stage and ~55% of the right wing were measured as dead space in
  Part 2). Making `THE DEEPLY TERMINAL ANNEX` a real location with rooms to visit
  would give the string a referent *and* fill dead space with the same work. It
  is also the largest single content build in the remaining plan.
- **Random YAP targets.** A YAP that hits a random sector is a mechanic with a
  shrug attached. It could instead prefer a sector the player has a position in,
  which makes the same randomness feel causal — but that changes the loop.
