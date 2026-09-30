/**
 * Phase 1.2 verification probe. Run: npx tsx scripts/probe-perks.mts  (or via vite-node)
 * Exercises the perk engine and the projection against the invariants that matter.
 */
import {
  canAfford,
  clickFlashDip,
  debtReliefFloor,
  flashDipValuationMultiplier,
  liquidationFavorCost,
  openBookValue,
  raidsAbolished,
  resolveAutoMatch,
  retainedPassiveRate,
  shellCompanyTapMultiplier,
  tickFlashDip,
  treasuryFloorFor,
} from '../src/engine/systems/perkEngine';
import { resolveClickPayout } from '../src/engine/systems/clickPayout';
import { calculateOptionReturn, calculateInkRefillTotal, calculatePrestigeSIS } from '../src/engine/math/formulas';
import { tickSlop } from '../src/engine/systems/slopEngine';
import { isBrokeNotInDebt } from '../src/store/slices/deskPropsSlice';
import { readPrestigeProjection, lifetimeCashForSlips } from '../src/components/dump/prestigeProjection';
import { PRESTIGE_CASH_DIVISOR } from '../src/constants/balance';
import { QEAAAS_BUFFER, DEBT_RECOVERY_CLICKS } from '../src/constants/perks';

let fails = 0;
const ok = (name: string, cond: boolean, extra = '') => {
  if (!cond) { fails++; console.log(`FAIL  ${name} ${extra}`); }
  else console.log(`ok    ${name} ${extra}`);
};
const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

const ALL = {
  shell_company_inception: true, macro_wreck_280: true, qe_as_a_service: true,
  insider_401k: true, pardon_assembly_line: true, golden_parachute: true,
} as const;
const NONE = {};

// --- Perk 1
ok('shell company doubles tap', shellCompanyTapMultiplier(ALL) === 2);
ok('shell company off by default', shellCompanyTapMultiplier(NONE) === 1);
{
  const base = resolveClickPayout({ phase: 2, baseValue: 5, inkLevel: 50, isCapsFrenzy: false, sisCount: 0, dryClicksCount: 0, hasTungstenNib: false, perks: NONE, treasuryCash: 0 });
  const shelled = resolveClickPayout({ phase: 2, baseValue: 5, inkLevel: 50, isCapsFrenzy: false, sisCount: 0, dryClicksCount: 0, hasTungstenNib: false, perks: { shell_company_inception: true }, treasuryCash: 0 });
  ok('shell company doubles the CHARGED yield', near(shelled.earnedCash, base.earnedCash * 2), `${base.earnedCash} -> ${shelled.earnedCash}`);
  const nib = resolveClickPayout({ phase: 2, baseValue: 5, inkLevel: 50, isCapsFrenzy: false, sisCount: 0, dryClicksCount: 0, hasTungstenNib: true, perks: NONE, treasuryCash: 0 });
  ok('tungsten nib reflected in the shared payout', near(nib.earnedCash, base.earnedCash * 2), `${nib.earnedCash}`);
  const both = resolveClickPayout({ phase: 2, baseValue: 5, inkLevel: 50, isCapsFrenzy: false, sisCount: 0, dryClicksCount: 0, hasTungstenNib: true, perks: { shell_company_inception: true }, treasuryCash: 0 });
  ok('nib x shell compound to 4x', near(both.earnedCash, base.earnedCash * 4), `${both.earnedCash}`);
}

