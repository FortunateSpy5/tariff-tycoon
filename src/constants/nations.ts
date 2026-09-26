export interface ParodyNation {
  id: string;
  name: string;
  parodyOf: string;
  chiefExports: string[];
  beggingExcuseTemplate: string;
  defaultTariffRate: number;
}

export const PARODY_NATIONS: ParodyNation[] = [
  {
    id: 'north_annex',
    name: 'The Great Northern Annex',
    parodyOf: 'Canada',
    chiefExports: ['Maple Slurry', 'Hockey Pucks', 'Polite Apologies', 'Raw Timber'],
    beggingExcuseTemplate: 'Our Prime Minister promises to apologize on ice skates if you drop the lumber duty to 300%!',
    defaultTariffRate: 25,
  },
  {
    id: 'nearshore_fed',
    name: 'The Nearshore Federation',
    parodyOf: 'Mexico',
    chiefExports: ['Precision Avocados', 'Festive Horns', 'Assembled Auto Parts'],
    beggingExcuseTemplate: 'We will dispatch an extra mariachi delegation to Palm-a-Grifto if avocados stay tax-free!',
    defaultTariffRate: 35,
  },
  {
    id: 'strike_republic',
    name: 'The Strike Republic',
    parodyOf: 'France',
    chiefExports: ['Unpasteurized Brie', 'Smug Philosophical Essays', 'Striped Sweaters'],
    beggingExcuseTemplate: 'Our train conductors are already on strike; taxing our red wine is a breach of existential hygiene!',
    defaultTariffRate: 40,
  },
  {
    id: 'overthinker_union',
    name: 'The Overthinker Union',
    parodyOf: 'Germany',
    chiefExports: ['Overengineered Turbodiesels', '120-Page Safety Manuals', 'Sober Bureaucracy'],
    beggingExcuseTemplate: 'Our technical committee has drafted a 400-page rebuttal explaining why our sparkplugs cannot be taxed!',
    defaultTariffRate: 30,
  },
  {
    id: 'red_factory',
    name: 'The Red Factory',
    parodyOf: 'China',
    chiefExports: ['Temu Plastic Trinkets', 'Glow-in-the-Dark Keychains', 'Synthetic Textiles'],
    beggingExcuseTemplate: 'We have already built 40 new container ships just to deliver your commemorative campaign hats!',
    defaultTariffRate: 60,
  },
  {
    id: 'silicon_archipelago',
    name: 'The Silicon Archipelago',
    parodyOf: 'Taiwan',
    chiefExports: ['3nm Silicon Wafers', 'Extreme UV Light Modules', 'Sub-micron Circuits'],
    beggingExcuseTemplate: 'Without our wafer shipments, your microwave cannot render high-definition cheese melting!',
    defaultTariffRate: 20,
  },
];
