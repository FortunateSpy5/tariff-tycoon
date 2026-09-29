/**
 * Market, Trading & BagHolder Pro Types
 * Manages parodied stock tickers, 1,000x leveraged options, and S.L.O.P. regulatory heat.
 */

export type StockSymbol =
  | 'FRUT'
  | 'GIGA'
  | 'DOOR'
  | 'MICR'
  | 'GUAC'
  | 'MSIL'
  | 'LMBR'
  | 'AVOC'
  | 'PAIN';

export type OptionType = 'PUT' | 'CALL';

/**
 * One OHLC bucket of market history — the unit the desk chart draws.
 *
 * INVARIANT: [A Candle Is Recorded, Never Reconstructed]
 * `priceHistory` is twenty CLOSES at the 10 Hz tick, which is two seconds of
 * data and carries no open/high/low at all. Slicing it into candle-shaped
 * rectangles would have been fabricating the parts that make a candlestick
 * mean anything — the wick would be invented, so the chart would show range
 * the simulation never produced. Instead the tick accumulates real OHLC into
 * time buckets, and the crash flag is set by the engine that actually caused
 * the crash.
 */
export interface PriceCandle {
  /** Price at the moment the bucket opened. */
  o: number;
  /** Highest price seen inside the bucket. */
  h: number;
  /** Lowest price seen inside the bucket. */
  l: number;
  /** Most recent price inside the bucket. */
  c: number;
  /** `Date.now()` when the bucket opened. */
  t: number;
  /**
   * Set when a PLAYER-CAUSED move landed in this bucket — a YAP crash or a
   * walk-back clarification rally. This is the causal marker the chart renders:
   * the payoff moment the whole design is built around, finally visible at the
   * instant it happens.
   *
   * INVARIANT: the field is NEUTRAL (`playerMove`), not `crash`, because both
   * sanctioned moves set it and a clarification moves the price UP. A field
   * named `crash` would force the chart either to draw a red down-arrow scar on
   * a green recovery candle, or to lie in the type instead.
   */
  playerMove?: boolean;
  /**
   * Magnitude of the player-caused move that landed here, 0..1. Drives the
   * marker's size, so a 90% crash reads as a bigger scar than a 30% one.
   */
  playerMoveMagnitude?: number;
  /**
   * Which way the PLAYER'S move went: `1` pumped the price, `-1` dumped it.
   *
   * INVARIANT: [The Engine Records The Direction, The Renderer Never Re-derives It]
   * This cannot be read off the candle's `c`-vs-`o`, because a bucket measures
   * from ITS OWN open, not from before the move. The clarification window is 8s
   * and a bucket is 2s, so a YAP and its walk-back routinely share one bucket:
   * the rally genuinely prints higher, but the bucket still closes below the
   * pre-crash open, so a body-derived direction reported the player's
   * successful squeeze as "YAP -65%" — a red down-arrow on the one move in the
   * game that goes up. The stamping engine is the only party that knows which
   * side of the print its own move landed on, so it records that here.
   */
  playerMoveDirection?: 1 | -1;
}

