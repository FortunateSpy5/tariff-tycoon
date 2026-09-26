---
name: options-trading-math
description: Mathematical formulas and balance mechanics for BagHolder Pro 0DTE options, leverage, volatility (VIX) spikes, and SEC Suspicion.
---

# Options Trading Math Skill

This skill documents the quantitative models powering the causal insider trading terminal **`BagHolder Pro`**.

---

## 1. Options Settlement & Volatility Payout Formula

### 1.1 The Crash Severity Function
When the player fires an active 3:00 AM YAP or signs a tariff decree, the target ticker price drops:
$$\Delta S(\%) = -\min\left(0.92, \; \kappa \times \left(\frac{\text{YAP\_Power}}{100}\right) \times (1 + 0.5 \times \mathbb{I}_{\text{frenzy}})\right)$$
* $\kappa \approx 0.75$ (Baseline market shock constant).
* $\mathbb{I}_{\text{frenzy}} = 1$ if launched during *CAPS LOCK FRENZY*, else $0$.
* Crashed Price: $S_{\text{crash}} = S_0 \times (1 - \Delta S(\%))$.

### 1.2 The Implied Volatility ($VIX$) Expansion (Vega Blowout)
$$VIX_{\text{spike}} = VIX_0 \times \left(1 + \Delta S(\%) \times 4.0\right)^{1.5}$$

### 1.3 Total Payout Formula
$$\text{Payout} = C \times \Lambda \times \left(\frac{\max(0, \; K - S_{\text{crash}})}{S_0}\right) \times \left(1 + \frac{VIX_{\text{spike}} - VIX_0}{100}\right)$$
* $C$: Collateral cash invested.
* $\Lambda$: Leverage multiplier ($\Lambda \in \{10\times, 50\times, 200\times, 500\times, 1000\times\}$).
* $K$: Put strike price ($K = S_0 \times (1 - \text{OTM}\%)$).

---

## 2. SEC Grand Jury Suspicion Accumulation

$$\Delta S_{\text{suspicion}} = \beta \times \log_{10}\left(1 + \frac{\text{Net Profit}}{\$10,000}\right) \times \sqrt{\frac{\Lambda}{10}} \times (1 - \theta_{\text{shell\_co}})$$
* $\beta = 3.50$ (Base regulatory sensitivity).
* $\theta_{\text{shell\_co}} \in [0, 0.80]$ (Mitigated by Delaware Shell LLC upgrades).

### Threshold Events:
* **$S \ge 50\%$ ("Congressional Subpoena")**: Order fill latency $+400\text{ms}$; legal defense fees auto-drain $1.5\%$ liquid cash/sec.
* **$S = 100\%$ ("DOJ Special Counsel Raid")**: BagHolder Pro frozen for $45 \text{s}$; $30\%$ of liquid cash locked in escrow.
* **Clearing Suspicion:** Spend **Crony Favor (🤝)** to appoint compromised judges or fire the special prosecutor.
