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
│   ├── slices/         # deskSlice, tradingSlice, dumpSlice, prestigeSlice, settingsSlice
│   └── useGameStore.ts # Root unified store with persistent storage and offline sync
├── audio/              # Procedural Web Audio API sound synthesis (zero MP3/WAV assets)
├── components/         # Granular React components grouped by functional domain
│   ├── desk/           # Oval Office stamp/Sharpie, blotter, ink stamina, tantrum meter
│   ├── terminal/       # BagHolder Pro ticker, 1000x Put/Call options, lethal YAP modal
│   ├── dump/           # Agency liquidation drawer, comedic hazards banner
│   ├── ticker/         # Breaking news crawl
│   ├── dialogs/        # Bailout modal, Cayman prestige modal, settings
│   └── common/         # Atomic UI primitives (Button, Badge, ProgressBar)
└── hooks/              # Custom hooks (game loop, screen shake, audio trigger bridges)
```

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
    * Freezes VIX volatility, SEC suspicion, and active margin calls while offline.
    * Caps passive offline treasury calculations to 48 hours max.
    */
   ```
3. **Type-Driven Self-Documentation:** Use strictly typed discriminated unions and descriptive property names instead of relying on comments to clarify ambiguities.

---

## 4. Barrel Exports & Import Hygiene

1. Each subdirectory under `src/` (`types/`, `constants/`, `components/*`) must maintain a clean `index.ts` barrel file when containing $\ge 3$ exports.
2. Avoid circular dependencies between slices and engines:
   - `types/` imports from nothing.
   - `engine/` imports only from `types/` and `constants/`.
   - `store/` imports from `types/`, `constants/`, and `engine/`.
   - `components/` consume `store/` and `types/`.

---

## 5. Verification Protocol

- Before declaring any task complete or committing code:
  1. Run `npm run build` locally. Zero TypeScript or Vite bundling errors permitted.
  2. Verify that no modified or created file exceeds 400 lines.
