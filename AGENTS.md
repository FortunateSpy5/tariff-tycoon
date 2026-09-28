# Executive Degen: Short the World — Machine-Readable Agent Guidelines (`AGENTS.md`)

Welcome, AI Agent. This repository powers **EXECUTIVE DEGEN: SHORT THE WORLD** (*The Art of the 3:00 AM Tariff*), an unhinged, satirical macroeconomic incremental game of presidential executive orders, causal market shorting, and financialized nihilism.

---

## 1. Core Principles & Boundaries

### ALWAYS:
- **Enforce 100% Legally Bulletproof Parody:**
  - Never use real-world living politician names, official government agency seals, or actual trademarked corporate brands.
  - Always use the canonical parody roster: *"The Dealmaker-in-Chief"*, **`YAP`**, **`BagHolder Pro`**, **`D.U.M.P.`**, *The Great Northern Annex*, *The Nearshore Federation*, *The Strike Republic*, *Overthinker Union*, *The Red Factory*, *Silicon Archipelago*, *Fruit Ecosystem Inc.*, *GigaFlex Motors*, *DoorPlug Dynamics*.
  - Maintain First Amendment parody and caricature protection (*Hustler v. Falwell*, *Campbell v. Acuff-Rose*).
- **Honor the Idle Game Invariants (The Golden Rule of Idle Economy):**
  - **The Palm-a-Grifto Golf Protocol (Offline Safety Guarantee):** Offline time must *never* ruin an active setup or punish the player. Volatility, margin-call timers, and unrest are frozen/decayed while offline; passive treasury revenue collects safely for up to 48 hours.
  - **Zero Soft-Locks:** The manual click ("Executive Action / Tweet") always has a guaranteed cash floor ($ \ge \$1.00 $ or $ \text{SIS} \times \$1,000 $). If a player loses 100% of their net worth on a bad option trade, the "Too Big to Fail" bailout safety net triggers automatically.
  - **Causal Market Volatility:** Stock crashes must be causally triggered by player YAPs and tariffs, never purely passive background RNG.
- **Maintain Tactile & Visceral Juice:**
  - All clicker interactions must feature kinesthetic weight: screen recoil, procedural Sharpie ink squeaks, paper blotter physics, ink splatters, and dynamic UI state changes (e.g. CAPS LOCK FRENZY red borders).
- **Adhere to the 4-Phase Evolutionary Arc:**
  - Phase 1: *The Customs Desk* ($0 to $1M).
  - Phase 2: *The Oval Syndicate* ($1M to $100B).
  - Phase 3: *Fortress America* ($100B to $10^{18}$).
  - Phase 4: *Ontological Protectionism* ($10^{18} \to 10^{42}$ — Taxing the Sun, the Future, and the 2nd Law of Thermodynamics).
- **Enforce Agentic Code Architecture & Limits:**
  - Standard files target $\le 250$ lines; hard ceiling of $400$ lines per file. **Enforced by `npm run size:check`, which runs inside `npm run build`.**
  - Zero monolithic god-files. Zustand store must use the slice pattern (`src/store/slices/`).
  - Headless mathematical logic must reside in `src/engine/` and include KaTeX formula citations matching `GAME_DESIGN_DOCUMENT.md`.
  - Invariant safety functions must include explicit docstrings.
  - **No `index.ts` barrels.** Import the concrete module. Barrels go silently stale.
  - **Enforce the theme, don't just intend it.** `npm run theme:check` runs inside `npm run build` with a budget of 0: no player-facing `bg-stone-*` surface without a themed material or an inline `theme-allow` marker. The region→material table is in `.agents/workflows/UI_REDESIGN_PLAN.md`.
- **Keep Documentation Honest:**
  - A stale doc is a defect. If you change or delete behaviour, grep the `*.md` tree for the old claim and fix every hit — GDD, README, knowledge base, audit report, and rules files all drift independently.
  - Do not document a feature that does not exist. Label it roadmap instead.
- **Verify Clean Builds Locally:**
  - Verify zero TypeScript/build errors before marking any feature complete. A clean `npm run build` also means both invariant gates passed.