// --- Perk 2
{
  let r = clickFlashDip({ enabled: false, isActive: false, secondsRemaining: 0, totalTriggered: 0 }, () => 0);
  ok('dip never fires without the perk', !r.triggered && r.secondsRemaining === 0);
  r = clickFlashDip({ enabled: true, isActive: false, secondsRemaining: 0, totalTriggered: 0 }, () => 0.01);
  ok('dip fires at 1% roll', r.triggered && r.secondsRemaining === 8 && r.totalTriggered === 1);
  r = clickFlashDip({ enabled: true, isActive: true, secondsRemaining: 3, totalTriggered: 4 }, () => 0.99);
  ok('dip re-rolls and can MISS while running', !r.triggered && r.secondsRemaining === 3);
  r = clickFlashDip({ enabled: true, isActive: true, secondsRemaining: 3, totalTriggered: 4 }, () => 0.0);
  ok('dip tops the timer back up to full', r.secondsRemaining === 8);
  ok('dip ticks to zero and never negative', tickFlashDip(0.1, 0.2) === 0);
  ok('dip multiplier 1 when idle', flashDipValuationMultiplier(0) === 1);
  ok('dip multiplier 6 when live', flashDipValuationMultiplier(0.1) === 6);
  // Signed: a winning PUT pays 6x, and a MARGINALLY losing position is marked
  // down 6x (past the -100% clamp, which is the only thing that stops it).
  const win = calculateOptionReturn('PUT', 100, 90, 100, 1000, 15, false, 6);
  const winPlain = calculateOptionReturn('PUT', 100, 90, 100, 1000, 15, false, 1);
  const halfLossPlain = calculateOptionReturn('CALL', 100, 99.5, 100, 1000, 15, false, 1);
  const halfLossDip = calculateOptionReturn('CALL', 100, 99.5, 100, 1000, 15, false, 6);
  const ruin = calculateOptionReturn('CALL', 100, 90, 100, 1000, 15, false, 6);
  ok('dip multiplies a WIN 6x', near(win, winPlain * 6), `${winPlain} -> ${win}`);
  ok('dip marks a half-losing position down 6x', near(halfLossPlain, -500) && halfLossDip === -1000, `${halfLossPlain} -> ${halfLossDip} (clamped)`);
  ok('dip cannot lose more than the collateral', ruin === -1000, `${ruin}`);
}

