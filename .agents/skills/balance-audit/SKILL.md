---
name: balance-audit
description: "Audit the incremental economy of Executive Degen for dead faucets, degenerate strategies, unreachable prestige thresholds, and doc-to-constant drift. Use when asked to 'check game balance', 'audit the economy', 'is this system reachable', or before changing any tuning constant."
---

# Balance Audit Skill

Finds balance defects in **EXECUTIVE DEGEN: SHORT THE WORLD** before they reach players.
The economy is the game; a dead faucet or a dominant strategy is a shipped bug, not a taste call.

---

## 0. The Standing Verdict Rule

**If the inputs you need are absent, the answer is `NOT ASSESSED — NO DATA`, not a
guess and not a clean pass.** Record `FOUND` or `ABSENT` for every input before
concluding anything. A grep that returns nothing because the symbol was renamed
has verified nothing. Say which of the two happened.

This project ships with zero automated tests, so every number here comes from
reading code. Never present an inferred value as a measured one.

---

## 1. Read the Single Source of Truth First

Always read `src/constants/balance.ts` before any design document. It is the
authority for clicker, frenzy, ink, shock, and Crony Favor tuning. Both the
engine and the UI meters import from it, so a value that lives *only* in
`balance.ts` is wired correctly; a value hardcoded at a call site is a
desync waiting to happen.

Then read, in this order:
- `GAME_DESIGN_DOCUMENT.md` — intended values and phase arc
- `AGENTS.md` — the exponents that require **ASK FIRST** before changing
- `.agents/skills/options-trading-math/SKILL.md` — the arcade options model
- `.agents/AUDIT_REPORT.md` §2–§3 — prior findings, many since fixed

---

## 2. The Five Checks

### 2.1 Faucet/Sink Symmetry
**Every currency needs at least one faucet and at least one sink.** A currency
with sinks but no faucet is a dead end; the player permanently loses access to
content and the game silently deletes itself. This is the single most damaging
class of defect in an incremental game, and it once shipped here (Crony Favor).

For each currency, enumerate every `+` and `−` site by grepping the store slices:

| Currency | Faucets | Sinks | Verdict |
|----------|---------|-------|---------|
| Cash | | | |
| 🤝 Crony Favor | | | |
| Ink | | | |
| Tantrum | | | |
| S.L.O.P. heat | | | |
| VEX | | | |

Include indirect faucets (passive ticks, liquidation kickbacks) and note their
**rate**, not just their existence. A faucet of 0.05/s against a sink of 50 is
a faucet in name only — compute the time-to-first-affordable-purchase.

### 2.2 Degenerate Strategies
For every player choice, ask whether a *strictly better* alternative exists.
Idle economies collapse when one option dominates. Check specifically:
- Does the cheap option ever beat the expensive one? If so the expensive one
  is dead content and should be removed, not rebalanced.
- Is the panic button ever the *optimal* play? (See the Venting invariant in
  `balance.ts` — venting must never out-earn riding the meter to 100%.)
- Do multiplier upgrades stack multiplicatively into runaway infinity?
- Does shotgun mode strictly dominate selected-target mode at equal cost?

### 2.3 Reachability
Prove the content gates are actually passable, with arithmetic:
- Prestige: `SIS = floor((L/10^10)^0.32 + 3×(P/10^9)^0.38)`. What lifetime cash
  does a competent first run reach, and is the $10^10 threshold inside it?
- Phase gates: what does a player hold at each phase transition?
- D.U.M.P. tree: the cheapest agency costs 25 🤝. How long to first 25?
- Any gate above the reachable ceiling is a dead phase.

### 2.4 Doc ↔ Constant Drift
Grep every tuning number across the `*.md` tree and compare to `balance.ts`.
This is a **known-active** failure class in this repo — the in-code KaTeX
annotations and the docs drift independently. Verify at minimum:
- Frenzy duration, ink per click, tantrum per click
- Ink refill base **and growth exponent** (see §3)
- Crash severity cap, VEX baseline/cap/decay
- Prestige divisors, exponents, and threshold

The rule: the value the *player sees* and the value the *engine runs* must come
from the same constant. A hand-typed number in a `.tsx` label is a defect even
when it is currently correct.

### 2.5 Invariant Honesty
`balance.ts` and the engine modules carry `INVARIANT: [Name]` docstrings. Each
one is a promise. Spot-check that the code still honors it — especially:
- `[Ink Fuels Frenzy]` — dry nibs must build zero tantrum
- `[Venting Must Never Be Optimal]`
- `[Ink Is A Cost Center]`
- `[The Cooling-Off Protocol]` — without it, frenzy uptime approaches 100%

An `INVARIANT:` comment describing behavior the code no longer has is worse than
no comment, because the next agent trusts it.

---

## 3. Known Drift — Verify First, Fix Last

> These were live at the time of writing. **Re-verify; do not assume.**

- **Ink refill growth exponent.** `INK_REFILL_COST_GROWTH` is `1.35`, but the
  KaTeX annotation in `formulas.ts` still reads `C(n) = \min(25 \times 1.15^n,
  25000)` and `AGENTS.md` still lists `$1.15^n` under **ASK FIRST**. Three files,
  one number, two of them wrong. The exponent is an ASK-FIRST value — raise it
  before changing it.
- **`MAX_OFFLINE_SECONDS` is a local `const`** inside
  `calculateOfflineEarnings`, not in `balance.ts`. The 48h cap is an idle-game
  invariant (AGENTS.md, *Palm-a-Grifto Golf Protocol*) and it should not be
  reachable only by reading a function body.
- **Prestige formula was rewritten** from `floor((netWorth/10^6)^0.33)` to the
  GDD two-term form. Confirm the GDD, the constant, and the
  `CaymansPrestigeTab` label all agree before trusting any of them.

---

## 4. Report Format

```
## Balance Audit: [System]

### Inputs
| Input | Status |
|-------|--------|
| src/constants/balance.ts | FOUND |

### Verdict: [NOT ASSESSED / HEALTHY / CONCERNS / CRITICAL]

### Dead Ends
| Currency | Sinks with no faucet | Severity |

### Degenerate Strategies
- [choice] — [why it strictly dominates] — [fix or delete]

### Reachability Arithmetic
| Gate | Threshold | Reachable at | Verdict |

### Doc ↔ Constant Drift
| Value | balance.ts | GDD | AGENTS.md | UI label |

### Invariants Broken
| INVARIANT | Promised | Actual |

### Recommendations
| Priority | Issue | Fix | Impact |
```

Rank by player harm, not by effort. A dead faucet outranks a mis-tuned exponent
every time.

---

## 5. After Any Fix

1. Update `balance.ts` first — never a call site.
2. Grep the whole `*.md` tree plus every `.tsx` label for the old value.
3. Update the KaTeX annotation in the same edit.
4. Run `npm run build`. Both gates (`theme:check`, `size:check`) must pass.
5. State plainly what you verified and what you did not.
