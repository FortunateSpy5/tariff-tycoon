/**
 * Procedural 3:00 AM YAP Generator
 * Generates unhinged, legally safe satirical decrees and simulated comment feeds.
 */

import type { YapPost, YapReply } from '../../types/yap';
import type { StockSymbol } from '../../types/market';
import { INITIAL_STOCKS } from '../../constants/stocks';
import { PARODY_NATIONS } from '../../constants/nations';

const OPENINGS = [
  'TOTAL DISASTER!',
  'WAKE UP AMERICA!',
  'NOBODY TALKS ABOUT THIS BUT ME!',
  'VERY SAD SITUATION!',
  'DISLOYAL AND WEAK!',
  'JUST TALKED TO MY ADVISORS (THEY AGREE WITH ME)!',
];

const CRIMES = [
  'cooling their data centers with Commie municipal tap water',
  'importing counterfeit wooden nickels in cargo shipping crates',
  'stealing our glorious American drywall technology',
  'underpaying our patriotic border pelicans',
  'putting too much nitrogen in the potato chip bags',
  'refusing to accept my 24k gold high-top sneakers as legal tender',
];

const OUTROS = [
  'SAD!',
  'STOP THE MADNESS!',
  'WE NEVER WIN ANYMORE, BUT NOW WE WILL!',
  'MANY SUCH CASES!',
  'THE S&PAIN 500 WILL THANK ME LATER!',
  'MAGNIFICENT MOVES ONLY!',
];

const BOT_REPLIES = [
  {
    authorHandle: '@CramerMeltdown',
    authorName: 'Jim Screamer (Squawk Pit)',
    isVerified: true,
    text: 'SELL SELL SELL! OH GOD MY PRODUCER IS TELLING ME TO BUY! WHAT IS HAPPENING?!',
  },
  {
    authorHandle: '@IronJacketLarry',
    authorName: 'Leather-Jacket Larry',
    isVerified: true,
    text: 'Concerning. We will simply train our AI to manufacture its own tariffs.',
  },
  {
    authorHandle: '@NorthernPremier',
    authorName: 'Snowcumbia Prime Minister',
    isVerified: true,
    text: 'Sir, please accept our humblest apologies and 40 kegs of grade-A maple syrup!',
  },
  {
    authorHandle: '@DegenApe0DTE',
    authorName: 'Diamond Hands 99',
    isVerified: false,
    text: 'BRO I JUST PUT MY GRANDMA MORTGAGE INTO 1000x PUTS LETS GOOOOO 🚀📉',
  },
];

export function generateProceduralYap(preferredStock?: StockSymbol): YapPost {
  const stockSymbols = Object.keys(INITIAL_STOCKS) as StockSymbol[];
  const targetSymbol =
    preferredStock || stockSymbols[Math.floor(Math.random() * stockSymbols.length)];
  const stock = INITIAL_STOCKS[targetSymbol];

  const nation = PARODY_NATIONS[Math.floor(Math.random() * PARODY_NATIONS.length)];
  const tariffRate = Math.floor(Math.random() * 8 + 2) * 50; // 100% to 500%

  const opening = OPENINGS[Math.floor(Math.random() * OPENINGS.length)];
  const crime = CRIMES[Math.floor(Math.random() * CRIMES.length)];
  const outro = OUTROS[Math.floor(Math.random() * OUTROS.length)];

  const rawText = `${opening} ${stock.name} (${stock.symbol}) and ${nation.name} are ${crime}! Effective 4:00 AM, a mandatory ${tariffRate}% PATRIOT TARIFF will be collected at gunpoint! ${outro}`;

  // Procedural simulated replies
  const replies: YapReply[] = BOT_REPLIES.map((bot, index) => ({
    ...bot,
    id: `reply-${Date.now()}-${index}`,
    timestamp: 'Just now',
  }));

  return {
    id: `yap-${Date.now()}`,
    timestamp: '3:14 AM',
    rawText,
    targetSymbol,
    targetNation: nation.name,
    tariffPercentage: tariffRate,
    typosIncluded: ['PATRIOT', 'UNCONSTITUTONAL', 'COVFEFE'],
    viralQuotesCount: Math.floor(Math.random() * 45000 + 5000),
    replies,
    impactMultiplier: 1.0 + tariffRate / 100,
  };
}
