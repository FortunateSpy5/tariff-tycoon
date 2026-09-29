# 🏛️ UI/UX Design Specification & Master Desktop Architecture
**EXECUTIVE DEGEN: SHORT THE WORLD** *(The Art of the 3:00 AM Tariff)*

---

## 1. High Concept & Layout Philosophy

*Executive Degen: Short the World* is a satirical macroeconomic incremental simulation designed specifically as a **desktop game** for fullscreen desktop browsers and Electron runtime environments.

### The Non-Scrolling Design Mandate
In a macroeconomic satire clicker, **vertical window scrolling is fatal to both the comedy and the core gameplay loop**:
$$\text{Cause (Executive Order / YAP)} \longrightarrow \text{Insider Exploit (0DTE Short)} \longrightarrow \text{Collateral Damage (D.U.M.P. Scrapping)}$$

The player must witness this causal chain in **the exact same millisecond**. Stamping an unhinged tariff on the desk must instantly plummet the candlestick chart on the left, triggering massive options profits and prompting an emergency agency liquidation on the right. 

To achieve this:
1. **Zero Window-Level Scrolling:** The root viewport is hard-locked (`h-screen h-[100dvh] w-screen overflow-hidden select-none overscroll-none`).
2. **The Hybrid Resolute Cockpit:** Fuses high-density financial telemetry (Concept 1) with an immersive tactile presidential desk and interactive physical props (Concept 2).
3. **Multi-Channel Expandable Consoles:** Both flanking wings feature instant tab channels (`[1-3]` on the left, `[D/U/T/C]` on the right), unlocking deep game subsystems without vertical drift.

---

## 2. Desktop Viewport Specifications & Responsive Scaling

* **Primary Target Resolution:** 1920 × 1080 (16:9 Standard Desktop).
* **High-DPI / Ultrawide Support:** 2560 × 1440 (1440p), 3840 × 2160 (4K), and 21:9 Ultrawide displays center the cockpit (`max-w-[1720px] aspect-[16/9] mx-auto`) framed by warm amber desk ambient glow.
  * ⚠️ **NOT YET IMPLEMENTED (2026-09-29 audit).** `App.tsx` has no max-width — the grid stretches edge to edge, so at 2560px the centre desk becomes ~840px of empty parchment. Tracked as Phase 2.6 in `.agents/workflows/UX_EVALUATION_AND_REDESIGN_PLAN.md`. Treat this line as intent until the width clamp lands.
  * ⚠️ **NOT YET IMPLEMENTED (2026-09-29 audit).** `App.tsx` has no max-width — the grid stretches edge to edge, so at 2560px the centre desk becomes ~840px of empty parchment. Tracked as Phase 2.6 in `.agents/workflows/UX_EVALUATION_AND_REDESIGN_PLAN.md`. Treat this line as intent until the width clamp lands.
* **Sub-1080p Safety Clamp (`useDesktopViewport`):** On budget laptops (1366 × 768, 1600 × 900) or displays with vertical height $<840\text{px}$, the UI applies a dynamic CSS scale clamp (`transform: scale(min(1, h / 860))`) with `transformOrigin: 'top center'`. All three wings, buttons, and meters remain 100% visible on screen without clipping.

---

