/**
 * Procedural 3:00 AM YAP Generator
 * Generates unhinged, legally bulletproof satirical decrees and simulated comment feeds.
 */

import type { YapPost, YapReply } from '../../types/yap';
import type { StockSymbol } from '../../types/market';
import { INITIAL_STOCKS } from '../../constants/stocks';
import { PARODY_NATIONS } from '../../constants/nations';

const TIME_PREFIXES = [
  'Terrible sources telling me at 3:14 AM that',
  'Just woke up from a very powerful dream about how',
  'Nobody in the history of our great country has suffered more than me because',
  'IT HAS COME TO MY ATTENTION WHILE EATING A 113-GRAM FREEDOM PATTY THAT',
  'Sleepy Wall Street analysts are crying on television again because',
  'My advisors came to me with tears in their eyes saying, "Sir,',
  'LATE NIGHT ALERT FOR ALL REAL PATRIOTS:',
  'A lot of people are saying—very smart people, the best people—that',
  'WAKE UP AMERICA! The fake news will never report this, but',
  'I am looking out the Oval Office window at 3:30 AM and I see that',
];

const BIZARRE_GRIEVANCES = [
  'are secretly cooling their microchips with unpatriotic communist tap water,',
  'engineered synthetic avocados that taste like a federal compliance audit,',
  'refuse to let American golf carts drive in the left lane of the Autobahn,',
  'are charging 400% markups on tiny cuckoo clocks that do not even tell accurate Palm-a-Grifto time,',
  'built passenger jets where the emergency doors are held on by blue tape and affirmative action,',
  'are putting 70% unpatriotic nitrogen in potato chip bags just to cheat our working families,',
  'refused to accept my 24-karat gold high-top sneakers as sovereign collateral,',
  'are dumping low-grade maple slurry into the Great Lakes to disrupt our strategic waffle reserves,',
  'are using foreign quantum computing to artificially deflate the price of spray tans,',
  'sent a delegation of diplomats who wore brown shoes with a black tuxedo (UNACCEPTABLE),',
  'are deliberately routing container ships in zig-zags to make our port cranes look confused,',
  'are underpaying our patriotic border pelicans who guard the coastline,',
];

const PUNITIVE_DECREES = [
  'Effective at sunrise: an immediate 850% border surcharge on all incoming vowels!',
  'I am ordering the National Guard to impound their server racks and auction them on GriftBay!',
  'Canceling their export licenses until their CEO apologizes on live television wearing a dunce cap!',
  'Their sovereign wealth fund is now legally reclassified as an unlicensed offshore slot machine!',
  'Levying an emergency 1,200% Patriot Duty collected at gunpoint by Florida park rangers!',
  'All their container ships will be permanently anchored off Long Beach and converted into Spirit Halloween stores!',
  'Ordering the Treasury to mint a $10 Trillion coin with my face on both sides to buy their entire coastline!',
  'Taxing every photon that reflects off their foreign titanium gadgets at an emergency 400% rate!',
];

const UNHINGED_OUTROS = [
  'SAD!',
  'VERY LOW ENERGY!',
  'MANY SUCH CASES!',
  'BUY $PORK BEFORE THE BELL!',
  'TOTAL DISASTER!',
  'THE S&PAIN 500 WILL THANK ME LATER!',
  'WE NEVER WIN ANYMORE, BUT NOW WE WIN EVERY SECOND!',
  'STOP THE MADNESS!',
  'MAGNIFICENT MOVES ONLY!',
];

const DEVICE_OUTROS = [
  '(Dictated via Smart Microwave)',
  '(Sent from Oval Smart Toilet)',
  '(fruit-assistant cancel yap wait fruit-assistant delete that yap stop)',
  '(Sent from 18th hole bunker while waiting for cart)',
  '(Uploaded via Classified Pentagon Satellite Feed #4)',
  '(Dictated to terrified intern at 3:19 AM)',
  '(Sent from encrypted gold-plated pager)',
];

