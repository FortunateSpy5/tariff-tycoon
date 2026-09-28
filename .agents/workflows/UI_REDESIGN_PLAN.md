# UI/UX Redesign — Completion Plan

**Status:** Phase 0 ✅ · Phase A ✅ · Phase B ✅ · Phase C next
**Direction:** [Newsprint & Classified Documents] — aged paper, redaction bars, wax seals, phosphor terminals
**Last updated:** 2026-09-29

---

## Context

The original build had a strong pitch and a hidden premise. The causal loop —
*open a PUT → fire a 3:00 AM YAP → sector craters → settle the profit* — is the
game's actual subject, and it was gated behind $10,000 (≈2,000 clicks of a blue
circle). The right cockpit wing was ~33% of the screen and rendered a suitcase
icon for a new player's entire first session. There was no onboarding, no type
system, and no shareable artifact.

Phase 0 and the redesign landed:
- Market + YAP unlock on the **first slam**, not $10k
- **Paper trades**: first 3 contracts risk-free (losses refunded)
- **5-step tutorial** wired to real game events
- **SituationRoom** fills the dead right pane (tutorial + objectives + certificate)
- **9:16 decree certificate** (PNG) + **prestige run summary**
- Newsprint/classified/phosphor tokens + `<Card>` primitive + `t-*` type scale
- The stamp now bleeds (ink splatter, one-shot slam animation)

---

## Phase 0 — QA & Type System ✅ COMPLETE

### Bugs found and fixed

| # | Bug | Fix |
|---|-----|-----|
| 🔴 | **Crony Favor rendered as a float** (`🤝 82.34520000000012`) — the 0.05/s passive trickle was added directly | Floor-accumulate in `tickDesk` with a new `cronyFavorRemainder` field (0≤r<1). Rate stays exactly 0.05/s, no favor lost. Floored at render sites as a migrated-save defense. |
| 🟠 | **Tutorial nag** — the final step was manual-only and `advanceTutorial` was wired to nothing else, pinning the directive card above objectives forever | Auto-complete to `TUTORIAL_CHAIN.length` at `nextPhase >= 2`, in all three cash-gain paths (incl. `creditOfflineEarnings`, since offline income can cross the threshold) |
| 🟠 | **Paper trades could be griefed** — contracts auto-settle on 60s expiry in `tickMarket`, and that path skipped the paper refund. Opening 3 and letting them lapse forfeited the refund *and* the allowance | Expiry now refunds losing paper collateral and restores the allowance, capped at `PAPER_TRADE_ALLOWANCE` so it can't be farmed |
| 🟡 | Prestige reachability | **Verified OK** — Phase 2 → liquidation → upgrade → tariff change |
| 🟡 | `oxlint` Fast Refresh warnings in `RunSummaryCard.tsx` | Split pure helpers into `src/components/share/runSummary.ts` |

### Type system — complete
- 112 replacements across 20 files: `text-[8px]`/`[9px]` → `t-caption`, `text-[10px]` → `t-micro`
- The `[class*="text-[Npx]"]` substring hack in `index.css` is **removed**; an invariant comment now explains that arbitrary values no longer self-rescue
- `text-[11px]`/`text-xs` deliberately untouched (never part of the hack)
- Only `DebugPanel.tsx` retains arbitrary values — DEV-only, tree-shaken from prod

**Verification:** `tsc` clean · `oxlint` clean · `npm run build` clean

---

## Phase A — Layout & component consolidation ✅ COMPLETE

### A1. Collapse the competing center overlays ✅ DONE
Was: up to 4 `absolute inset-0` overlays racing for the same z-index.
**Now:** `<FeedbackLayer>` renders exactly ONE message by explicit priority
(`raid > walkBack > yap > print > crisis`). Priority logic lives in
`feedbackPriority.ts` (pure, exported for testing). Zero `absolute inset-0`
overlays remain in `ResoluteBlotterCenter.tsx`.

**Verified:** live screenshot shows a single dismissible status row.

### A2. Roll `<Card>` into the panes and terminal tabs ✅ DONE
Added `src/components/ui/PaneShell.tsx` exporting `PaneShell`, `TabStrip`, and
`StatusStrip`. The three cockpit panes were each hand-writing the same
`h-full rounded-xl border shadow-2xl` frame and their own near-identical tab
strip; they now share one frame, with the active-tab accent passed as a prop
(`phosphor` for the left terminal, `gold` for the right deck) rather than by
forking the markup.

Also converted: the stocks ladder + order slip, the S.L.O.P. heat gauge + VEX
row, the bilateral tariff nation rows, and the Cayman SIS balance panel.
`Card` gained a `flush` density (p-0) for full-bleed surfaces like the ladder
that manage their own inner padding.

**Deliberately NOT converted:** small chips and badges (e.g. the agency stat
pills, lock buttons). Those are inline elements, not panel surfaces, and
routing them through `<Card>` would add DOM weight for no visual gain.

**Verified:** tsc / oxlint / build clean; full cockpit screenshot shows a
consistent frame across all three wings.