## 3. The 3-Wing Command Center Geometry

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. TOP STATUS HEADER & TICKER (Height: 48px / h-12)                         │
│    Title, Breaking News Marquee, Treasury Cash, Crony Favor, Clock, Mode    │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. MAIN COCKPIT SURFACE (Height: calc(100vh - 84px))                        │
│    Grid: grid-cols-12 gap-2.5 p-2.5 items-stretch min-h-0                   │
│                                                                             │
│  ┌──────────────────────┬────────────────────────────┬───────────────────┐  │
│  │ LEFT WING (col-3)    │ CENTER STAGE (col-5)       │ RIGHT WING (col-4)│  │
│  │ Telemetry Console    │ The Resolute Tactile Desk  │ Expansion Deck    │  │
│  │ (~26% width)         │ (~42% width)               │ (~32% width)      │  │
│  │                      │                            │                   │  │
│  │ Tabs:                │ Top Props:                 │ Tabs:             │  │
│  │ • [1] STOCKS & 0DTE  │ • ☎️ Red Rotary Phone (Bail)│ • [D] D.U.M.P.    │  │
│  │ • [2] S.L.O.P. Radar │ • 📦 Gold Box (Secret Cash)│ • [U] CRONY       │  │
│  │ • [3] POLY-GRIFT     │ • 🗂️ Shredder (Heat Purge) │   UNLOCKS (Tree)  │  │
│  │                      │                            │ • [T] TARIFFS     │  │
│  │ Mini Candlestick     │ Parchment Directive        │ • [C] CAYMANS     │  │
│  │ 1000x Put/Call Slip  │ Kinetic Rubber Stamp [SPC] │   PRESTIGE        │  │
│  │ S.L.O.P. Radar Gauge │ Ink & Tantrum Gauges       │                   │  │
│  │ Active P&L Feed      │ [LAUNCH 3 AM YAP] [W PUMP] │ 10 Agency Guillot.│  │
│  │                      │                            │ Oligarch Tech Tree│  │
│  └──────────────────────┴────────────────────────────┴───────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. BOTTOM HOTKEY DOCK (Height: 32px / h-8)
│    [SPACE] Stamp  [1-3] Left  [D/U/T/C] Right  [Y] YAP  [W] Walk-Back
│    [V] Vent  [?] Debug  [M] Mute  [F] Fullscreen      (scrollable, never truncated)
└─────────────────────────────────────────────────────────────────────────────┘
```

### Material System (added 2026-09-29)

The cockpit is not one surface — it is **three distinct materials** so the wings read as
different *objects* rather than three dark rectangles. This mapping is the source of
truth and is enforced by `npm run theme:check` (budget 0, runs inside `npm run build`).

| Region | Material | Why |
|--------|----------|-----|
| App root / surround | `newsprint-950` desk wood | The player is at a desk, not in a web app |
| **Centre stage (the desk)** | `newsprint` **parchment** | The GDD already called it a "Parchment Directive" — it was rendering as a grey gradient |
| Left wing frame | `classified` / `redaction` near-black | Recessed into the desk |
| Right wing frame | `classified` / `redaction` near-black | Same recess, different content |
| Cards resting on the desk | `surface-sheet` (paper) | Stacked paperwork |
| Left wing *interiors* | `surface-terminal` phosphor + scanlines | BagHolder Pro is a CRT. A CRT *is* correct here |
| Inset wells inside the terminal | `surface-terminal-well` (`phosphor-900`) | Never neutral grey — grey is the smell this system exists to remove |
| Top status rail | `newsprint` aged paper + double rule | The most screenshot-visible surface in the app |
| Tab-strip headers | `DossierHeader` — redaction bar + wax-red title | One shared component replaced four hand-written copies |

`<Card>`'s **default material is `sheet`**, not grey. This is load-bearing: a primitive
whose default is off-theme re-greys every call site that forgets an explicit material.
`PaneShell` / `TabStrip` / `StatusStrip` own the three-wing frame; the wings differ only
by an `accent` prop (`phosphor` vs `gold`). Fork that markup and the two drift.

---

## 4. Component Details & Interactive Features

### 4.1 Center Stage: The Resolute Tactile Desk (42% Width)
* **Interactive Physical Desk Props:**
  1. **☎️ The Red Rotary Emergency Phone (Anti-Bankruptcy Fail-Safe):** Sits on the upper-left of the blotter. When liquid cash falls below $\$10$, the phone rings with an audio siren. Clicking it invoices the government for Secret Service golf cart rentals, granting $\$5,000 \times (1 + \text{Phase})$ instant liquidity.
  2. **📦 The Gold Classified Document Box (Black Market Sales):** Sits on the upper-middle desk. Click to sell classified bathroom blueprints to offshore buyers for $+\$500$ liquid cash ($+8\%$ S.L.O.P. heat).
  3. **🗂️ The Subpoena Paper Shredder (Heat Purge QTE):** Sits on the upper-right desk. As insider trading pushes S.L.O.P. heat toward $90\%$, the shredder whirs to life. Clicking it (or pressing `[S]`) shreds incriminating trade slips, purging $-25\%$ regulatory suspicion.
* **The Parchment Directive & Core Stamp Button:**
  - Dynamic procedural directive text (`"EXECUTIVE ORDER #8412 // 3:00 AM DIRECTIVE"`).
  - Central kinetic clicker: Phase 1 starts with the Blue Rubber Stamp (`CONFISCATE`); the 24k Golden Sherpie appears at the $1\text{M}$ Oval Office transition.
  - **Ink-splatter particles and a one-shot slam.** The hero object used to be inert; `AGENTS.md` mandates "screen recoil, ink splatter, procedural squeaks" and the stamp was emitting none of it.
  - **Motion damping is mandatory, not optional.** Recoil fired on *two* elements at once (±3px each) and `stamp-slam` travelled 14px / scaled 1.16. Fine for one click; during CAPS LOCK FRENZY the player clicks 5–10x/sec and the impacts overlap into a permanent judder. Current values: recoil ±1.5px, `stamp-slam-calm` (6px, scale 1.06) swapped in above 85% Tantrum, and `calm-glow` (3.4s) instead of `animate-pulse` on the frenzy ring. **Damp the feedback; do not delete it** — it is load-bearing game feel.
  - A single `FeedbackLayer` owns the centre stage with explicit priority (`raid > walkBack > yap > print > crisis`). Four competing `absolute inset-0` overlays previously fought for the same z-index and could stack invisibly.
  - Floating cash yield particles, stamina ink meter, and tantrum fire meter.
* **The Dual Command Triggers:**
  - **`[LAUNCH 3:00 AM LETHAL YAP] (Y)`**: Unlocks with BagHolder Pro **on the first slam** (previously $10\text{k}), generates an unhinged decree, and crashes the selected stock.
  - **`[WALK-BACK CLARIFICATION] (W)`**: During the 8-second window, activates only after a matching CALL is armed. It pumps the market $+35\%$ and settles that CALL; missing the window returns combo collateral and never reverses settled PUT proceeds.
  - **`[VENT] (V)`**: Burns the entire Tantrum meter for VEX relief clamped to the baseline. Deliberately *not* optimal — riding to 100% for a 10x FRENZY always beats venting. It is a panic button for calm options pricing, never an efficiency upgrade.

### 4.2 Left Wing: The Oval Telemetry Console (26% Width)
* **Tab `[1] STOCKS & 0DTE OPTIONS`**:
  - Live S&Pain 500 mini candlestick/sparkline chart for targeted tickers (`$PAIN`, `$DOOR`, `$FRUT`, `$GIGA`).
    - ⚠️ **DOES NOT EXIST (2026-09-29 audit).** `StocksOptionsTab.tsx` renders no chart at all — only a ticker, a price and a delta under a heading that reads "Candlestick Telemetry." `priceHistory` is written by `resolveYapShock` and read by no component. This is the single highest-impact gap in the game: the causal payoff (*watch the sector you just nuked go red*) is invisible. Tracked as Phase 1.1 in `.agents/workflows/UX_EVALUATION_AND_REDESIGN_PLAN.md`.
    - ⚠️ **DOES NOT EXIST (2026-09-29 audit).** `StocksOptionsTab.tsx` renders no chart at all — only a ticker, a price and a delta under a heading that reads "Candlestick Telemetry." `priceHistory` is written by `resolveYapShock` and read by no component. This is the single highest-impact gap in the game: the causal payoff (*watch the sector you just nuked go red*) is invisible. Tracked as Phase 1.1 in `.agents/workflows/UX_EVALUATION_AND_REDESIGN_PLAN.md`.
  - 0DTE options ladder ($10\times$ to $1,000\times$ leverage slider).
  - Quick-short strike buttons with live P&L return indicator.
* **Sealed left channels:** every tab is always present in the strip and always selectable. A channel you have not opened yet renders `SealedDossier` — **To Open** (the single event that opens it) plus **Inside** (the teaser). The former full-pane "RESTRICTED SECURITY ZONE" shutter was removed: it covered the entire terminal *including the tab strip*, so a new player could not read which channels existed, and the strip silently reordered itself as channels unlocked.
* **Tab `[2] S.L.O.P. REGULATORY RADAR`** (sealed until the first YAP):
  - Tracks Grand Jury investigation heat ($0\text{--}100\%$).
  - Displays raid countdowns and legal defense bribe funds.
* **Tab `[3] POLY-GRIFT (Prediction Markets)`** (sealed until a YAP-targeted PUT settles):
  - Parody prediction betting terminal.
  - Wager cash on unhinged political prop bets (e.g. *"Will Canadian maple syrup be taxed by sunrise? YES: 92% ($1.08) | NO: 8% ($12.50)"*).
* **First trade cue:** The stocks panel guides the player through selecting a ticker, opening a PUT, targeting it with YAP, and settling or attempting the timed CALL/walk-back.

### 4.3 Right Wing: The Executive Expansion Deck (32% Width)
* BagHolder Pro opens on the **first slam** during Phase 1. At Phase 2 ($1\text{M}$), D.U.M.P. opens. The first liquidation reveals upgrades; the first upgrade reveals tariffs; the first tariff change reveals Caymans prestige.
* **Tab `[B] BRIEF (Situation Room)`** — never sealed. Carries the tutorial directive, the Career Objectives list, and the certificate exporter. This is the channel you stand in while the others are still locked.
* **Sealed channels [The Seal Is a Promise, Not a Wall]:** every tab is always present in the strip and always selectable, whether or not its channel is open. A sealed channel renders `SealedDossier` — a redacted header, **To Open** (the single event that unlocks it, with a progress bar only for numeric gates), and **Inside** (the teaser). It never mounts the real body, so no purchase, liquidation, tariff move, or prestige reset is reachable while sealed. Copy lives in `src/constants/tabDemands.ts`; the gate is the render branch in `ExecutiveExpansionPane` / `TelemetryConsolePane`, **not** the store's tab setters.
* **Tab `[D] D.U.M.P. (Chainsaw Liquidations)`**:
  - 10 federal agencies (Weather Bureau, Food & Toxins, Aviation Safety, Postal Service, etc.) to scrap for instant cash payouts and permanent disaster perks.
* **Tab `[U] CRONY UNLOCKS (Oligarch Tech Tree)`**:
  - Permanent upgrade shop:
    - *Heavy Tungsten Nib* ($\$25\text{k}$): $+100\%$ click yield.
    - *AI Autopen Interns* ($\$100\text{k}$): Auto-signs 5 taps/sec.
    - *Diet Soda Desk Drip* ($\$250\text{k}$): Tantrum builds $+50\%$ faster.
    - *Dark Pool Dedicated Fiber* ($\$1.0\text{M}$): 0DTE option payout multipliers $+50\%$.
    - *Broad Daylight Money Printer* ($\$10\text{M}$): Mounts physical **[PRINT \$BRRR]** button on desk.
* **Tab `[T] BILATERAL TARIFFS & BEGGING LOG`**:
  - Tariff dials for parodied nations (The Moose Republic, The Strike Republic, Avocadonia) with procedural pleading diplomatic cables.
* **Tab `[C] CAYMANS PRESTIGE`**:
  - Tier 1 Prestige dashboard: Sovereign Immunity Slips (SIS) reset calculator and permanent offshore shell company perk tree.

---

## 5. Ergonomic Keyboard Shortcuts

| Key Binding | Primary Action | Target Panel |
| :--- | :--- | :--- |
| **`[SPACEBAR]`** or **`[ENTER]`** | Slam Stamp / Sign Directive | Center Desk |
| **`[R]`** | Refill Ink | Center Desk |
| **`[1]`, `[2]`, `[3]`** | Switch Stocks, S.L.O.P., and PolyGrift. **Always fire** — a sealed channel shows a demand card | Left Wing |
| **`[B]`** | Switch to the **Brief** (Situation Room; never sealed) | Right Wing |
| **`[D]`** | Switch to **D.U.M.P.**. Always fires; sealed shows a demand card | Right Wing |
| **`[U]`** | Switch to **Crony Unlocks**. Always fires; sealed shows a demand card | Right Wing |
| **`[T]`** | Switch to **Bilateral Tariffs**. Always fires; sealed shows a demand card | Right Wing |
| **`[C]`** | Switch to **Caymans Prestige**. Always fires; sealed shows a demand card | Right Wing |
| **`[Y]`** | Launch 3:00 AM Lethal YAP | Center Desk |
| **`[W]`** | Walk-Back Clarification (+35% recovery pump) | Center Desk |
| **`[V]`** | Vent Tantrum (burns the meter for VEX relief) | Center Desk |
| **`[S]`** | Subpoena Paper Shredder (Heat purge QTE) | Center Desk |
| **`[I]`** | Ignore / suppress the ringing Red Phone crisis | Global |
| **`[F]`** / **`[F11]`** | Toggle Native Borderless Fullscreen | Global |
| **`[M]`** | Toggle Audio Mute | Global |
| **`[Z]`** | Toggle Screen Shake | Global |
| **`[`** | Toggle the dev-only debug panel | Global (DEV) |

> **Footer dock invariant:** the hint list is **scrollable, never `overflow-hidden`**. It
> previously used `overflow-x-hidden` in a 36px row and silently truncated its own keys at
> 1366px — a hotkey the player cannot see is a hotkey that does not exist. Icon-only
> controls (mute / shake / fullscreen) carry `aria-pressed` and a `title`.

---

## 6. Kinetic Feedback & Motion Invariants

1. **Stationary Hitboxes:** Outer boundaries, tab buttons, header metrics, and stock order buttons must **never** physically shake or translate.
2. **Isolated Parchment Recoil:** Motion is confined to the interior desk blotter and the stamp face (`tactical-recoil`, ±1.5px / ±0.25deg). **Recoil must not be applied to two elements at once** — two ±3px animations compound to ~6px of combined travel, which is what made the frenzy judder.
3. **Amplitude must scale with click rate:** a one-shot impact sized for a single click becomes a permanent vibration at 5–10 clicks/sec. `stamp-slam-calm` exists for exactly this reason and engages above 85% Tantrum.
4. **Accessibility:** `screenShakeEnabled === false` (`[Z]`) and `prefers-reduced-motion` both swap movement for a subtle gold/red glow pulse. The `prefers-reduced-motion` block must cover `animation-duration` and `animation-iteration-count`, **not just `transition-*`** — the slam, recoil, ink-bloom and glow are animations, so a transition-only block leaves them running at full strength.
5. **Focus indicators must land on the visible surface.** `CertificateExporter` wraps a rich `Card` in a real `<button>`, so the button has no visible bounds; a global `:focus-visible` outline draws a ring floating in empty space. The ring is forwarded to the child card. Note that programmatic `.focus()` does **not** trigger `:focus-visible` — verify with real Tab navigation or you will get a false negative.
