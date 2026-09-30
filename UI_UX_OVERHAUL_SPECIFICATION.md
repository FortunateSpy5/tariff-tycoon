# 🏛️ UI/UX Overhaul Master Specification
**EXECUTIVE DEGEN: SHORT THE WORLD** (*The Art of the 3:00 AM Tariff*)  
**Document Status:** 🟢 **CANONICAL SPECIFICATION & ARCHITECTURE BLUEPRINT**  
**Last Updated:** September 30, 2026  
**Target Environments:** Fullscreen Desktop Browsers (Chromium, Firefox, Safari) & Electron Runtime

---

## 1. High Concept & Spatial Philosophy

*Executive Degen: Short the World* is an unhinged, satirical macroeconomic incremental game where the player assumes the persona of the Dealmaker-in-Chief. The entire gameplay loop rests upon an instant causal economic chain:
$$\text{Cause (Executive Order / 3:00 AM YAP)} \longrightarrow \text{Market Shock (0DTE Option Exploit)} \longrightarrow \text{State Liquidation (D.U.M.P. Scrapping)}$$

### 1.1 The Zero-Scroll Invariant
In a real-time trading and executive decree simulation, **window scrolling destroys the mechanical comedy**. The player must witness their 3:00 AM post crash the S&Pain 500 candlestick tape in the exact same millisecond that their 1,000× PUT prints millions of dollars.

To preserve this visceral simultaneity:
1. **Zero Window-Level Scrolling:** The root viewport is hard-locked:
   ```css
   height: 100dvh;
   width: 100dvw;
   overflow: hidden;
   user-select: none;
   overscroll-behavior: none;
   ```
2. **Fixed 3-Pane Cockpit:** The screen is divided into three fixed-height, height-filling columns:
   - **Left Wing (4/12 columns):** The Oval Telemetry Console (BagHolder Pro CRT, Candlestick Tape, S.L.O.P. Radar, PolyGrift).
   - **Center Stage (5/12 columns):** The Resolute Tactile Desk (The Presidential Stamp, Props, Ink & Tantrum Gauges, Executive Action Row).
   - **Right Wing (3/12 columns):** The Executive Expansion Deck (D.U.M.P., Crony Unlocks, Bilateral Tariffs, Caymans Prestige).
3. **No Hidden Faucets / Honest Telemetry:** Every operable element on screen must explain its exact mechanical function and stakes on hover (`hint()`). No control may deceive the player about numbers, rates, or unlocks.

---

## 2. Desktop Viewport Specifications & Responsive Scaling

The game targets high-intensity desktop monitors while remaining fully operable on standard laptop screens.

