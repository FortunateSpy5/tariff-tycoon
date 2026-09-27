---
name: options-trading-math
description: Mathematical formulas and balance mechanics for BagHolder Pro 0DTE options, leverage, volatility (VIX) spikes, and SEC Suspicion.
---

# Options Trading Math Skill

This skill documents the quantitative models powering the causal insider trading terminal **`BagHolder Pro`**.

---

## 1. Implemented Arcade Options Model

The game uses an arcade directional-return model, not Black-Scholes. A YAP shock has a positive crash severity capped at 92%:
$$d = \min\left(0.92, \left(0.25 + \frac{\text{YAP tariff percentage}}{1000}\right) M_{\text{frenzy}} M_{\text{shotgun}}\right)$$
* $M_{\text{frenzy}}=1.4$ during CAPS LOCK FRENZY, otherwise $1$.
* $M_{\text{shotgun}}=1.25$ in shotgun mode, otherwise $1$.
* Crashed price: $S_1=\max(1, S_0(1-d))$.

### 1.2 VEX Index
* A selected-target YAP adds 25 VEX points; shotgun adds 35. VEX is capped at 80 and decays toward 15 at 0.5 points/second.
* $M_{\text{VEX}}=1+\max(0,(VEX-15)/100)$.

### 1.3 Position Settlement
$$r = \begin{cases}(S_0-S_1)/S_0 & \text{PUT} \\ (S_1-S_0)/S_0 & \text{CALL}\end{cases}$$
$$\text{Net P\&L}=C\max(-1,r\Lambda M_{\text{VEX}})M_{\text{fiber}},\quad \text{Payout}=C+\text{Net P\&L}$$
* $C$: collateral cash locked in the trade. $\Lambda$: selected leverage (10x, 100x, or 1000x).
* $M_{\text{fiber}}=1.5$ for profitable trades with Dark Pool Fiber; otherwise it is $1$.
* Loss is capped at 100% of locked collateral. Contracts expire after 60 seconds and can be settled early.

---

## 2. SEC Grand Jury Suspicion Accumulation

* Opening a trade adds 1 suspicion point, or 5 when leverage is above 100x.
* A selected-target YAP adds 12 points; shotgun adds 16.
* Suspicion decays at 0.2 points/second. At 100, a raid is resolved on a 15-second cadence.

### Threshold Events:
* At 100 suspicion, spend 50 Crony Favor to avert the raid if available; otherwise 35% of treasury is seized (minimum $5,000).
* Spend Crony Favor through the S.L.O.P. Radar to reduce suspicion. Walk-backs do not grant Crony Favor.
