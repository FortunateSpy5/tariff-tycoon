# Incremental Gameplay Invariants & Idle Design Rules

These rules govern the mathematical balance, progression architecture, and player retention mechanics in **EXECUTIVE DEGEN: SHORT THE WORLD**.

---

## 1. The Offline Invariant: "The Palm-a-Grifto Golf Protocol"
* **The Rule:** An incremental game must **never punish absence**. Returning to the game after 8 hours must always feel rewarding, never punishing.
* **Implementation:**
  - When the browser tab closes or unmounts:
    1. S.L.O.P. Suspicion and VEX volatility are **frozen**. *(Inflation Heat and Civil Unrest are named here historically — neither has ever been implemented. Do not document them as if they exist.)*
    2. Zero margin calls or Special Counsel raids can execute while offline. Open 0DTE contracts have their expiry **pushed forward** by the offline duration (`extendTradesForOffline`) — a 0DTE position silently expiring in the player's absence is the one genuinely hostile offline behaviour in the game.
    3. Passive Treasury Cash and Crony Favor accrue cleanly at 100% efficiency (up to a 48-hour cap, `MAX_OFFLINE_SECONDS`).
    4. Offline earnings can cross a **phase threshold while the tab is shut**, so every cash-gain path — not just clicks — must be able to complete onboarding and promote the phase (`onboardingEngine.resolveMarketAccess`).
  - *Comedic Lore:* *"While the President is golfing at Palm-a-Grifto Resort & Spa, the federal government is paralyzed by executive indecision. Bureaucrats refuse to process riots or print money without a signed Sharpie directive. The economy enters a blissful coma until your return."*

---

## 2. Anti-Soft-Lock Invariants
* **The Bankruptcy Floor:** If a player loses 100% of their liquid capital on a catastrophic 1,000x Put trade:
  1. The primary manual click ("Executive Action / YAP") has a guaranteed cash floor:
     $$\text{Click Cash Floor} = \max\left(\$1.00, \text{Total SIS} \times \$1,000\right)$$
  2. If liquid net worth drops below 1% of all-time high, the **"Too Big To Fail" Emergency Bailout** dialog automatically grants 30 seconds of passive production.
* **Negative Debt as a Catalyst:** Sovereign debt compounding into negative billions does not freeze the game; it actively accelerates the unlock of Tier 1 Prestige (*Flight to the Caymans*).

---

## 3. Kinesthetic Juice Standards
* **The Squeak:** Audio pitch must modulate dynamically with click rate ($200\text{Hz} \to 850\text{Hz}$).
* **Recoil amplitude is FIXED, and must never be made proportional to the Tantrum Meter.**
  This rule previously read *"magnitude proportional to the Tantrum Meter"* — and it was
  actively wrong. A recoil that scales with the meter is a recoil that scales with *click
  rate*, because a high Tantrum Meter is only reachable by clicking fast. At 5–10 clicks/sec
  the impacts overlap into a permanent judder, which is precisely the "too much shake at the
  final stage" players reported. Current: `tactical-recoil` is a constant ±1.5px / ±0.25deg,
  and above 85% Tantrum the slam switches to `stamp-slam-calm` (6px, scale 1.06) so fast
  clicking degrades to a throb rather than a vibration. **If you want more impact at high
  intensity, add a new animation — do not scale the existing one.**
* **Ink Exhaustion Feedback:** Dry ink drops output sharply and triggers an irritating dry scratch sound until refilled. *(A dry nib builds **no** Tantrum — see `[Ink Fuels Frenzy]` in `constants/balance.ts`. A dry nib is a safety net, never the optimum.)*
* **CAPS LOCK FRENZY:** 10x click multiplier; a slow `calm-glow` on the ring (3.4s — *not* a
  strobe, which reads as an alarm and as a seizure risk); and **ink frozen, not granted.**
  A frenzy preserves current ink and consumes none during the burst — it explicitly does
  *not* refill to 100%, because a free refill would make running dry optimal.