```
┌─────────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. TOP STATUS HEADER & TICKER (Height: 48px / h-12)                                         │
│    Brand, 3:00 AM Time Badge, Breaking News Marquee, Treasury Cash, Crony Favor, Quick Share│
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 2. MAIN COCKPIT SURFACE (Height: calc(100vh - 80px) / max-w-[1720px] mx-auto)               │
│                                                                                             │
│  ┌────────────────────────┬─────────────────────────────┬────────────────────────────────┐  │
│  │ LEFT WING (col-4)      │ CENTER STAGE (col-5)        │ RIGHT WING (col-3)             │  │
│  │ BagHolder Pro Terminal │ Resolute Tactile Desk       │ Executive Expansion Deck       │  │
│  │                        │                             │                                │  │
│  │ Tabs:                  │ Top HUD:                    │ Tabs:                          │  │
│  │ • [1] STOCKS & 0DTE    │ • Passive Income Breakout   │ • [B] BRIEF (Situation Room)   │  │
│  │ • [2] S.L.O.P. RADAR   │ • Frenzy & Walk-Back Dials  │ • [D] D.U.M.P. Agencies        │  │
│  │ • [3] POLY-GRIFT       │ • ☎️ Red Rotary Phone (Bail)│ • [U] CRONY Unlocks            │  │
│  │                        │ • 📦 Gold Box / 🗂️ Shredder │ • [T] Bilateral Tariffs        │  │
│  │ • OHLC Candlestick Tape│ • Active Directive Sheet    │ • [C] Caymans Prestige         │  │
│  │ • 9-Stock Watchlist    │                             │                                │  │
│  │ • Active 0DTE Book     │   ( @ ) PRESIDENTIAL STAMP  │ • Career Objectives & Ledger   │  │
│  │ • Leverage/Collateral  │                             │ • Liquidation Chainsaw Ladder  │  │
│  │ • [SHORT] / [BULL]     │ • Ink & Tantrum Gauges      │ • Crony Influence Tech Tree    │  │
│  │                        │ • [SHORT] [LAUNCH 3AM YAP]  │ • Foreign Pleading Cables      │  │
│  └────────────────────────┴─────────────────────────────┴────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────────────────────┤
│ 3. BOTTOM HOTKEY DOCK (Height: 32px / h-8)                                                  │
│    [SPACE] Stamp  [R] Ink  [Z] Shake  [M] Mute  [Y] YAP  [W] Walk-Back  [?] Debug  [⛶] Max   │
└─────────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 Viewport Targets & Scaling Rules

| Viewport | Mode | Scaling Behavior | Layout Rule |
| :--- | :--- | :--- | :--- |
| **$1920 \times 1080$** | Primary Reference Target | Scale factor $1.0\times$. | Grid fills height cleanly with generous margins and maximal visual fidelity. |
| **$2560 \times 1080/1440$** | Ultrawide Display | Scale factor $1.0\times$; bounded to `max-w-[1720px] mx-auto`. | The $420\text{px}$ letterbox wings become the dark mahogany Oval Office surround rather than blank paper. |
| **$1366 \times 768$** | Standard Laptop | Dynamic clamp: `scaleFactor = min(1, h / 840)`. | Type scales down via `var(--viewport-scale)`. Watchlist transitions to compact row density. |
| **$1280 \times 720$** | Small Display / HD | Dynamic clamp: `scaleFactor = min(1, h / 840)`. | Stamp preserves a strict tactile floor ($\ge 160\text{px}$); directive sheet text sheds secondary lines. |

---

## 3. Theme & Material System: The "3:00 AM Oval Office"

The aesthetic direction is **Tungsten Nocturnal Panic**. It is 3:00 AM, the capital is asleep, and the only illumination comes from a focused desk lamp and the eerie green glow of an unauthorized options terminal.

### 3.1 Physical Material Taxonomy

The UI is composed of four distinct material domains, enforced by `npm run theme:check` (budget 0):

```
                                  [THE NOCTURNAL ROOM]
                         Deep Walnut Wood Vignette (--color-ground)
                                          │
                  ┌───────────────────────┴────────────────────────┐
                  ▼                                                ▼
        [THE RESOLUTE BLOTTER]                           [BAGHOLDER PRO CRT]
   Executive Leather Mat (.surface-desk)           Cool Navy/Black Well (.surface-terminal)
   Tungsten Spotlight Highlight                    Phosphor Green Telemetry & Scanlines
                  │                                                │
                  ▼                                                ▼
         [OFFICIAL DOCUMENTS]                             [RECESSED TELEMETRY]
   Aged Bond Paper (.surface-sheet)                Deep CRT Sub-Wells (.surface-terminal-well)
   Layered Drop Shadows & Redactions               Monospace Code, Candlestick Data, Radar
```

1. **The Midnight Room Surround (`.surround-room`):**
   - Palette: Deep midnight walnut `#120e0b` (`--color-ground`).
   - Treatment: Radial vignette with warm lamplight spill fading rapidly toward the screen edges. Ultrawide letterbox margins feel like the shadowy executive suite walls.
2. **The Resolute Desk Blotter (`.surface-desk`):**
   - Palette: Deep executive burgundy/dark green leather pad (`--color-panel`).
   - Treatment: Top-left tungsten lamp radial highlight (`ellipse at 34% 4%`), perimeter gold-embossed stitching, and brass corner brackets.
3. **The Executive Papers (`.surface-sheet`, `.surface-newsprint`):**
   - Palette: Crisp cream bond paper `#f9f7f2` (`--color-card`).
   - Treatment: Crisp black/dark ink type (`--color-ink-1`), tactile document edge drop-shadows (`box-shadow: 0 1px 3px rgba(0,0,0,0.3)`), and wax seal accents.
4. **The BagHolder Pro CRT Machine (`.surface-terminal`):**
   - Palette: Deep CRT phosphor well `#202a36` (`--color-well`) and sub-well `#2a3646` (`--color-well-2`).
   - Treatment: Horizontal scanline texture, dark matte monitor bezel framing, and phosphor bloom (`--color-live-soft`, `#4ade80`) on market spikes.

### 3.2 The Semantic Palette & Contrast Guarantees

Every color token is assigned to exactly one semantic role. Free-floating color choices are strictly banned.

