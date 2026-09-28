# Feature Roadmap & Implementation Phases

This document outlines the development phases for **EXECUTIVE DEGEN: SHORT THE WORLD**.

> ⚠️ **Status note:** Phase 1 & 2 are marked complete below, but a full code audit (see [`.agents/AUDIT_REPORT.md`](../AUDIT_REPORT.md)) found doc↔code drift, an economy dead-end (Crony Favor has no faucet), and several cosmetic-only systems. Treat the checkmarks as "shipped in some form," not "matches spec."
>
> **Sprint 2.5 — UI Redesign (2026-09-29, shipped).** Onboarding was rebuilt around the
> game's actual subject: the $10,000 cash gate is gone (market + YAP unlock on the first
> slam), plus 3 risk-free paper trades, a 5-step directive tutorial, a newsprint/classified/
> phosphor material system, and a 1080×1920 decree certificate. Full plan and measurements:
> [`.agents/workflows/UI_REDESIGN_PLAN.md`](UI_REDESIGN_PLAN.md). Sprint 3 pacing may need
> re-tuning as a result, since Phase 2 is now reachable far sooner.

---

## Phase 1: The Core Clicker & Tactile Blotter (Sprint 1)
- [x] **Canvas / DOM Executive Blotter:** Leather desk surface, parchment Executive Order, and Golden Sharpie cursor/stamp.
- [x] **Squeak & Audio Physics:** Procedural pitch-shifting squeak SFX, screen recoil, and ink particle splatter.
- [x] **Stamina & Refill Engine:** Ink meter (100 units), depletion rate, and exponential refill cost button ($25 \times 1.15^n$).
- [x] **Tantrum Meter & CAPS LOCK FRENZY:** Rhythmic click detection, 10x multiplier mode, and post-frenzy slump.

---

## Phase 2: The Hybrid Resolute Cockpit & 0DTE Options Suite (Sprint 2)
- [x] **Zero-Scroll Viewport Shell:** Hard-lock `100dvh` CSS Grid shell with sub-1080p responsive scaling (`useDesktopViewport`) and 48px unified header HUD.
- [x] **Center Stage Tactile Desk Props:** Red Rotary Phone (bailout), Gold Box (secret cash), Subpoena Shredder (heat purge QTE with 3s cooldown), Broad Daylight Money Printer.
- [x] **Left Wing Telemetry Console (Tabs 1-3):** BagHolder Pro 0DTE options ladder (all 9 stocks with early settlement), live candlestick chart, PolyGrift prediction bets, S.L.O.P. radar.
- [x] **Right Wing Expansion Deck (Tabs D/U/T/C):** D.U.M.P. sequential agency guillotine, Crony Unlocks (Oligarch Tech Tree with Dark Pool Fiber 1.5x payout), Bilateral Tariffs with dynamic begging tiers, Caymans prestige ($1M Tier 1).
- [x] **Procedural YAP & Straddle Squeeze:** 7-stage Mad-Libs tweet engine with 8-second Walk-Back Clarification pump button (+35%).
- [x] **Desktop Keyboard Ergonomics:** Global hotkey bindings (`Space`, `1-3`, `D/U/T/C`, `Y`, `W`, `S`, `F`) with zero re-render churn.
- [x] **Multi-Subagent Audit Remediations:** Legal parody safety verified, ghost upgrades wired, sequential liquidation gates added, Zustand persistence enforced.

---

## Phase 3: The D.U.M.P. Liquidation Tree & Macro Chaos (Sprint 3)
- [ ] **D.U.M.P. Chainsaw Engine:** 10 federal agencies to scrap with instant cash payouts and active comedic hazards.
- [ ] **Oligarch Lobbying Tech Tree:** Permanent unlockable perks (Tungsten Nib, AI Autopen, Diet Soda Drip, Dark Pool Fiber).
- [ ] **Inflation Heat & Civil Unrest Loop:** Active friction balancing with stimulus checks and military flyover distractions.
- [ ] **The Palm-a-Grifto Golf Protocol:** Offline state persistence and freeze invariants.

---

## Phase 4: Multi-Tier Prestige & Ontological Singularity (Sprint 4)
- [ ] **Tier 1 Prestige (Flight to the Caymans):** Sovereign Immunity Slips currency, offshore shell company perk tree.
- [ ] **Tier 2 Prestige (America LLC):** Corporate charter rebrand, Executive Decrees, full automation of Tiers 0/1.
- [ ] **Phase 4 Ontological Tariffs:** Scientific notation ($10^{18} \to 10^{42}$), taxing the Sun's photons, taxing the Future, nullifying the 2nd Law of Thermodynamics.
- [ ] **The Cosmic Ending:** Universal Chapter 7 bankruptcy sequence.

---

## Phase 5: Viral Distribution & Streamer Mode (Sprint 5)
- [x] **The 9:16 Decree Certificate:** 1080×1920 PNG with wax seal, classification banner,
  redaction bar and portfolio-at-risk. The same renderer draws the prestige run summary,
  captured before the reset wipes the run. *(This is the shippable half of the vision below.)*
- [ ] **The 9:16 Vertical Senate Hearing Clip Generator:** Split-screen C-SNOOZE / brainrot
  MP4 renderer. The `viral-clip-director` skill documents the WebCodecs pipeline; **none of
  it is implemented.** `README.md` previously advertised a `[LEAK TO C-SNOOZE]` button that
  does not exist — that claim was removed on 2026-09-29.
- [ ] **Twitch/Kick Live Integration:** Chat polling, `!YAP` tantrum meter, and bit pardon
  auctions. **Not implemented**; a dead `streamerMode` store field was removed on 2026-09-29.