const BOT_ARCHETYPES = [
  {
    authorHandle: '@MadBagsJim',
    authorName: 'Jim Screamer (Squawk Pit)',
    isVerified: true,
    text: 'SELL THE CROPS! THE SEED GRAIN IS GONE! Wait—he posted a thumbs-up emoji? BUY CALLS! V-SHAPED SUPER-CYCLE! [soundboard glass shatter]',
  },
  {
    authorHandle: '@ElongatedMuskrat',
    authorName: 'Chief Meme Officer',
    isVerified: true,
    text: 'Concerning. Looking into replacing our entire international logistics division with Optimus wedge-bots running on pure memes.',
  },
  {
    authorHandle: '@IronJacketLarry',
    authorName: 'Leather-Jacket Larry',
    isVerified: true,
    text: 'The more GPUs you buy, the more tariffs you save. We are now rendering sovereign borders in real-time ray tracing.',
  },
  {
    authorHandle: '@0DTE_Ape',
    authorName: 'Diamond Hands 99',
    isVerified: false,
    text: 'HE CAPITALIZED "SLURRY"! That is an undeniable 7D-chess algorithmic signal! Just mortgaged my nan\'s kidney for 2000x puts! 🚀📉💀',
  },
  {
    authorHandle: '@SatoshiGrift',
    authorName: 'Web3 Macro Guru',
    isVerified: false,
    text: 'This is why you need decentralized meme reserves. Fiat tariffs cannot stop non-custodial bacon futures. DM for VIP alpha.',
  },
  {
    authorHandle: '@SnowcumbiaGov',
    authorName: 'Great Northern High Commission',
    isVerified: true,
    text: 'Mr. Executive, we have dispatched 50 barrels of strategic reserve maple syrup to Palm-a-Grifto. Please unfreeze the lumber barges.',
  },
  {
    authorHandle: '@BagHolder4Life',
    authorName: 'Dave (Down 94%)',
    isVerified: false,
    text: 'Bro please walk this back my portfolio is shaped like a vertical cliff and my wife just took the kids to her mother\'s.',
  },
  {
    authorHandle: '@CitadelHFT_Bot',
    authorName: 'LiquidityHarvester_v4',
    isVerified: true,
    text: '[AUTOMATED ARBITRAGE]: Executed 4,200,000 short contracts in 0.0004ms across 14 dark pools. Thank you for your service.',
  },
];

export function generateProceduralYap(preferredStock?: StockSymbol): YapPost {
  const stockSymbols = Object.keys(INITIAL_STOCKS) as StockSymbol[];
  const targetSymbol =
    preferredStock || stockSymbols[Math.floor(Math.random() * stockSymbols.length)];
  const stock = INITIAL_STOCKS[targetSymbol];

  const nation = PARODY_NATIONS[Math.floor(Math.random() * PARODY_NATIONS.length)];
  const tariffRate = Math.floor(Math.random() * 8 + 2) * 50; // 100% to 500%

  const prefix = TIME_PREFIXES[Math.floor(Math.random() * TIME_PREFIXES.length)];
  const grievance = BIZARRE_GRIEVANCES[Math.floor(Math.random() * BIZARRE_GRIEVANCES.length)];
  const decree = PUNITIVE_DECREES[Math.floor(Math.random() * PUNITIVE_DECREES.length)];
  const outro = UNHINGED_OUTROS[Math.floor(Math.random() * UNHINGED_OUTROS.length)];
  const device = DEVICE_OUTROS[Math.floor(Math.random() * DEVICE_OUTROS.length)];

  // Inject procedural typos into decree
  const typos = ['UNCONSTITUTONAL', 'PATRIOT', 'COVFEFE', 'BIGLY', 'HAMBURBDER'];
  const injectedTypo = typos[Math.floor(Math.random() * typos.length)];

  const rawText = `${prefix} ${stock.name} (${stock.symbol}) and ${nation.name} ${grievance} ${decree} (TOTALLY ${injectedTypo})! ${outro} ${device}`;

  // Randomly select 3 to 4 distinct bot replies from the 8-archetype pool
  const shuffledBots = [...BOT_ARCHETYPES].sort(() => 0.5 - Math.random());
  const selectedBots = shuffledBots.slice(0, Math.floor(Math.random() * 2) + 3);

  const replies: YapReply[] = selectedBots.map((bot, index) => ({
    ...bot,
    id: `reply-${Date.now()}-${index}`,
    timestamp: `${Math.floor(Math.random() * 45) + 2}s ago`,
  }));

  return {
    id: `yap-${Date.now()}`,
    timestamp: '3:14 AM',
    rawText,
    targetSymbol,
    targetNation: nation.name,
    tariffPercentage: tariffRate,
    typosIncluded: [injectedTypo],
    viralQuotesCount: Math.floor(Math.random() * 45000 + 5000),
    replies,
    impactMultiplier: 1.0 + tariffRate / 100,
  };
}