| Family | Role | Text on Paper (Light) | Text on Screen (Dark) | Fill Rule |
| :--- | :--- | :--- | :--- | :--- |
| **Accent (Amber/Gold)** | Lamp light, the Golden Sherpie, interactive focus | `--color-accent-ink` (`#70490c`, $5.2:1$) | `--color-accent-soft` (`#e8a33d`, $6.7:1$) | Fill only on paper; takes dark ink (`8.2:1`). |
| **Live (Green)** | Profit, market surges, affordable upgrades | `--color-live-ink` (`#255831`, $5.5:1$) | `--color-live-soft` (`#4ade80`, $8.3:1$) | Fill takes `--color-on-fill` (`5.1:1`). |
| **Dead (Red)** | Losses, crashes, crisis alerts, S.L.O.P. raids | `--color-dead-ink` (`#8a2b19`, $5.7:1$) | `--color-dead-soft` (`#f76a6e`, $5.0:1$) | Warning channel only. Never spent on decorative UI. |
| **Signal (Blue)** | Official government stamp, terminal telemetry | `--color-signal-ink` (`#254574`, $6.4:1$) | `--color-signal-soft` (`#7aa8e0`, $5.9:1$) | Official decree ink and baseline tape markings. |

*Contrast Invariant:* Every text pair is verified by `scripts/probe-contrast.mts` at budget 0. Captions at $9.5\text{px}$ must clear $\ge 4.5:1$; controls must clear $\ge 3.0:1$.

---

## 4. Component Architecture & Detailed Layout

### 4.1 Left Wing: The Oval Telemetry Console (4/12 Grid)

Hosts `TelemetryConsolePane.tsx` with three instant-switching channels:

#### Tab `[1] STOCKS & 0DTE OPTIONS`
- **`<PriceChart>`:** Real OHLC candlestick tape spanning 20 $\times$ 2s time buckets ($\approx 40\text{s}$ window).
  - Stamped player moves: Violent red arrows under candle lows on YAP crashes; green arrows above candle highs on Walk-Back recoveries.
  - Golden dashed line marking stock issue price (`basePrice`), automatically omitted when tape excursion exceeds `BASE_SPAN_BUDGET`.
- **`<WatchlistLadder>`:**
  - 9 parodied ticker symbols: `$FRUT`, `$GIGA`, `$DOOR`, `$MICR`, `$GUAC`, `$MSIL`, `$LMBR`, `$AVOC`, `$PAIN`.
  - **Responsive Layout Guarantee:** When vertical height is $\le 800\text{px}$ or an active trade position opens, the watchlist shifts dynamically to compact dual-column pills or micro-rows, guaranteeing that `$GUAC` through `$PAIN` are **never clipped off-screen**.
- **0DTE Order Execution Controls:**
  - Leverage selector chips: `10x`, `100x`, `1000x`.
  - Collateral selector chips: `$500`, `$1k`, `$5k`.
  - Action buttons: `SHORT PUT` (amber/red) and `BULL CALL` (cyan/blue).
  - Active position drawer with live P&L return and countdown to expiration.

#### Tab `[2] S.L.O.P. REGULATORY RADAR`
- **Dynamic Tactical Vector Radar:**
  - An animated green/amber vector radar screen replacing the static empty box.
  - Rotating phosphor sweep line over concentric legal threat rings (*Docile $\to$ Inquest $\to$ Grand Jury $\to$ Special Counsel Raid*).
  - Pulsing threat blips representing active SEC bots and whistleblower investigations.
- **Defense Actions:**
  - `Bribe Inquest Lead` (Costs 20 Favor $\to -16\%$ Heat).
  - `Emergency Shredder` (Costs 10 Favor $\to -25\%$ Heat, mapped to `[S]`).

#### Tab `[3] POLY-GRIFT (Prediction Markets)`
- Parody prediction betting terminal for unhinged political prop bets.
- Odds sparklines and recent resolution ticker to utilize the vertical space cleanly.

---

### 4.2 Center Stage: The Resolute Tactile Blotter (5/12 Grid)

Hosts `ResoluteBlotterCenter.tsx`:

#### The Presidential Stamp (`ClickerButton.tsx`)
- Layered SVG construction (`StampIllustration.tsx`): metal grip rings, knurled barrel, spring shoulder, and permanent ink-stained rubber face.
- Lettering rendered in real HTML (`StampFaceLabel.tsx`) using container-query units (`cqw`).
- **Tactile Floor Invariant:** The stamp must never shrink below $160\text{px}$ diameter. Vertical budgets on laptop viewports are reclaimed by consolidating the income bar and docking crisis alerts into the top header.
- **Kinesthetic Juice:** Stamp clicks emit procedure audio squeaks, ink particles (`InkParticles.tsx`), and a localized spring squash/stretch (`scaleY(0.92)`).