// --- Perk 3
{
  ok('floor is 0 without the perk', treasuryFloorFor(NONE) === 0);
  ok('floor is -$50B with it', treasuryFloorFor(ALL) === -QEAAAS_BUFFER);
  ok('cannot spend below zero without the perk', !canAfford(0, 1, NONE));
  ok('CAN spend the last dollar of the buffer', canAfford(-QEAAAS_BUFFER + 1000, 1000, ALL));
  ok('CANNOT spend past the buffer', !canAfford(-QEAAAS_BUFFER, 1000, ALL));
  // Debt floor self-liquidates: N slams of a constant floor = the whole debt.
  const D = QEAAAS_BUFFER;
  ok('debt floor is one step at full debt', near(debtReliefFloor(-D, ALL), D / DEBT_RECOVERY_CLICKS));
  ok('debt floor is the debt itself on the last step', near(debtReliefFloor(-D / DEBT_RECOVERY_CLICKS, ALL), D / DEBT_RECOVERY_CLICKS));
  ok('no debt floor when solvent', debtReliefFloor(1, ALL) === 0);
  ok('no debt floor without the perk', debtReliefFloor(-D, NONE) === 0);
  let cash = -D; const floorAt = (c: number) => debtReliefFloor(c, ALL);
  let slams = 0; let everProfitable = false;
  while (cash < 0 && slams < 10 * DEBT_RECOVERY_CLICKS) {
    cash += floorAt(cash); slams++;
    if (cash > 0) everProfitable = true;
  }
  ok('debt never overshoots into profit', !everProfitable);
  ok(
    'debt cleared in ~N slams, landing on exactly zero',
    cash === 0 && Math.abs(slams - DEBT_RECOVERY_CLICKS) <= 2,
    `${slams} slams, ended ${cash}`
  );
  // A jammed dry nib must repay at the SAME rate — the recovery window is a
  // property of the loan, not of the player's ink.
  const dry = resolveClickPayout({ phase: 1, baseValue: 5, inkLevel: 0, isCapsFrenzy: false, sisCount: 0, dryClicksCount: 999, hasTungstenNib: false, perks: ALL, treasuryCash: -D });
  ok('jammed dry nib repays at the full rate', near(dry.earnedCash, D / DEBT_RECOVERY_CLICKS), `${dry.earnedCash.toFixed(0)}`);
  // Raid must NOT lift a negative treasury, and must still floor a solvent one.
  const raided = tickSlop({ slopSuspicion: 100, cronyFavor: 0, treasuryCash: -D, lastRaidTimestamp: 0, deltaSeconds: 0.1, now: 10_000_000, raidsAbolished: false }, undefined);
  ok('raid does not LIFT a negative treasury to the $10 floor', raided.treasuryCash < 0, `${raided.treasuryCash}`);
  const raidedThin = tickSlop({ slopSuspicion: 100, cronyFavor: 0, treasuryCash: 5, lastRaidTimestamp: 0, deltaSeconds: 0.1, now: 10_000_000, raidsAbolished: false }, undefined);
  ok('raid charges a sub-$10 player in full', raidedThin.treasuryCash === 5 - 5000, `${raidedThin.treasuryCash}`);
  const raidedOk = tickSlop({ slopSuspicion: 100, cronyFavor: 0, treasuryCash: 1000, lastRaidTimestamp: 0, deltaSeconds: 0.1, now: 10_000_000, raidsAbolished: false }, undefined);
  ok('raid still floors a solvent player at $10', raidedOk.treasuryCash === 10, `${raidedOk.treasuryCash}`);
  // A tax scaled by a NEGATIVE balance is a rebate. This one shipped for a
  // build: 2% of -$50B made a $25 refill pay out a billion dollars.
  ok('refill tax is zero on a debt, not a rebate', calculateInkRefillTotal(1, -QEAAAS_BUFFER) > 0, `${calculateInkRefillTotal(1, -QEAAAS_BUFFER)}`);
  ok('refill price is never negative', calculateInkRefillTotal(0, -QEAAAS_BUFFER) > 0, `${calculateInkRefillTotal(0, -QEAAAS_BUFFER)}`);
  ok('refill price unchanged when solvent', calculateInkRefillTotal(0, 0) === 25, `${calculateInkRefillTotal(0, 0)}`);
  ok('2% treasury tax still applies when solvent', calculateInkRefillTotal(0, 1000) === 45, `${calculateInkRefillTotal(0, 1000)}`);
  ok('4x cap still clamps a large treasury', calculateInkRefillTotal(0, 1e9) === 100, `${calculateInkRefillTotal(0, 1e9)}`);
}

