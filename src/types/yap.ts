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

/* `YapState` was removed here. It described a "YAP Social Platform" feed
   (`recentYaps`, `isDrafting`, `autoYapUnlocked`) that has never been built.
   `YapPost` is live — it backs the decree certificate. Add this back when the
   reply swarm actually lands, and delete it again if it never does. */
