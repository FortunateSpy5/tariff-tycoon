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

## Phase C — Responsive & polish

**C1.** Visual pass at 1920×1080, 1600×900, 1366×768, 1280×720. Verify zero
scroll, no clipped footers, no overlapping overlays at each.

**C2.** Keyboard/focus audit — tab order through the new `Card`-wrapped
interactive elements. `CertificateExporter` wraps a rich card in a `<button>`;
verify it has one clear focus stop and a sensible accessible name.

**C3.** `prefers-reduced-motion` pass — verify the new `stamp-slam` and
`ink-bloom` animations degrade correctly under the existing reduced-motion block
in `index.css`.

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
