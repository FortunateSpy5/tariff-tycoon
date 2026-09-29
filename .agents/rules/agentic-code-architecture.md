# Agentic Code Architecture & Antigravity Workflow Standards

These rules enforce strict file-size limits, modular boundaries, commenting guidelines, and state architecture to optimize for AI agent precision, context efficiency, and zero build regressions.

---

## 1. File Size Ceilings & Modularity Rules

1. **Target File Size:** $\le 200\text{--}250$ lines of code.
2. **Hard File Ceiling:** **400 lines max**. No file in `src/` may exceed 400 lines.
3. **Proactive Decomposition:** If an edit pushes a file beyond 300 lines, immediately extract sub-components, helper utilities, or state slices.
4. **Context Budget Protection:**
   - AI agent tools (`view_file`, `replace_file_content`) degrade in speed and accuracy on files $>400$ lines.
   - Keeping files small ensures deterministic, bug-free block replacements and avoids token exhaustion.
5. **No Monolithic "God Files":**
   - ❌ Never create a single 1,000-line `gameStore.ts` or `App.tsx`.
   - ✅ Always use Zustand's slice pattern (`store/slices/`).
   - ✅ Keep `App.tsx` strictly as a lightweight layout coordinator ($\le 120$ lines).

---

## 2. Directory Layout & Separation of Concerns

```
src/
├── types/              # Pure TypeScript types & discriminated unions (NO runtime logic)
├── constants/          # Static parody rosters, tickers, and balance baseline constants
├── engine/             # Headless business & math logic (100% testable without DOM/React)
│   ├── math/           # Pure KaTeX-annotated formulas (break_infinity, leverage, prestige)
│   └── systems/        # Procedural YAP generator, causal market volatility, offline engine
├── store/              # Zustand state divided into domain slices
│   ├── slices/         # 9 slices: desk, trading, settlement, prediction, crisis,
│   │                   #   deskProps, dump, prestige, settings
│   └── useGameStore.ts # Root unified store with persistent storage and offline sync
├── audio/              # Procedural Web Audio API sound synthesis (zero MP3/WAV assets)
├── components/         # Granular React components grouped by functional domain
│   ├── desk/           # Oval Office stamp/Sharpie, blotter, ExecutiveGauges, FeedbackLayer
│   ├── terminal/       # BagHolder Pro ticker, 1000x Put/Call options, lethal YAP modal
│   ├── dump/           # Agency liquidation drawer, SituationRoom, comedic hazards banner
│   ├── share/          # Decree certificate PNG renderer, prestige run summary
│   ├── onboarding/     # Classified tutorial directives
│   ├── ticker/         # Breaking news crawl
│   ├── dialogs/        # Bailout modal, Cayman prestige modal, settings
│   └── ui/             # Card, PaneShell, TabStrip, StatusStrip, DossierHeader
└── hooks/              # Custom hooks (game loop, viewport scale, hotkeys)
```

### Automatic Enforcement (do not rely on memory)
Three gates run inside `npm run build` and **fail the build**:
* `npm run theme:check` — `scripts/check-theme-coverage.mjs`, budget **0**.
* `npm run hover:check` — `scripts/check-hover-coverage.mjs`, budget **0**.
* `npm run size:check` — `scripts/check-file-sizes.mjs`, 400-line hard ceiling.

Run them locally before claiming an invariant holds. If a check is inconvenient,
that is a signal the check itself is wrong — fix the check, don't raise the budget.

### No Barrel Files
Import from the concrete module (`../ui/Card`, `../../constants/balance`), never
from a directory. Nine unused barrels accumulated during the UI redesign because
a barrel costs nothing until someone imports it and it silently goes stale — one
of them listed 5 store slices long after the store had 9.

---

## 3. Commenting & Documentation Conventions

### ❌ NEVER WRITE:
- Obvious prose that merely restates the code (e.g. `// increment count by 1`, `// return the value`).
- Massive narrative essay comments explaining standard JavaScript syntax.

### ✅ ALWAYS WRITE:
1. **Mathematical KaTeX Annotations:** Every formula in `src/engine/math/` must cite its corresponding formula from `GAME_DESIGN_DOCUMENT.md`:
   ```typescript
   /**
    * Computes ink refill cost scaling.
    * GDD Formula: Cost = Base * 1.15^n
    * KaTeX: C(n) = C_0 \times 1.15^n
    */
   ```
2. **Invariant & Safety Docstrings:** Explicitly tag functions enforcing idle or legal boundaries:
   ```typescript
   /**
    * INVARIANT: [The Palm-a-Grifto Golf Protocol]
    * Freezes VEX volatility, S.L.O.P. suspicion, and active margin calls while offline.
    * Caps passive offline treasury calculations to 48 hours max.
    */
   ```
3. **Type-Driven Self-Documentation:** Use strictly typed discriminated unions and descriptive property names instead of relying on comments to clarify ambiguities.

---

## 4. Barrel Exports & Import Hygiene

1. **No `index.ts` barrels** (this reverses the previous rule). Import from the concrete
   module — `../ui/Card`, `../../constants/balance` — never from a directory. Barrels
   cost nothing until something imports them, and then they go silently stale.
2. Avoid circular dependencies between slices and engines:
   - `types/` imports from nothing.
   - `engine/` imports only from `types/` and `constants/`.
   - `store/` imports from `types/`, `constants/`, and `engine/`.
   - `components/` consume `store/` and `types/`.

---

## 5. Verification Protocol

- Before declaring any task complete or committing code:
  1. Run `npm run build` locally. Zero TypeScript or Vite bundling errors permitted.
     This also runs `theme:check`, `hover:check` and `size:check`, so a clean
     build means all three gates passed.
  2. Verify that no modified or created file exceeds 400 lines.
  3. Update any documentation the change made false. A stale doc is a defect:
     if you delete a feature, grep the `*.md` tree for its name and fix every hit.