#### Desk Props & Directives
- **☎️ Red Rotary Emergency Phone (`RedPhoneProp.tsx`):** Rings when cash $< \$10$ with an audio siren. Answers provide immediate government bailout liquidity.
- **📦 Gold Classified Box (`GoldBoxProp.tsx`):** Emergency secret bathroom document sales for $+\$500$ cash ($+8\%$ S.L.O.P. heat).
- **🗂️ Subpoena Shredder (`SubpoenaShredderProp.tsx`):** Whirs at high heat; purges $-25\%$ suspicion.
- **`<DirectiveSheet>`:** Shows latest issued decree, tweet impact multiplier, and viral quote count.

#### Gauges & Action Triggers
- **`<ExecutiveGauges>`:**
  - *Customs Stamp Ink:* Stamina gauge. Refill costs scale smoothly without punitive runaway debt.
  - *Executive Tantrum:* Builds to 100% to trigger **CAPS LOCK FRENZY** ($10\times$ click yield).
- **Command Actions:**
  - `[LAUNCH 3:00 AM LETHAL YAP] (Y)`: Crashes the targeted stock and spikes VEX volatility.
  - `[WALK-BACK CLARIFICATION] (W)`: 8-second skill window. Armed matching CALL triggers $+35\%$ recovery rally.

---

### 4.3 Right Wing: The Executive Expansion Deck (3/12 Grid)

Hosts `ExecutiveExpansionPane.tsx` with five administrative channels:

1. **Tab `[B] BRIEF (Situation Room)`:**
   - Career Objectives progress tracker (collapses completed rows to prevent clutter).
   - **Foreign Diplomatic Wire:** Real-time incoming satirical teletypes from parodied world powers reacting to tariffs.
   - **Cabinet Panic Meter:** Dynamic radial meters tracking oligarch and market confidence.
   - Dedicated `[ SHARE THE DAMAGE ]` 1080×1920 decree certificate exporter.
2. **Tab `[D] D.U.M.P. (Chainsaw Liquidations)`:**
   - Scraps 10 federal departments (including `D.E.E.P.-N.U.K.E.`) for instant cash and permanent macroeconomic perks.
3. **Tab `[U] CRONY UNLOCKS (Oligarch Tech Tree)`:**
   - Upgrades shop: *Tungsten Nib*, *AI Autopen Interns*, *Diet Soda Desk Drip*, *Dark Pool Fiber*, *Broad Daylight Money Printer*.
   - Visual lobbying connector diagram illustrating compromised agencies.
4. **Tab `[T] BILATERAL TARIFFS`:**
   - Individual dials ($0\text{--}500\%$) for 6 parodied nations (*Great Northern Annex*, *Nearshore Federation*, *Strike Republic*, *Overthinker Union*, *Red Factory*, *Silicon Archipelago*).
   - Live Laffer curve calculations and escalating diplomatic cables.
5. **Tab `[C] CAYMANS PRESTIGE`:**
   - Tier 1 Chapter 11 filing calculator granting Sovereign Immunity Slips (SIS) and 6 permanent offshore perks.

---

## 5. Tooltip & Focus Interaction Guidelines

1. **Delegated Layer (`HintLayer.tsx`):** All tooltips render through a single delegated layer portalled to `document.body`, reading `data-hint` attributes.
2. **Smart Flip Collision Avoidance:**
   - In [`hintPlacement.ts`](file:///c:/Users/msoum/OneDrive/Documents/GitHub/tariff-tycoon/src/components/ui/hintPlacement.ts), candidate bubble placement must detect operable sibling controls.
   - Tooltips anchored to elements in the bottom-left screen quadrant (watchlist, leverage chips, trade buttons) **must flip to the right gutter (over the center desk)** or anchor above, never obscuring `SHORT PUT` or `BULL CALL`.
3. **Truth In Tooltips:** A tooltip that quotes a number the simulation does not use is a defect. All figures (refill prices, cooldowns, multipliers) must be imported directly from constants or engine functions.
4. **Accessible Gating:** Gated controls use `aria-disabled` and status announcements, never native `disabled`, so explanatory tooltips remain fully readable when a control is locked.

---

## 6. Verification & Quality Gates

Every code modification must pass the complete CI build pipeline:
```bash
npm run build
```
Which internally executes:
1. `tsc -b` — Zero TypeScript compilation errors.
2. `npm run theme:check` — 0 unthemed `stone-*` surfaces (Budget: 0).
3. `npm run token:check` — 0 undefined color tokens, 0 stock Tailwind ramp leaks (Budget: 0).
4. `npm run hover:check` — 0 operable elements without a `hint()` (Budget: 0).
5. `npm run contrast:probe` — 37/37 passing WCAG 2.1 contrast pairs (Budget: 0).
6. `npm run size:check` — All files strictly $\le 400$ lines (Target: $\le 250$ lines).
7. `vite build` — Production assets compiled with zero bundle errors.
