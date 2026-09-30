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
* **High-DPI / Ultrawide Support:** 2560 × 1440 (1440p), 3840 × 2160 (4K), and 21:9 Ultrawide displays center the cockpit (`max-w-[1720px] mx-auto` in `App.tsx`) framed by warm amber desk ambient glow. Verified at 2560px: the grid renders at exactly 1720 rather than 2540, so 820px of letterboxing is removed and the cockpit reads as a document on a desk rather than a letterboxed game. *(The `aspect-[16/9]` this line used to claim was never implemented and is not needed — the panes are height-filling, not aspect-locked.)*

### [TUNGSTEN] The material system

The three material layers (NEWSPRINT / CLASSIFIED / TERMINAL) gained a fourth
property: **light**. It is 3am, there is one desk lamp, and the paper is the
only bright thing in the room.

* **Four paper stocks, with the value order inverted.** `card` is the *sheet*
  (lightest), `panel` an aged document, `ground` the **blotter pad** — which
  is the desk — and the pad is DARKER than the sheet resting on it. Paper
  lighter than the pad it rests on is what makes a stack read as a stack. The
  previous ramp had the desk and a sheet 4% apart, so nothing read as an object
  and the centre column was one flat beige field. CORRECTED from
  `newsprint-50/100/200/300`: that ramp was renamed `card` / `panel` / `ground` /
  `line-soft` in [TUNGSTEN], and the ordering below is now exactly what
  `@theme` defines. `surface-sheet` also casts a shadow, because a different colour
  from the surface under it still reads as a flat panel until it casts one.
* **The desk is lit, not filled.** A tight tungsten pool from the **upper left**
  — matching where `StampIllustration` throws its cast shadow, since light and
  shadow have to agree or the object floats — with an **opaque** falloff to a
  dark rim. A broad soft pool over a large surface is indistinguishable from no
  pool at all.
* **The room is dark.** `.surround-room` is near-black with a fast-dying warm
  spill.
* **Each half owns its green.** `phosphor` is the CRT and is *material only* —
  never a text colour on paper, where it measured 1.53:1. `money` is a deep
  teal-green built for the paper half, with 600–800 for text on cream. On a
  terminal well, money and terminal chrome previously sat 1.37:1 apart, both
  green.
* **Gold is fill, and gold is ink.** 300–600 are fills and take dark ink on top;
  700–950 are text-safe on paper. `gold-600` on parchment is 2.82:1 and *every*
  warm value clearing 4.5:1 on cream is a brown, so gold cannot be a text colour
  on paper at caption size.
* **The two wings stay two wings.** Green CRT left, cream paper right. That
  separation is load-bearing — it is how a player knows which world they are in
  without reading. Do not converge them, and specifically do not move the
  terminal to amber: amber is the right wing's accent.
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
| App root / surround | `surround-room` → `ground` warm desk field | The player is at a desk, not in a web app. CORRECTED from `newsprint-950` desk wood, which described the pre-[TUNGSTEN] dark desk; the room is warm now, and `.agents/rules/desktop-ui-and-layout-invariants.md` still named it `bg-stone-950` until ISSUE-012 |
| **Centre stage (the desk)** | `surface-desk` — `panel` parchment under a tungsten pool | The GDD already called it a "Parchment Directive" — it was rendering as a grey gradient. One value step above the surround, per [The Panes Are The Same Colour At Different Values] |
| Left wing frame | `surface-terminal` phosphor + scanlines | Recessed into the desk. BagHolder Pro is a CRT, and a CRT *is* correct here |
| Right wing frame | `surface-sheet` / `panel` paper | Same recess as the desk, one value step — three different colours across three wings is Imhof's fourth rule broken |
| Cards resting on the desk | `surface-sheet` (paper) | Stacked paperwork |
| Inset wells inside the terminal | `surface-terminal-well` (`well-2`) | Never neutral grey — grey is the smell this system exists to remove. The screen ladder stops at two steps; see the note in `index.css` |
| Top status rail | `surface-newsprint` aged paper + double rule | The most screenshot-visible surface in the app |
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
  - **The stamp is a layered SVG object, not a coloured circle** *(Phase 2.3)*. Barrel, grip rings, shoulder and a permanently ink-stained rubber face, with the lettering laid over the rubber as real HTML — on a real stamp the type is printed *on* the face, and SVG `<text>` could neither be read by a screen reader nor pick up the type scale. Two palettes (blue customs / gold Sherpie), each with its own frenzy variant rather than a red filter over gold.
  - **The stamp SIZES ITSELF to the desk's leftover height**, capped at 320px. It used to be a fixed `w-44 sm:w-52 md:w-60` circle inside a `flex-1 min-h-0` column on a desk with `overflow-hidden`, so it had 134px of room in steady state and **69px while a crisis was ringing** — a 95px overflow that painted the stamp over the directive sheet, at the exact moment the player most needs to read the desk. That case predated Phase 2. Its lettering is sized in `cqw` against the button's own container, and below 170px the face sheds the two qualifier lines and grows the verb.
    - **Two traps here, both of which look like "the element is tiny".** `container-type: size` on a `fit-content` flex item resolves to **zero** (the width depends on the `cqw` text, which depends on the width), so the container must be an ancestor definite on both axes. And `scrollHeight` vs `getBoundingClientRect()` measures nothing once the root is `transform: scale()`d for sub-1080p — use `clientHeight`/`offsetHeight`, which are layout pixels.
  - **Ink-splatter particles and a one-shot slam.** The hero object used to be inert; `AGENTS.md` mandates "screen recoil, ink splatter, procedural squeaks" and the stamp was emitting none of it.
  - **Motion damping is mandatory, not optional.** Recoil fired on *two* elements at once (±3px each) and `stamp-slam` travelled 14px / scaled 1.16. Fine for one click; during CAPS LOCK FRENZY the player clicks 5–10x/sec and the impacts overlap into a permanent judder. Current values: recoil ±1.5px, `stamp-slam-calm` (6px, scale 1.06) swapped in above 85% Tantrum, and `calm-glow` (3.4s) instead of `animate-pulse` on the frenzy ring. **Damp the feedback; do not delete it** — it is load-bearing game feel.
  - A single `FeedbackLayer` owns the centre stage with explicit priority (`raid > walkBack > yap > print > crisis`). Four competing `absolute inset-0` overlays previously fought for the same z-index and could stack invisibly.
  - Floating cash yield particles, stamina ink meter, and tantrum fire meter.
