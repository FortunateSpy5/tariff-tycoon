# Project Knowledge Base: Executive Degen

This repository houses **EXECUTIVE DEGEN: SHORT THE WORLD** (*The Art of the 3:00 AM Tariff*).

---

## Architecture & System Overview

```
                                  [ GAME ENGINE ]
                                         │
     ┌───────────────────────┬───────────┴───────────┬───────────────────────┐
     ▼                       ▼                       ▼                       ▼
[ DESK CLICKER ]     [ BAGHOLDER PRO ]       [ D.U.M.P. AUSTERITY ]  [ PRESTIGE MATRIX ]
Rubber Stamp (P1)     Options Terminal        Agency Scraping         Caymans (SIS)
Sharpie Squeak (P2)   Procedural YAPs         Disaster Capitalism     America LLC (ED)
CAPS LOCK Frenzy      S.L.O.P. Suspicion      Inflation Heat          Ontological ($10^42)
```

---

## Canonical Parody Dictionary
* **Protagonist:** The Dealmaker-in-Chief
* **Social Media:** `YAP` ([LAUNCH LETHAL YAP])
* **Brokerage:** `BagHolder Pro`
* **Prediction Terminal:** `PolyGrift`
* **Hatchet Agency:** `D.U.M.P.` (Department of Unilateral Market Pruning) / `C.H.O.P.`
* **Benchmark Index:** The S&Pain 500 (`$PAIN`)
* **Parodied Sovereign Nations:**
  - Canada $\to$ *The Great Northern Annex* *(Snowcumbia)*
  - Mexico $\to$ *The Nearshore Federation*
  - France $\to$ *The Strike Republic*
  - Germany $\to$ *Overthinker Union* *(Das Rustbelt)*
  - China $\to$ *The Red Factory* *(BargainDrop Prime)*
  - Taiwan $\to$ *Silicon Archipelago*
  - Greenland $\to$ *Future State #52*
  - Switzerland $\to$ *The Secrecy Haven*
* **Parodied Stocks:**
  - `$FRUT` (Fruit Ecosystem Inc. — $1,999 Titanium Rectangles)
  - `$GIGA` (GigaFlex Motors — CEO shitpost wedge-trucks)
  - `$DOOR` (DoorPlug Dynamics — commercial jets held together by prayer)
  - `$MICR` (MicroSoftness Cloud — mandatory hospital AI updates)
  - `$GUAC` (GuacSurcharge Grill — lukewarm carnitas & scale protests)
  - `$MSIL` (MicroSilicon Foundry — Leather-Jacket Larry)
  - `$LMBR` (Great Northern Maple Slurry & Timber)
  - `$AVOC` (Nearshore Precision Avocados)

---

## The 4 Evolutionary Phases
* BagHolder Pro stocks/options and YAP unlock on the **first slam** during Phase 1 (previously a $10K cash threshold — see `.agents/workflows/UI_REDESIGN_PLAN.md`). First YAP reveals S.L.O.P.; settling a YAP-targeted PUT reveals PolyGrift.
* Phase 2 at $1,000,000 reveals D.U.M.P.; liquidation reveals Crony upgrades; the first upgrade reveals tariff controls; changing a tariff reveals Caymans prestige.
1. **Phase 1: The Customs Desk ($0 to $1M):** Airport confiscation arbitrage at Gate 99B Liberty International.
2. **Phase 2: The Oval Syndicate ($1M to $100B):** Front-running markets with 3:00 AM YAPs on BagHolder Pro.
3. **Phase 3: Fortress America ($100B to $10^18):** Naval container auctions & domestic drywall substitution.
4. **Phase 4: Ontological Protectionism ($10^{18} \to 10^{42}$):** 45% solar photon duty on the Sun, taxing future knowledge, nullifying the 2nd Law of Thermodynamics.

---

## Agentic Code Architecture & Directory Map

To optimize for AI context precision, deterministic edits, and clean builds, the codebase strictly adheres to modular domain slices and small file ceilings ($\le 250$ lines target, 400 lines hard ceiling).

