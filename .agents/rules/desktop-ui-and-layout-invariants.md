# Desktop UI & Layout Architecture Invariants

This rule file defines strict, non-negotiable architectural invariants for the visual layout, viewport containment, and ergonomic controls of **EXECUTIVE DEGEN: SHORT THE WORLD**.

---

## 1. The Zero-Scroll Fullscreen Mandate

1. **Strict Viewport Containment:**
   - The game is explicitly designed as a **desktop game** (optimized for fullscreen desktop browsers and Electron packaging).
   - **Zero Vertical Window Scrolling:** The root shell must be strictly bounded to the viewport.
   - Root classes required: `h-screen h-[100dvh] w-screen w-[100dvw] overflow-hidden select-none overscroll-none bg-stone-950 flex flex-col`.
   - Never allow `document.body` or `#root` to generate a window-level scrollbar under any circumstances.
2. **Internal Scroll Containment:**
   - Scrollable lists (e.g. D.U.M.P. agency cards, order books, trade logs) must be strictly confined to their parent container using `overflow-y-auto custom-scrollbar` with an explicit `max-h` or `flex-1 min-h-0`.
3. **Sub-1080p Viewport Safety (Laptops & Small Displays):**
   - The game must gracefully support displays from 1366×768 up to 4K and 21:9 Ultrawide.
   - For viewports with vertical height $<840\text{px}$, an automatic CSS scale clamp (`useDesktopViewport`) scales the game stage (`transform: scale(min(1, h / 860))`) to guarantee that all three wings and buttons remain 100% visible on screen without clipping or overflow.

---

## 2. Layout Geometry: The Hybrid Resolute Cockpit

The viewport is divided into three persistent, fixed-height zones:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. HEADER HUD (Height: 48px / h-12)                                         │
│    Game Title, Breaking News Marquee, Treasury Cash, Crony Favor, Clock, F  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 2. MAIN COCKPIT SURFACE (Height: calc(100vh - 84px))                        │
│    Grid: grid-cols-12 gap-2.5 p-2.5 items-stretch min-h-0                   │
│                                                                             │
│  ┌──────────────────────┬────────────────────────────┬───────────────────┐  │
│  │ LEFT WING (col-3)    │ CENTER STAGE (col-5)       │ RIGHT WING (col-4)│  │
│  │ Telemetry Console    │ The Resolute Tactile Desk  │ Expansion Deck    │  │
│  │ (~26% width)         │ (~42% width)               │ (~32% width)      │  │
│  │                      │                            │                   │  │
│  │ Channels (1-3):      │ Top Props:                 │ Channels (D/U/T/C)│  │
│  │ • [1] STOCKS & 0DTE  │ • ☎️ Red Rotary Phone (Bail)│ • [D] D.U.M.P.    │  │
│  │ • [2] POLY-GRIFT     │ • 📦 Gold Box (Secret Cash)│ • [U] CRONY       │  │
│  │ • [3] S.L.O.P. Radar │ • 🗂️ Shredder (Heat Purge) │   UNLOCKS (Tree)  │  │
│  │                      │                            │ • [T] TARIFFS     │  │
│  │ Mini Candlestick     │ Parchment Directive        │ • [C] CAYMANS     │  │
│  │ 1000x Put/Call Slip  │ Kinetic Rubber Stamp [SPC] │   PRESTIGE        │  │
│  │ S.L.O.P. Radar Gauge │ Ink & Tantrum Gauges       │                   │  │
│  │ Active P&L Feed      │ [LAUNCH 3 AM YAP] [W PUMP] │ 10 Agency Guillot.│  │
│  │                      │                            │ Oligarch Tech Tree│  │
│  └──────────────────────┴────────────────────────────┴───────────────────┘  │
├─────────────────────────────────────────────────────────────────────────────┤
│ 3. FOOTER HOTKEY DOCK (Height: 36px / h-9)                                  │
│    [SPACE] Stamp  [1-3] Left  [D/U/T/C] Right  [Y] YAP  [W] Walk-Back  [F]  │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Kinetic Feedback & Screen Shake Isolation

1. **Hitbox Anchoring Rule:**
   - **NEVER** shake the root window, `#root`, or the outer bounding containers.
   - Shaking the window displaces buttons out from under the player's cursor, causing missed clicks and motion sickness.
2. **Element-Level Recoil:**
   - Visual recoil and frenzy shake must be applied **only** to the interior parchment document and stamp (`.shake-surface` with `transform: translate3d(...)`) inside an `overflow-hidden` container.
   - Flanking terminals, gauges, headers, and footer HUD remain **100% physically stationary**.
3. **Accessibility Invariant:**
   - Always honor `screenShakeEnabled === false` and the browser's `prefers-reduced-motion` media query. When disabled, shake animations must immediately swap to a gentle brightness/border pulse.

---

## 4. Keyboard Ergonomics & Multi-Channel Navigation

To eliminate RSI index finger fatigue from spam clicking, the game must be fully operable via keyboard:

| Key Binding | Primary Action | Target Panel |
| :--- | :--- | :--- |
| **`[SPACEBAR]`** or **`[ENTER]`** | Slam Stamp / Sign Directive | Center Desk |
| **`[1]`, `[2]`, `[3]`** | Switch Left Telemetry Channels (Stocks, PolyGrift, S.L.O.P.) | Left Wing |
| **`[D]`** | Switch Right Expansion Channel to **D.U.M.P.** | Right Wing |
| **`[U]`** | Switch Right Expansion Channel to **Crony Unlocks** (Upgrade Tree) | Right Wing |
| **`[T]`** | Switch Right Expansion Channel to **Bilateral Tariffs** | Right Wing |
| **`[C]`** | Switch Right Expansion Channel to **Caymans Prestige** | Right Wing |
| **`[Y]`** | Launch 3:00 AM Lethal YAP | Center Desk |
| **`[W]`** | Walk-Back Clarification (+35% recovery pump) | Center Desk |
| **`[S]`** | Subpoena Paper Shredder (Heat purge QTE) | Center Desk |
| **`[F]`** / **`[F11]`** | Toggle Native Borderless Fullscreen | Global |
| **`[M]`** | Toggle Audio Mute | Global |
| **`[Z]`** | Toggle Screen Shake | Global |

---

## 5. Expanding Game Options & Tech Tree Standards

1. **Multi-Tab Modular Consoles:**
   - Flanking wings must use channel tabs rather than hidden or scrolled content.
   - Tabs must be keyboard accessible and preserve active channel state in Zustand (`settingsSlice`).
   - The two wings share `PaneShell`/`TabStrip`/`StatusStrip` and differ only by an `accent` prop. Fork the markup and the two strips will drift.
   - Never `overflow-hidden` the hotkey list in `HotkeyFooterHUD` — it truncates silently. Scroll or reflow.
2. **Oligarch Lobbying Upgrade Shop (`[U]` Tab):**
   - Upgrades must provide clear mechanical multipliers (Click Yield, Autopen taps/sec, Tantrum build rate, 0DTE payout multipliers, Broad Daylight Money Printer).
   - Purchased upgrades must disable their buy button, indicate acquired status, and save permanently to local storage.
3. **Progressive Disclosure:**
   - Phase 1 (Gate 99B Customs): BagHolder Pro and the YAP unlock on the **first slam** (previously a $\$10{,}000$ cash threshold, removed — the core loop must be reachable in the first ten seconds). Individual channels inside each wing still gate on upgrades.
   - Phase 2 (Oval Syndicate): Left wing boots BagHolder Pro's full tab set.
   - Phase 3 (Fortress America): Right wing unlocks D.U.M.P. and the full Crony Tech Tree.
