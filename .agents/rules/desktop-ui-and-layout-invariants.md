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
   - Visual recoil and frenzy shake must be applied **only** to the interior parchment document and stamp (`tactical-recoil`, `stamp-slam`, `stamp-slam-calm` — *not* a `.shake-surface` class, which was removed) inside an `overflow-hidden` container.
   - **Recoil amplitude is fixed, never scaled by the Tantrum Meter.** A high Tantrum Meter is only reachable by clicking fast, so a meter-proportional recoil becomes a proportional *click-rate* recoil and collapses into a permanent judder at frenzy speed. Add a new animation if you want more impact; do not scale the existing one.
   - Flanking terminals, gauges, headers, and footer HUD remain **100% physically stationary**.
3. **Accessibility Invariant:**
   - Always honor `screenShakeEnabled === false` (`[Z]`) and the browser's `prefers-reduced-motion` media query. When disabled, shake animations must immediately swap to a gentle brightness/border pulse.
   - The `prefers-reduced-motion` block must cover `animation-duration` and `animation-iteration-count` as well as `transition-*`. The slam, recoil, ink-bloom and glow are **animations**; a transition-only block leaves every one of them running at full strength.
   - Focus rings must land on the **visible** surface. `CertificateExporter` wraps a rich `Card` in a real `<button>`, so the button has no visible bounds and a default outline draws a ring floating in empty space. Forward the ring to the card. Verify with real Tab navigation — programmatic `.focus()` does not trigger `:focus-visible` and will give you a false negative.

---

## 4. Keyboard Ergonomics & Multi-Channel Navigation

To eliminate RSI index finger fatigue from spam clicking, the game must be fully operable via keyboard:

| Key Binding | Primary Action | Target Panel |
| :--- | :--- | :--- |
| **`[SPACEBAR]`** or **`[ENTER]`** | Slam Stamp / Sign Directive | Center Desk |
| **`[1]`, `[2]`, `[3]`** | Switch Left Telemetry Channels (Stocks, S.L.O.P., PolyGrift) | Left Wing |
| **`[B]`** | Switch Right Expansion Channel to the **Brief** (Situation Room; never sealed) | Right Wing |
| **`[D]`** | Switch Right Expansion Channel to **D.U.M.P.** | Right Wing |
| **`[U]`** | Switch Right Expansion Channel to **Crony Unlocks** (Upgrade Tree) | Right Wing |
| **`[T]`** | Switch Right Expansion Channel to **Bilateral Tariffs** | Right Wing |
| **`[C]`** | Switch Right Expansion Channel to **Caymans Prestige** | Right Wing |

**INVARIANT: [The Seal Is a Promise, Not a Wall]**
Every channel key above fires **regardless of unlock state**, and every channel is always present in its tab strip. A channel that is not yet open renders a **sealed dossier** — `SealedDossier` — naming the single event that opens it (`constants/tabDemands.ts`) plus a teaser of what is behind the door, with a progress bar only where the gate is a number the player can watch.

Selection is free; **action is not**. A sealed channel must never mount its real body, so the hotkey reaches a demand card and never a purchase, liquidation, tariff move, or prestige reset. The gate lives in the pane render branch, NOT in `setActiveLeftTab`/`setActiveRightTab`.

Do not reintroduce filtering a channel out of the strip. That is what made the four systems the game is named for invisible and unnameable — they appeared only as lines in a Career Objectives list, with no affordance of any kind. Sealed keys stay listed in the footer dock, dimmed: a key that is not listed is a key that does not exist.
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
2. **Hover Context — [No Element On Screen May Be Unhoverable]:**
   - Every operable element (native control, or anything with an `onClick`) must spread `{...hint('...')}` from `components/ui/HintTooltip`. Enforced by `npm run hover:check` at budget 0, inside `npm run build`.
   - A hint explains **mechanism and stakes**, never a restatement of the visible label. "Lock in the current result and close this position", not "Click SETTLE".
   - Pass the second argument — the accessible name — only when the visible text is cryptic or absent (`100x`, `$1k`, `+25%`, an icon-only button). A `title` alone is not an accessible name and does not appear on touch, so it is never sufficient.
   - Do **not** wrap controls in a tooltip element to get hover context. `HintLayer` is a single delegated listener on `[data-hint]`; a wrapper becomes the flex item instead of the button and will silently reflow the cockpit.
   - Do **not** use the native `disabled` attribute on a control whose hover explains *why* it is unavailable. Chromium swallows pointer events on a disabled button, so the context would vanish exactly when it is needed. Use `aria-disabled` plus a handler guard.
3. **Oligarch Lobbying Upgrade Shop (`[U]` Tab):**
   - Upgrades must provide clear mechanical multipliers (Click Yield, Autopen taps/sec, Tantrum build rate, 0DTE payout multipliers, Broad Daylight Money Printer).
   - Purchased upgrades must disable their buy button, indicate acquired status, and save permanently to local storage.
4. **Progressive Disclosure:**
   - Phase 1 (Gate 99B, The Deeply Terminal Annex): BagHolder Pro and the YAP unlock on the **first slam** (previously a $\$10{,}000$ cash threshold, removed — the core loop must be reachable in the first ten seconds). Individual channels inside each wing still gate on upgrades.
   - Phase 2 (Oval Syndicate): Left wing boots BagHolder Pro's full tab set.
   - Phase 3 (Fortress America): Right wing unlocks D.U.M.P. and the full Crony Tech Tree.
