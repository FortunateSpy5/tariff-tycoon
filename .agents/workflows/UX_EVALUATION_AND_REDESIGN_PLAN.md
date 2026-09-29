# UX Evaluation & Redesign Plan — 3:00 AM Terminal Panic

**Target:** *EXECUTIVE DEGEN: SHORT THE WORLD* (*The Art of the 3:00 AM Tariff*)
**Status:** 🟢 **P0s SHIPPED** · 🟢 **Phase 0 SHIPPED** · Phases 1–4 proposed
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
- [ ] A YAP visibly crashes a chart, in the same millisecond, on the same screen
- [ ] The 20-second frenzy countdown is unmissable
- [ ] The certificate is one click from anywhere in the game
- [ ] Zero doc ↔ code drift, enforced by a build gate
- [x] `npm run build` clean · `oxlint` clean · no file over 400 lines