// --- Perk 4
{
  ok('no match without the perk', resolveAutoMatch({ enabled: false, lastMatchTimestamp: 1, peakBookValue: 1e9, currentBookValue: 1e9, now: 1e6 }).payout === 0);
  ok('no match before 60s', resolveAutoMatch({ enabled: true, lastMatchTimestamp: 1, peakBookValue: 1e9, currentBookValue: 1e9, now: 59_000 }).payout === 0);
  const m = resolveAutoMatch({ enabled: true, lastMatchTimestamp: 1, peakBookValue: 1000, currentBookValue: 1000, now: 61_000 });
  ok('match pays 1.5% of peak', near(m.payout, 15), `${m.payout}`);
  // A clock that starts at 0 must open its window NOW, not at the epoch. This
  // was a reload-to-farm exploit: the field is not persisted, so it rehydrated
  // as 0 and `now - 0` read as a 56-year-overdue window.
  const cold = resolveAutoMatch({ enabled: true, lastMatchTimestamp: 0, peakBookValue: 1e9, currentBookValue: 1e9, now: 1_000_000_000 });
  ok('a zero clock pays nothing', cold.payout === 0 && cold.paid === false, `${cold.payout}`);
  ok('a zero clock starts the window at now', cold.lastMatchTimestamp === 1_000_000_000, `${cold.lastMatchTimestamp}`);
  ok('a zero clock cannot be re-farmed 100x', (() => {
    let ts = 0, paid = 0;
    for (let i = 0; i < 100; i++) { const r = resolveAutoMatch({ enabled: true, lastMatchTimestamp: ts, peakBookValue: 1e9, currentBookValue: 1e9, now: 1_000_000_000 }); ts = r.lastMatchTimestamp; paid += r.payout; }
    return paid === 0;
  })());
  ok('match resets peak to NOW, not zero', m.peakBookValue === 1000);
  ok('empty book peaks at zero -> no match', resolveAutoMatch({ enabled: true, lastMatchTimestamp: 1, peakBookValue: 0, currentBookValue: 0, now: 61_000 }).paid === false);
  // The case the first version of this test could not reach: a STALE peak left
  // behind by a position that has since settled. Live measurement caught this
  // paying $1,500 against a book that no longer existed.
  const stale = resolveAutoMatch({ enabled: true, lastMatchTimestamp: 1, peakBookValue: 100_000, currentBookValue: 0, now: 61_000 });
  ok('STALE peak from a settled position pays nothing', stale.payout === 0 && stale.paid === false, `${stale.payout}`);
  ok('STALE peak is discarded, not carried', stale.peakBookValue === 0, `${stale.peakBookValue}`);
  // A live book whose value ROSE since the last window pays on the risen value:
  // the peak is climbed to `currentBookValue` before the payout is taken, which
  // is the "peak trade" the GDD names rather than a stale figure.
  const live = resolveAutoMatch({ enabled: true, lastMatchTimestamp: 1, peakBookValue: 50_000, currentBookValue: 200_000, now: 61_000 });
  ok('live book pays on the climbed peak', near(live.payout, 200_000 * 0.015), `${live.payout}`);
  // A live book that SHRANK pays on the old peak, then resets to the new value —
  // so a position opened and closed inside one window cannot be paid twice.
  const shrank = resolveAutoMatch({ enabled: true, lastMatchTimestamp: 60_000, peakBookValue: 200_000, currentBookValue: 50_000, now: 120_000 });
  ok('shrunken book pays the old peak once', near(shrank.payout, 200_000 * 0.015), `${shrank.payout}`);
  ok('shrunken book resets the peak to its new value', shrank.peakBookValue === 50_000, `${shrank.peakBookValue}`);
  // Peak climbs between windows without paying.
  const climbing = resolveAutoMatch({ enabled: true, lastMatchTimestamp: 1, peakBookValue: 100, currentBookValue: 900, now: 30_000 });
  ok('peak climbs even when no match is due', climbing.peakBookValue === 900 && climbing.payout === 0);
  ok('losing position values at its collateral', openBookValue([1000, -500]) === 1000);
}

// --- Perk 5
{
  ok('liquidation undiscounted without the perk', liquidationFavorCost(100, NONE) === 100);
  ok('liquidation 35% with the perk', liquidationFavorCost(100, ALL) === 35);
  ok('raids not abolished by default', !raidsAbolished(NONE));
  ok('raids abolished by the perk', raidsAbolished(ALL));
  const r = tickSlop({ slopSuspicion: 100, cronyFavor: 0, treasuryCash: 1e9, lastRaidTimestamp: 0, deltaSeconds: 0.1, now: 10_000_000, raidsAbolished: true }, undefined);
  ok('no seizure at 100% heat when pardoned', !r.raided && r.treasuryCash === 1e9);
  ok('heat still decays when pardoned', r.slopSuspicion < 100, `${r.slopSuspicion}`);
}

// --- Perk 6
{
  ok('no carry without the perk', retainedPassiveRate(1000, NONE) === 0);
  ok('15% carry with the perk', near(retainedPassiveRate(1000, ALL), 150));
  ok('negative passive cannot carry negative', retainedPassiveRate(-5, ALL) === 0);
}

