/**
 * YAP Social Platform & Procedural Post Types
 */

import type { StockSymbol } from './market';

export interface YapReply {
  id: string;
  authorHandle: string;
  authorName: string;
  isVerified: boolean;
  text: string;
  timestamp: string;
}

export interface YapPost {
  id: string;
  timestamp: string;
  rawText: string;
  targetSymbol?: StockSymbol;
  targetNation?: string;
  tariffPercentage?: number;
  typosIncluded: string[];
  viralQuotesCount: number;
  replies: YapReply[];
  impactMultiplier: number;
}

export interface YapState {
  recentYaps: YapPost[];
  isDrafting: boolean;
  autoYapUnlocked: boolean;
  totalYapsFired: number;
}