### A3. Rewrite `HotkeyFooterHUD` ✅ DONE
Was: ~20 text nodes in 36px with `overflow-x-hidden`, silently truncating keys.
**Now:** 32px, single scrollable row, icon-only controls with `aria-pressed`,
strapline removed, agent actions (SPACE/R/Z/M/F) always visible so the dock is
useful at 0 unlocks. `[V] Vent` surfaces only when actually actionable.
**INVARIANT:** never set `overflow-hidden` on the key list — it must scroll.

### A4. Ink/Tantrum gauges + Vent Tantrum ✅ DONE
**Now:** `<ExecutiveGauges>` stacks them full-width as a matched pair, each with
a real action. New mechanic: `[V]` burns the entire tantrum meter for VEX relief
clamped to `VEX_BASELINE` (`ventTantrum` in `deskSlice`).
**INVARIANT [Venting Must Never Be Optimal]:** it consumes the whole meter
including overflow past 100% that a frenzy takes for free, so riding to 100% for
the 10x FRENZY always beats it. Blocked during frenzy AND the cooling-off
protocol. Verified all five edge cases (too low / healthy / frenzy / cooldown /
VEX floor).

**Deleted:** `InkMeter.tsx`, `TantrumMeter.tsx` (superseded).

### Copy fixes found during A ✅ DONE
The desk lock and terminal shutter both still advertised "unlocks at $10,000"
after that gate was removed, and `useGameStore` still granted market access on
cash alone during offline credit. All corrected.

---

## Phase B — Theme completion ✅ COMPLETE

### B1. `TelemetryConsolePane` → `surface-terminal` ✅ DONE
The left wing now renders as a phosphor CRT (green-on-black, scanlines). The two
wings read as different MATERIALS rather than two dark rectangles, and the
status strip was recoloured to match.

### B2. `BreakingNewsBar` → newsprint ✅ DONE
The 48px top rail is now aged newsprint with a double rule, so the app reads as
paperwork from the first pixel. The marquee keeps a dark inset well — light
scrolling text on a light bar would be unreadable. Brand, phase badge, treasury
and controls all moved onto the newsprint palette.

### B3. Terminal materials across the 4 dump tabs ✅ DONE
Added `src/components/dump/DossierHeader.tsx`: a black redaction bar with the
section name in wax red. It replaced four hand-written copies of the same
header, so this was both a theming fix and a de-duplication.
**INVARIANT:** all four right-deck tabs render through `<DossierHeader>`.

### B4. Remove ALL emoji ✅ DONE (user decision: includes the PNG)
Replaced with lucide icons (`Handshake` for Crony Favor, `ScrollText` for SIS,
`Scissors` in the agency tab) or plain text where an icon adds nothing.
Emoji cleared from: ticker, desk props, desk caption, blotter feedback, agency
tab, upgrades tab, caymans tab, S.L.O.P. radar, reset modal, and both raid
messages in `tradingSlice`.

**Canvas note:** `decreeCard.ts` cannot use lucide (no DOM in canvas), so the
wax-seal ★ is now drawn as vector geometry via a 10-point star path. A text
glyph would render as tofu on platforms without the font. The 🤝 in the PNG stat
rows became a plain number.

---

## Phase B — Theme completion ✅ COMPLETE (81 → 0, enforced)

### Why B is being redone

B was previously marked complete and that was **wrong**. Measured, only 6 of 26
player-facing files used a themed material. The theme had been applied to
**chrome** (top bar, four tab headers, left pane, two onboarding cards) while the
**content** was still default stone grey — including the centre desk, roughly 40%
of the screen and the thing the player looks at most. A screenshot looked
coherent, so the gap was invisible without counting.

Baseline measured by `scripts/check-theme-coverage.mjs`: **81 unthemed stone
surfaces across 20 files.**

Root cause: `index.css` defines four materials but nothing ever decided *which
material each region is*. So they were applied ad hoc to whatever looked wrong
in a screenshot. The fix is an explicit material assignment, not more spot fixes.

### The material assignment (the actual spec)

| Region | Material | Rationale |
|---|---|---|
| App root | `newsprint-950` (deep) | desk wood behind the paper, not screen |
| **Centre desk** | **newsprint (paper)** | the GDD already calls it a "Parchment Directive" — make that literal |
| Pane frames L/R | `classified` (near-black) | recessed into the desk |
| Cards on the desk | `newsprint` | stacked paperwork |
| Desk props | newsprint + material accent | objects resting on paper |
| Terminal contents | **keep `terminal`** | a phosphor CRT is correct there |
| Inset wells / marquee | `newsprint-950` | dark wells for text contrast on paper |

The desk becoming **actual paper** is the centrepiece of this phase. It currently
reads as `from-stone-900 via-stone-900/95 to-amber-950/20`, which is the single
largest unthemed surface in the app.

### B5. Make `Card panel` a themed material ◀ biggest single win
`Card`'s default `panel` variant is `bg-stone-900/95`, so **every** `<Card>` call
without an explicit material is unthemed. Retargeting the default fixes ~10 call
sites at once and prevents new ones from defaulting to grey.

