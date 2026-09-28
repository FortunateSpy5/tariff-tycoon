# UI/UX Redesign — Completion Plan

**Status:** Phase 0 (QA + type system) ✅ COMPLETE · Phase A next
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

## Phase A — Layout & component consolidation ◀ NEXT

### A1. Collapse the competing center overlays
`ResoluteBlotterCenter.tsx` mounts up to 4 `absolute inset-0` feedback layers
(lines ~172, ~196, plus the raid and crisis banners) that fight for the same
z-index and can stack invisibly.

**Do:** one prioritized feedback slot. A single renderer picks the
highest-priority active message — `raid > walk-back > yap > print` — so only
one overlay can ever mount.

**Verify:** trigger a raid + a YAP in the same frame; exactly one overlay renders.

### A2. Roll `<Card>` into the panes and terminal tabs
Only 3 components use the primitive today, so padding/radius remain inconsistent
across the cockpit — the exact drift `<Card>` was introduced to kill.

**Do:** adopt `<Card material="panel">` in `TelemetryConsolePane`,
`ExecutiveExpansionPane`, and the 4 terminal tabs. Replace one-off
`p-2`/`p-2.5`/`p-3` and `rounded-lg`/`rounded-xl` on panels.

**Verify:** grep for remaining one-off panel paddings; should drop to near zero.

### A3. Rewrite `HotkeyFooterHUD`
~20 text nodes in a 36px dock that silently clips. It also duplicates the
mute/shake toggles already present in the ticker.

**Do:** collapse to a single scrollable row of essential keys; icon-only
mute/shake/fullscreen; drop the "100% TRANSFORMATIVE SATIRE" strapline. Raise to
40px only if the row still truncates at 1366px.

**Verify:** no clipping at 1920, 1600, 1366, 1280.

### A4. Resolve the Ink/Tantrum meter asymmetry ✅ DECIDED
They sit in a `grid-cols-2` but only Ink has an action, so the pair reads as
broken rather than intentional.

**Decision (user):** do **both** —
1. **Restack** as a deliberate full-width pair so the asymmetry reads as designed
2. **Add a "Vent Tantrum" action**: spend tantrum to cool VEX faster

The Vent action is a real balance change and needs a new store action in
`deskSlice` plus a constant. Keep it modest — e.g. spend all tantrum, gain a
short VEX decay bonus — so it never becomes the optimal path to frenzy.

**Verify:** venting removes the meter, boosts VEX decay, and does **not**
undercut the CAPS LOCK FRENZY loop.

---

## Phase B — Theme completion

### B1. `TelemetryConsolePane` → `surface-terminal`
BagHolder Pro should read as a real phosphor CRT (scanlines + glow), not dark
stone. This is the game's signature terminal and currently looks generic.

### B2. `BreakingNewsBar` → newsprint
The only fully un-themed surface, and the most screenshot-visible element in the
app. Aged paper with ink-on-newsprint headlines.

### B3. Terminal materials across the 4 dump tabs
Shift `DumpAgenciesTab`, `CronyUnlocksTab`, `BilateralTariffsTab`,
`CaymansPrestigeTab` from "office chrome" to "classified paperwork", consistent
with `SituationRoom`.

### B4. Remove ALL emoji ✅ DECIDED
Replace with lucide icons throughout — **including the shareable PNG**
(overrides my earlier recommendation; the artifact should read as official, not
meme-bright):

| Emoji | Replacement | Sites |
|-------|-------------|-------|
| 🤝 | `Handshake` | ticker, `DumpAgenciesTab`, `SlopRadarTab`, `SubpoenaShredderProp`, `decreeCard.ts` PNG |
| 📜 | `ScrollText` | ticker (SIS), prestige tab, `decreeCard.ts` PNG |
| 🚨 | `Siren` | crisis/raid banners, `TantrumMeter` |
| 💥 | `Zap` | `TantrumMeter` |
| ★ | drawn vector / `Award` | wax seal area, `RunSummaryCard` |
| 🔥 | `Flame` | insider-combo feedback |

**Canvas note:** the PNG renderer cannot use lucide components — glyphs must be
drawn with `ctx.fillText` or replaced with canvas-native shapes. Plan: draw the
seal and rule graphics as vector paths, and use plain text labels in the PNG
(`CRONY FAVOR`, `SOVEREIGN IMMUNITY SLIPS`) rather than emoji.

**Verify:** grep the whole repo for the emoji set; expect zero hits in
player-facing code and the PNG.

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