```
src/
├── types/              # Pure TypeScript discriminated unions & domain interfaces (NO runtime logic)
│   ├── desk.ts         # Stamp, Sharpie, Ink, Stamina, Tantrum meter
│   ├── market.ts       # Stocks, 1000x Put/Call Options, VEX volatility, S.L.O.P. suspicion
│   ├── nations.ts      # Parodied nations & multi-tier begging tiers
│   ├── yap.ts          # Procedural post types (backs the decree certificate)
│   ├── dump.ts         # Agency liquidation cards, perks, comedic hazards
│   ├── prestige.ts     # SIS, Sovereign Decrees, Ontological currencies
│   ├── unlocks.ts      # Progressive-disclosure access flags
│   └── store.ts        # Slice composition contracts (DeskSlice, TradingSlice, ...)
├── constants/          # Parodied tickers, country profiles, baseline balance numbers
│   ├── balance.ts      # The tuning surface. ASK FIRST before changing exponents.
│   ├── crisis.ts       # Red-Phone crisis book, tiers, cooldowns
│   └── onboarding.ts   # Tutorial directive chain + career objectives
├── engine/             # Headless mathematical & causal engines (100% testable without DOM)
│   ├── math/           # Pure formulas with KaTeX annotations (break_infinity, leverage, SIS)
│   └── systems/        # One concern per file, each pure + independently testable:
│                       #   marketEngine, settlementEngine, yapShockEngine, slopEngine,
│                       #   crisisEngine, inkFrenzyEngine, passiveEngine, phaseEngine,
│                       #   tariffEngine, unlockEngine, onboardingEngine
├── store/              # Zustand state divided into slice architecture
│   ├── slices/         # 9 slices: desk, trading, settlement, prediction, crisis,
│   │                   #   deskProps, dump, prestige, settings
│   └── useGameStore.ts # Root unified store with persistent localStorage
├── audio/              # Procedural Web Audio API sound synthesis (zero audio asset bloat)
│   ├── soundEngine.ts  # Master AudioContext & gain buses
│   └── synths/         # procedural sharpie squeak, desk thud, cha-ching chimes
├── components/         # Granular React components grouped by functional domain
│   ├── desk/           # Rubber Stamp, Golden Sharpie, Blotter, ExecutiveGauges, FeedbackLayer
│   ├── terminal/       # BagHolder Pro ticker, chart, options launcher, lethal YAP modal
│   ├── dump/           # D.U.M.P. agency liquidation drawer, hazard ticker, SituationRoom
│   ├── share/          # Decree certificate PNG renderer + prestige run summary
│   ├── onboarding/     # Classified tutorial directives
│   ├── ticker/         # Satirical breaking news crawl (newsprint rail)
│   ├── dialogs/        # Too Big To Fail bailout, Cayman prestige, settings
│   └── ui/             # Card, PaneShell, TabStrip, StatusStrip, DossierHeader
└── hooks/              # Custom hooks (game loop, viewport scale, hotkeys)
```

### Enforced Invariants (checked in CI, not by memory)
Two gates run inside `npm run build` and will **fail the build**:
* `npm run theme:check` — `scripts/check-theme-coverage.mjs`, budget **0**. No player-facing
  `bg-stone-*` surface may appear without a themed material or an inline `theme-allow` marker.
  "The theme is done" is a number, not an opinion.
* `npm run size:check` — `scripts/check-file-sizes.mjs`, **400-line hard ceiling**
  (250-line target). A slice that outgrows the ceiling must be split on a *domain*
  boundary, not by golfing comments.

The region→material table lives in `.agents/workflows/UI_REDESIGN_PLAN.md`. Briefly:
app root is desk wood, the centre desk is parchment, pane frames are classified
black, cards on the desk are paper sheets, terminal interiors stay phosphor CRT.

### Commenting & Invariant Protocols:
- **KaTeX Formula Citations:** Every formula in `src/engine/math/` must cite its corresponding GDD equation (e.g. `// KaTeX: P(t) = P_0 \times (1 - \Delta_{yap})`).
- **Safety Invariant Docstrings:** Flag offline boundaries (`// INVARIANT: [The Palm-a-Grifto Golf Protocol]`) and bankruptcy protections (`// INVARIANT: [Bankruptcy Floor]`).
- **No Redundant Comments:** Code should be self-documenting through strict types and clear naming.