### B6. Migrate the desk
`ResoluteBlotterCenter`, `ExecutiveGauges`, `ClickerButton`, and the three props
(`RedPhoneProp`, `GoldBoxProp`, `SubpoenaShredderProp`) to paper. This is where
the visible improvement is.

### B7. Retarget `PaneShell` + the app root
Pane frames → `classified`; `App.tsx` root → `newsprint-950`.

### B8. Migrate the remaining tab bodies + modal + footer
`ResetGameModal`, `PolyGriftTab`, and the residual `bg-stone-950` overrides the
`Card` migration renders redundant.

### B9. Remove the ad-hoc overrides
95 `bg-stone-950` call sites exist largely to *undo* the primitive. Once B5
lands, most become dead overrides and should be deleted rather than migrated.

### B10. Wire the coverage check into `npm run build`
`npm run theme:check` now runs inside `npm run build` with a budget of **0**.
The build fails on any regression. Deliberate exceptions use an inline
`theme-allow` marker so new violations in already-touched files are still
caught.

### Result

```
81 unthemed surfaces across 20 files   (start of phase B)
 0 unthemed surfaces                   (end of phase B)
```

Verified in-browser: three materials read as one system — phosphor CRT (left
wing), parchment blotter (centre desk), classified paperwork (right deck).

One defect the counter could not catch, found only by looking at the render:
`/40` and `/50` opacity papers sit over the near-black classified pane, so
"dimmed" rows rendered *dark* and their ink-on-paper text became illegible.
The lesson generalises — **a coverage counter proves a class is themed, not
that a given instance is legible.** Always re-screenshot after a batch change.

---

## Phase C — Responsive & polish ✅ COMPLETE

**C1. The 3 AM shake was too much at the final stage** ✅ FIXED
*(user-reported: "the 3 am call shake at the final stage is too much")*

The cause was compounding, not any single animation:
- `tactical-recoil` fired on **two** elements at once (the stamp face *and* the
  directive card), each travelling ±3px — so ~6px of combined motion per slam.
- `stamp-slam` travelled **14px** and scaled to **1.16**. Read as a punch on one
  click, but during CAPS LOCK FRENZY the player clicks many times a second, so
  the impacts overlapped into a permanent judder.
- The frenzy ring used Tailwind's `animate-pulse` (2s, sharp curve) on a 6px
  saturated red ring — a strobe, not a signal.

Fixes, all in `index.css` + two components:
- Recoil amplitude **halved** (±1.5px / ±0.25deg).
- New `stamp-slam-calm` at **~40% of the travel** (6px, scale 1.06) — swapped in
  above 85% tantrum so fast clicking degrades to a subtle throb, not a vibration.
- New `calm-glow` (3.4s, 0.55–0.95 opacity) replaces `animate-pulse` on the
  frenzy ring, the directive card, and the walk-back button.

**INVARIANT:** the impact must remain *readable*. Damping is the correct fix;
deleting the feedback is not.

**C2. Responsive pass** ✅ VERIFIED
1920×1080, 1600×900, 1366×768 and 1280×720 all render with zero scroll, no
clipped footer and no overlapping overlays. The existing `--viewport-scale`
mechanism in `useDesktopViewport` (kicks in below 840px height) absorbs the
smaller targets without new breakpoints.

**C3. Keyboard/focus audit** ✅ FIXED
`CertificateExporter` wrapping a rich `Card` in a real `<button>` was **correct**
— one tab stop, one accessible name, native Enter/Space, no nested interactive
elements. The real defect was the *focus indicator*: the global `:focus-visible`
outline drew around the button's own box, but the button has no visible bounds
of its own, so keyboard users saw a ring floating in space around a card that
gave no indication it was focused.

Fixed by forwarding focus to the child card
(`focus-visible:[&>div]:ring-2 ring-gold-500`), so the surface that *looks*
interactive is the one that lights up. Verified with real Tab navigation, not
programmatic `.focus()` — programmatic focus does not trigger `:focus-visible`
and produced a false negative on the first check.

**C4. `prefers-reduced-motion`** ✅ ADDED
The existing block only covered `transition-*`, so the load-bearing animations
(slam, recoil, ink-bloom, calm-glow) all still ran at full strength. Now covers
`animation-duration` and `animation-iteration-count` too. Confetti is left intact
— it is a discrete event, not a continuous loop.

---

## Sequencing & Invariants

**Order:** A → B → C. Layout must settle before theming; responsive validation
comes last.

**Repo invariants to preserve:**
- Files ≤250 lines target, 400 hard ceiling
- Zustand slice pattern; headless math in `src/engine/` with KaTeX citations
- Type scale: only `t-*` tiers on player-facing UI
- `<Card>` for surfaces — no one-off panel padding
- Component files export components only (helpers in sibling modules)
- `tsc` + `oxlint` + `build` clean before any phase is marked done

**Not in scope (deliberately):** leaderboard (needs a backend; project has none) ·
the `viral-clip-director` MP4 skill remains unused · `yapEngine` reply-swarm and
fat-finger event are still unimplemented per `.agents/AUDIT_REPORT.md`.
