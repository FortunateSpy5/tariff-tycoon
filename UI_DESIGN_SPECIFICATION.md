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
│ 3. BOTTOM HOTKEY DOCK (Height: 36px / h-9)                                  │
│    [SPACE] Stamp  [1-3] Left  [D/U/T/C] Right  [Y] YAP  [W] Walk-Back  [F]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

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
  - Floating cash yield particles, stamina ink meter, and tantrum fire meter.
* **The Dual Command Triggers:**
  - **`[LAUNCH 3:00 AM LETHAL YAP] (Y)`**: Unlocks with BagHolder Pro at $10\text{k}$, generates an unhinged decree, and crashes the selected stock.
  - **`[WALK-BACK CLARIFICATION] (W)`**: During the 8-second window, activates only after a matching CALL is armed. It pumps the market $+35\%$ and settles that CALL; missing the window returns combo collateral and never reverses settled PUT proceeds.

### 4.2 Left Wing: The Oval Telemetry Console (26% Width)
* **Tab `[1] STOCKS & 0DTE OPTIONS`**:
  - Live S&Pain 500 mini candlestick/sparkline chart for targeted tickers (`$PAIN`, `$DOOR`, `$FRUT`, `$GIGA`).
  - 0DTE options ladder ($10\times$ to $1,000\times$ leverage slider).
  - Quick-short strike buttons with live P&L return indicator.
* **Tab `[2] S.L.O.P. REGULATORY RADAR`** (revealed after the first YAP):
  - Tracks Grand Jury investigation heat ($0\text{--}100\%$).
  - Displays raid countdowns and legal defense bribe funds.
* **Tab `[3] POLY-GRIFT (Prediction Markets)`** (revealed after settling a YAP-targeted PUT):
  - Parody prediction betting terminal.
  - Wager cash on unhinged political prop bets (e.g. *"Will Canadian maple syrup be taxed by sunrise? YES: 92% ($1.08) | NO: 8% ($12.50)"*).
* **First trade cue:** The stocks panel guides the player through selecting a ticker, opening a PUT, targeting it with YAP, and settling or attempting the timed CALL/walk-back.

### 4.3 Right Wing: The Executive Expansion Deck (32% Width)
* BagHolder Pro opens at $10\text{k}$ during Phase 1. At Phase 2 ($1\text{M}$), D.U.M.P. opens. The first liquidation reveals upgrades; the first upgrade reveals tariffs; the first tariff change reveals Caymans prestige.
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
| **`[1]`, `[2]`, `[3]`** | Switch Stocks, S.L.O.P. (after first YAP), and PolyGrift (after YAP PUT settlement) | Left Wing |
| **`[D]`** | Switch to **D.U.M.P.** at Phase 2 | Right Wing |
| **`[U]`** | Switch to **Crony Unlocks** after first liquidation | Right Wing |
| **`[T]`** | Switch to **Bilateral Tariffs** after first upgrade | Right Wing |
| **`[C]`** | Switch to **Caymans Prestige** after first tariff change | Right Wing |
| **`[Y]`** | Launch 3:00 AM Lethal YAP | Center Desk |
| **`[W]`** | Walk-Back Clarification (+35% recovery pump) | Center Desk |
| **`[S]`** | Subpoena Paper Shredder (Heat purge QTE) | Center Desk |
| **`[F]`** / **`[F11]`** | Toggle Native Borderless Fullscreen | Global |
| **`[M]`** | Toggle Audio Mute | Global |
| **`[Z]`** | Toggle Screen Shake | Global |

---

## 6. Kinetic Feedback & Motion Invariants

1. **Stationary Hitboxes:** Outer boundaries, tab buttons, header metrics, and stock order buttons must **never** physically shake or translate.
2. **Isolated Parchment Recoil:** Screen shake is isolated to `.shake-surface` (`transform: translate3d(±3px, ±2px, 0)`) on the interior desk blotter and stamp icon.
3. **Accessibility:** Honoring `screenShakeEnabled === false` and `prefers-reduced-motion` immediately swaps movement for a subtle gold/red glow pulse.