* **The Cockpit Readout** *(Phase 2.5 — answers Finding D: income was invisible, and the two most consequential timers rendered as 10px captions in corners of a pane)*:
  - A prominent `$X/s` headline, the sum of **all three** income sources, with the breakdown as inline chips. **Every source renders even at `$0.00`**, carrying the reason it is dormant — a row that only appears once it pays teaches the player nothing about the lever they are meant to pull, and a bare `0.00` reads as a bug rather than a decision.
  - **The autopen row is deliberately flat.** `tickPassiveEconomy` pays `base × 5 × Δt` and ignores the Tungsten Nib and the Sovereign Immunity Slips. A readout that multiplied it by the click yield would overstate the upgrade by up to 20× for a late-game player. Its constants live in `engine/systems/passiveRates.ts` so the readout and the tick import one value.
  - **CAPS LOCK FRENZY and the walk-back window are dials**: a `conic-gradient` sweep whose proportion *is* the remaining fraction, so the visual and the number cannot disagree, with the seconds as a number at the centre. Both stay mounted when inert so nothing below them shifts. `aria-live="off"` is deliberate — they update 4×/sec during a frenzy, and a polite live region on a 4Hz counter is an unusable stream of speech.
  - **This panel is on a zero-scroll desk, so its height is a budget.** Its first draft was 125px and came straight out of the stamp's height without erroring. It is 67px, and the visible breakdown was kept as chips rather than pushed into hover text — hiding the three rates in tooltips would have satisfied the letter of the item while restoring the exact defect it was filed against.
* **The panic scale is a warning channel, not a second palette** *(Phase 2.1)*: four saturated reds that fire on a crisis ringing, the walk-back window open, or S.L.O.P. heat at `SLOP_CRITICAL_THRESHOLD` — frenzy gets the soft wash. Sub-critical heat gets nothing, because at 60% nothing is happening yet and dyeing the cockpit red for it would make the real 100% meaningless. The wash is a static `box-shadow`, so `prefers-reduced-motion` cannot erase the one thing the player needs to see. The surround is `.surround-room` on the app root, deliberately not a `surface-*` token: parchment belongs to the desk, and a token components can reach for would eventually creep onto a card.
* **The Dual Command Triggers:**
  - **`[LAUNCH 3:00 AM LETHAL YAP] (Y)`**: Unlocks with BagHolder Pro **on the first slam** (previously $10\text{k}), generates an unhinged decree, and crashes the selected stock.
  - **`[WALK-BACK CLARIFICATION] (W)`**: During the 8-second window, activates only after a matching CALL is armed. It pumps the market $+35\%$ and settles that CALL; missing the window returns combo collateral and never reverses settled PUT proceeds.
  - **`[VENT] (V)`**: Burns the entire Tantrum meter for VEX relief clamped to the baseline. Deliberately *not* optimal — riding to 100% for a 10x FRENZY always beats venting. It is a panic button for calm options pricing, never an efficiency upgrade.

### 4.2 Left Wing: The Oval Telemetry Console (26% Width)
* **Tab `[1] STOCKS & 0DTE OPTIONS`**:
  - Live S&Pain 500 candlestick chart for targeted tickers (`$PAIN`, `$DOOR`, `$FRUT`, `$GIGA`).
    - ✅ **SHIPPED (Phase 1.1).** `PriceChart` mounts in `StocksOptionsTab`: 20 × 2s OHLC buckets (~40s of tape), real highs and lows accumulated by the tick, the player's own moves marked with their measured excursion, and a dashed rule at the issue price. It deliberately does **not** read `priceHistory`, which is twenty *closes* at 10Hz with no open, high or low — slicing that into candles would fabricate every wick, and the one surface whose job is to tell the truth about a position must not invent volatility the simulation never produced. Recorded in `.agents/workflows/UX_EVALUATION_AND_REDESIGN_PLAN.md`.
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
