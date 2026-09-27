/**
 * Unlocks & PolyGrift Constants
 * Canonical catalog of Oligarch Lobbying Upgrades and Prediction Bets.
 */

import type { CronyUpgrade, PolyGriftBet } from '../types/unlocks';

export const INITIAL_CRONY_UPGRADES: CronyUpgrade[] = [
  {
    id: 'heavy_tungsten_nib',
    name: 'Heavy Tungsten Nib',
    description: 'Forged from scrap DoorPlug ($DOOR) fuselage bolts; doubles manual click yield (+100%).',
    cost: 25000,
    multiplierType: 'click',
    value: 2.0,
  },
  {
    id: 'autopen_army',
    name: 'AI Autopen Interns',
    description: 'Autonomous pneumatic arm repeatedly stamps orders at 5 taps/second.',
    cost: 100000,
    multiplierType: 'autopen',
    value: 5.0,
  },
  {
    id: 'diet_soda_drip',
    name: 'Diet Soda Desk Drip',
    description: 'Direct caffeine pipeline to the desk; tantrum builds 50% faster.',
    cost: 250000,
    multiplierType: 'tantrum',
    value: 1.5,
  },
  {
    id: 'darkpool_fiber',
    name: 'Dark Pool Dedicated Fiber',
    description: 'Sub-millisecond connection to Citadull HFT; 0DTE options payout +50%.',
    cost: 1000000,
    multiplierType: 'darkpool',
    value: 1.5,
  },
  {
    id: 'broad_daylight_printer',
    name: 'Broad Daylight Money Printer',
    description: 'Mounts a physical $BRRR button on the desk blotter for emergency cash.',
    cost: 10000000,
    multiplierType: 'moneyprinter',
    value: 1.0,
  },
];

export const INITIAL_POLYGRIFT_BETS: PolyGriftBet[] = [
  {
    id: 'maple_tariff',
    title: 'Will Dealmaker-in-Chief tariff Great Northern Annex maple slurry before sunrise?',
    oddsYes: 1.08,
    oddsNo: 12.5,
    probYes: 92,
  },
  {
    id: 'subpoena_raid',
    title: 'Will Special Counsel issue emergency 4:00 AM subpoena to Oval Office?',
    oddsYes: 1.35,
    oddsNo: 3.85,
    probYes: 74,
  },
  {
    id: 'brie_ban',
    title: 'Will Strike Republic soft cheese be designated an existential security bio-hazard?',
    oddsYes: 2.10,
    oddsNo: 1.80,
    probYes: 48,
  },
  {
    id: 'martian_duty',
    title: 'Will an emergency 850% import duty be levied on Martian dust?',
    oddsYes: 5.50,
    oddsNo: 1.15,
    probYes: 18,
  },
];