export interface StockDefinition {
  symbol: StockSymbol;
  name: string;
  sector: string;
  description: string;
  basePrice: number;
  currentPrice: number;
  /**
   * The level the market has SETTLED at: the anchor the price random-walks
   * around, and the reference the chart's dashed rule is measured from.
   *
   * INVARIANT: [THE ANCHOR MUST ABSORB THE SHOCK, SLOWLY]
   * The price is `fairValue` plus a random walk plus mean reversion toward
   * `fairValue`. So `fairValue` IS the expected future price, and every question
   * about whether an option pays reduces to where it sits.
   *
   * An earlier version deliberately did NOT move it on a YAP, reasoning that a
   * shock should decay rather than be absorbed. That is exactly backwards, and
   * the arithmetic is unforgiving: if the anchor stays at the pre-crash price,
   * then `E[P(60s)]` is the pre-crash price, so a 0DTE PUT struck above it pays
   * nothing no matter how violent the YAP was. Measured, a 50% crash retained 1%
   * of itself after 30 seconds. The player's 1000x position, and the entire
   * causal loop the game is built on, quietly did not work — with nothing on
   * screen to say why.
   *
   * So the anchor follows the price, but slowly — it both ABSORBS a print
   * (`FAIR_VALUE_ABSORB`) and RELAXES toward the issue price
   * (`FAIR_VALUE_RELAX`), which is what a market actually does: a crash is
   * immediately the new price, and the expectation of where the price sits drifts
   * back over minutes. The separation that matters is not shock-vs-no-shock but
   * fast-vs-slow — the 60s option window is far shorter than the anchor's
   * relaxation, so a position opened on a YAP settles on that YAP.
   *
   * `undefined` on a save written before this field existed; the tick seeds it
   * from the issue price on the first print.
   */
  fairValue?: number;
  priceHistory: number[];
  volatilityMultiplier: number;
  /**
   * `Date.now()` of the most recent PLAYER-CAUSED print on this ticker, or 0.
   *
   * INVARIANT: [This Is Engine State, And It Is NOT Derived From The Chart]
   * Mean reversion is graded by how long the current price level has held, so the
   * engine needs the age of the last shock. Deriving it from the candle array was
   * tried and is wrong: `CANDLE_HISTORY_LENGTH` caps that buffer at 40 seconds of
   * tape, so a scar is evicted long before a meaningful grading window elapses —
   * which made the chart's bucket count silently govern the restore force on the
   * game's central mechanic. Retuning the chart must never be able to change how
   * hard a price snaps back.
   *
   * Set by `stampPlayerMove`, so the field cannot disagree with which candles
   * carry a mark. `undefined`/0 on a pre-field save, which reads as "never
   * shocked" and therefore fully graded — the correct answer for a fresh ticker.
   */
  lastPlayerMoveAt?: number;
  /** Time-bucketed OHLC series for the desk chart. See [A Candle Is Recorded]. */
  candles?: PriceCandle[];
}

export interface ActiveOptionTrade {
  id: string;
  symbol: StockSymbol;
  type: OptionType;
  entryPrice: number;
  targetPrice: number;
  strikePrice: number;
  leverage: number; // e.g. 10x to 1000x
  contractsCount: number;
  collateralLocked: number;
  openedAtTimestamp: number;
  expiresAtTimestamp: number;
  isSettled: boolean;
  profitOrLoss: number;
  /** CALL opened during the post-YAP window; refunded if the player misses the clarification */
  isWalkBackCombo?: boolean;
  /**
   * Opened while the onboarding allowance was live. Losing settlements refund the
   * collateral instead of banking a loss. See [Safe Practice Stakes] in tradingSlice.
   */
  isPaperTrade?: boolean;
}

export interface MarketState {
  stocks: Record<StockSymbol, StockDefinition>;
  activeTrades: ActiveOptionTrade[];
  hasSettledYapTrade: boolean;
  slopSuspicion: number; // 0 to 100%. At 100%, triggers Emergency Special Counsel Raid
  vexVolatility: number; // Baseline market volatility index ($VEX)
  cronyFavor: number; // Currency used to bribe S.L.O.P. auditors
  /**
   * INVARIANT: [Integer Crony Favor]
   * Sub-unit trickle remainder (0 <= r < 1) carried between ticks. The passive
   * faucet grants 0.05/sec, so without a remainder the counter would either show
   * floats (🤝 82.34520000000012) or silently truncate a favour every tick.
   * `cronyFavor` is therefore always a whole number and no favour is ever lost.
   */
  cronyFavorRemainder: number;
  isWalkBackWindowActive: boolean; // 8-second Straddle Squeeze window
  walkBackSecondsRemaining: number;
  lastWalkBackNotice: string | undefined;
  lastTargetStockSymbol: StockSymbol | undefined; // Targeted stock for the walk-back squeeze
  yapTargetMode: 'selected' | 'shotgun'; // Toggle: targeted insider short vs unhinged shotgun
  selectedStock: StockSymbol; // Currently selected stock on BagHolder Pro
  lastYapTimestamp: number; // For YAP cooldown enforcement
  yapCooldownSeconds: number; // Cooldown duration (default 10s)
  lastRaidMessage?: string; // Feedback from Special Counsel raid/asset seizure
  lastRaidTimestamp: number;
}