### ASK FIRST:
- **Altering Core Compounding Exponents:** Always consult before modifying the scaling exponents for prestige formulas ($0.18\text{--}0.38$), refill costs ($1.15^n$), or the option volatility multipliers.
- **Major UI Restructuring:** Consult before altering the dual-pane layout (Oval Office Desk / Resolute Blotter on top, BagHolder Pro under the desk).

### NEVER:
- **DO NOT use real-world political names or brand trademarks.**
- **DO NOT create punishing offline death spirals** (e.g. debt wiping player cash to negative infinity while tab is closed).
- **DO NOT push to Git or remote repositories by default.** Only run `git push` when the user explicitly commands it.
- **DO NOT write toothless, dated "late-night TV" humor.** Keep satire focused on modern financial degen trading, algorithmic mania, and institutional absurdity.

---

## 2. Tech Stack & Planned Framework

- **Engine/Frontend:** React 19 + TypeScript + Vite
- **Styling & UI:** Tailwind CSS v4 + Lucide Icons + Canvas/Framer Motion physics
- **Audio Synthesis:** Web Audio API procedural synthesis (marker squeaks, screen thuds, cash chimes, soundboard vine-booms)
- **State Architecture:** Zustand with persistent local storage & automated offline delta calculation
- **Export Pipeline:** HTML Canvas / WebCodecs 9:16 vertical MP4 generator for TikTok/X C-SNOOZE Senate hearing clips

---

## 3. Progressive Disclosure & Knowledge Base

For specialized guidelines and detailed mechanics, consult:
- **Master Game Design Document:** [GAME_DESIGN_DOCUMENT.md](GAME_DESIGN_DOCUMENT.md)
- **UI Design Specification:** [UI_DESIGN_SPECIFICATION.md](UI_DESIGN_SPECIFICATION.md)
- **Desktop UI & Layout Invariants:** [.agents/rules/desktop-ui-and-layout-invariants.md](.agents/rules/desktop-ui-and-layout-invariants.md)
- **Project Knowledge Base:** [.agents/PROJECT_KNOWLEDGE_BASE.md](.agents/PROJECT_KNOWLEDGE_BASE.md)
- **Legal & Parody Rules:** [.agents/rules/legal-compliance-and-parody.md](.agents/rules/legal-compliance-and-parody.md)
- **Incremental Design Invariants:** [.agents/rules/incremental-gameplay-invariants.md](.agents/rules/incremental-gameplay-invariants.md)
- **Agentic Code Architecture:** [.agents/rules/agentic-code-architecture.md](.agents/rules/agentic-code-architecture.md)
- **Satirical Voice & Tone:** [.agents/rules/satirical-voice-and-tone.md](.agents/rules/satirical-voice-and-tone.md)
- **Feature Roadmap & SOP:** [.agents/workflows/FEATURE_ROADMAP.md](.agents/workflows/FEATURE_ROADMAP.md)
- **Codebase Audit Report:** [.agents/AUDIT_REPORT.md](.agents/AUDIT_REPORT.md)

---

## 4. Workspace Skills (`.agents/skills/`)

- `procedural-yap-generator` — Generates infinite, legally safe 3:00 AM YAPs, typos, and fake comment swarms.
- `options-trading-math` — Formulas and balance tools for BagHolder Pro leverage, VEX volatility, and S.L.O.P. suspicion.
- `viral-clip-director` — Architecture and asset pipeline for the 9:16 vertical C-SNOOZE / brainrot clip generator.
- `balance-audit` — Dead faucets, degenerate strategies, unreachable gates, and doc↔constant drift. Run before changing any tuning value.
- `soak-test` — Extended-play windows: uptime leaks, tick drift, the 48h offline wall, prestige loops, and overflow past $10^{42}$.

Skills in `.agents/skills/` are the single source of truth. Agent-specific
symlinks (`.claude/skills/`) are generated and gitignored — never edit or commit
them. `skills-lock.json` records upstream provenance for the vendored skills.

**YAML frontmatter must be quoted.** An unquoted `:` in a `description:` (e.g.
`3:00 AM`) makes the file unparseable and the skill silently fails to load.
