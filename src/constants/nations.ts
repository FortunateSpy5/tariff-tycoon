import type { ParodyNation } from '../types/nations';

export const PARODY_NATIONS: ParodyNation[] = [
  {
    id: 'north_annex',
    name: 'The Great Northern Annex',
    sector: 'Boreal Slurry & Sub-Zero Diplomacy',
    chiefExports: ['Maple Slurry', 'Hockey Pucks', 'Polite Apologies', 'Raw Timber'],
    defaultTariffRate: 25,
    beggingTiers: {
      mild: 'Our High Commissioner has delivered a very polite formal objection on recycled birch bark.',
      desperate: 'Our Prime Minister promises to apologize on ice skates live on C-SNOOZE if you drop the lumber duty!',
      surrender: 'We surrender the southern half of Ontario and will rename Lake Huron after your golf resort!',
    },
  },
  {
    id: 'nearshore_fed',
    name: 'The Nearshore Federation',
    sector: 'High-Velocity Agro & Trans-Border Assembly',
    chiefExports: ['Precision Avocados', 'Festive Horns', 'Assembled Auto Parts'],
    defaultTariffRate: 35,
    beggingTiers: {
      mild: 'Our trade ministry warns this will increase the cost of Tuesday night guacamole by $4.50.',
      desperate: 'We will dispatch an elite 40-piece mariachi delegation to Palm-a-Grifto for your permanent enjoyment!',
      surrender: 'We have legally reclassified your Palm-a-Grifto golf villa as an independent sovereign nation with 0% tax!',
    },
  },
  {
    id: 'strike_republic',
    name: 'The Strike Republic',
    sector: 'Artisanal Dairy & Existential Grievances',
    chiefExports: ['Unpasteurized Brie', 'Smug Philosophical Essays', 'Striped Sweaters'],
    defaultTariffRate: 40,
    beggingTiers: {
      mild: 'Our train conductors are already on strike; taxing our red wine is a breach of existential hygiene.',
      desperate: 'Our philosophers have drafted a 600-page treatise proving your tweets are postmodern conceptual art!',
      surrender: 'We will dismantle the Eiffel Tower and reassemble it at Palm-a-Grifto as a 300-foot Golden Sherpie!',
    },
  },
  {
    id: 'overthinker_union',
    name: 'The Overthinker Union',
    sector: 'High-Precision Diesels & Regulatory Manuals',
    chiefExports: ['Overengineered Turbodiesels', '120-Page Safety Manuals', 'Sober Bureaucracy'],
    defaultTariffRate: 30,
    beggingTiers: {
      mild: 'Our parliamentary subcommittee has initiated a 14-month compliance impact study regarding your decree.',
      desperate: 'Our automotive engineers have tuned all diesel exhausts to emit gold flecks matching your penthouse!',
      surrender: 'We are suspending our parliament and adopting your book as our supreme federal legal code!',
    },
  },
  {
    id: 'red_factory',
    name: 'The Red Factory',
    sector: 'Global Synthetic Assembly & Containerized Goods',
    chiefExports: ['Bargain Plastic Trinkets', 'Glow-in-the-Dark Keychains', 'Synthetic Textiles'],
    defaultTariffRate: 60,
    beggingTiers: {
      mild: 'We remind you that 99.4% of your commemorative campaign merchandise is manufactured in our facilities.',
      desperate: 'We have commissioned 50,000 artisans to hand-weave a 2-mile silk tapestry of your market predictions!',
      surrender: 'We will rebrand the Yangtze River as the Dealmaker Waterway and grant you exclusive pontoon boat rights!',
    },
  },
  {
    id: 'silicon_archipelago',
    name: 'The Silicon Archipelago',
    sector: 'Sub-Micron Photolithography & Extreme UV',
    chiefExports: ['3nm Silicon Wafers', 'Extreme UV Light Modules', 'Sub-micron Circuits'],
    defaultTariffRate: 20,
    beggingTiers: {
      mild: 'Without our wafer shipments, your smart microwave cannot render high-definition cheese melting.',
      desperate: 'We have reserved an entire clean-room fabrication line exclusively to laser-engrave your YAPs onto 2nm gold wafers!',
      surrender: 'Our semiconductor foundries will run 24/7 on pure loyalty to synthesize artificial market rallies on command!',
    },
  },
];