// --- Projection
{
  const p = readPrestigeProjection(0, 0);
  ok('zero progress at zero', p.progress === 0 && p.shortfall === PRESTIGE_CASH_DIVISOR);
  const half = readPrestigeProjection(PRESTIGE_CASH_DIVISOR / 2, 0);
  ok('progress clamps at 1 once the gate is passed', readPrestigeProjection(PRESTIGE_CASH_DIVISOR * 2, 0).progress === 1);
  ok('doubling cash is worth ~1.25x, not 2x', near(half.cashDoublingGain, Math.pow(2, 0.32)), `${half.cashDoublingGain.toFixed(4)}`);
  ok('milestone inversion round-trips', near(lifetimeCashForSlips(1), PRESTIGE_CASH_DIVISOR));
  ok('milestone for 32 slips is > 32x the gate', lifetimeCashForSlips(32) > PRESTIGE_CASH_DIVISOR * 32, lifetimeCashForSlips(32).toExponential(2));
  // The milestone must actually be the first cash value that gains a whole slip.
  const target = lifetimeCashForSlips(3);
  const at = readPrestigeProjection(target * 0.999, 0);
  const past = readPrestigeProjection(target * 1.001, 0);
  ok('just under the milestone is 2 SIS', at.sisNow === 2, `${at.sisNow}`);
  ok('just over the milestone is 3 SIS', past.sisNow === 3, `${past.sisNow}`);
  // INVARIANT: [The Stated Gain Is The ACTUAL Gain] — the card quoted a whole
  // number of RUNGS while the engine floors a SUM of two fractional terms, so it
  // disagreed at most sampled points. Assert the engine's own arithmetic.
  let gainMismatches = 0;
  for (const cash of [0, 0.5, 1, 2, 5, 8.7, 20]) {
    for (const opt of [0, 1e9, 5e9, 2.4e10]) {
      const p = readPrestigeProjection(cash * PRESTIGE_CASH_DIVISOR, opt);
      if (p.nextSlipCash === null) continue;
      const actual = calculatePrestigeSIS(p.nextSlipCash, opt) - p.sisNow;
      if (p.nextSlipGain !== Math.max(0, actual)) gainMismatches++;
    }
  }
  ok('stated gain always equals the real gain', gainMismatches === 0, `${gainMismatches} mismatches`);
}

// --- [A Rescue Must Not Become A Faucet] ---------------------------------
// Regression guard for two faucets this change CREATED. The Red Phone bailout
// and the Gold Box emergency sale waive their cooldowns when the player is
// broke, and they were self-limiting only because the payout lifted the
// treasury back over the threshold. QE As A Service means a payout never has to
// lift anything, so the waiver became unlimited: measured 200/200 bailouts at
// $25,000 a click and 300/300 secret sales at $500 a click.
{
  const broke = { treasuryCash: 5, passiveCashPerSecond: 0, tariffRevenuePerSecond: 0, unlockedPerks: {} };
  ok('bailout still available to a genuinely broke player', isBrokeNotInDebt(5, {}, 10));
  ok('bailout unavailable to a solvent player', !isBrokeNotInDebt(5000, {}, 10));
  ok('bailout unavailable in QEaaS debt', !isBrokeNotInDebt(-1, ALL, 10));
  ok('bailout unavailable at exactly -$50B', !isBrokeNotInDebt(-QEAAAS_BUFFER, ALL, 10));
  ok('secret-sale waiver unavailable in QEaaS debt', !isBrokeNotInDebt(-1, ALL, 50));
  ok('secret-sale waiver still available when genuinely broke', isBrokeNotInDebt(5, {}, 50));
  void broke;
}

console.log(fails === 0 ? '\nALL PASS' : `\n${fails} FAILURE(S)`);
process.exit(fails === 0 ? 0 : 1);
