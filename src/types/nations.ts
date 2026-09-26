/**
 * Parodied Foreign Nations Types
 */

export interface BeggingTiers {
  mild: string; // Tariff < 100%
  desperate: string; // Tariff 100% - 300%
  surrender: string; // Tariff > 300%
}

export interface ParodyNation {
  id: string;
  name: string;
  sector: string;
  chiefExports: string[];
  beggingTiers: BeggingTiers;
  defaultTariffRate: number;
}
