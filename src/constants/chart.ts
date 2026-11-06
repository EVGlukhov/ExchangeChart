export const TIMEFRAME = {
  MINUTES_15: "15m",
  HOUR_1: "1h",
  HOURS_4: "4h",
  DAY_1: "1d",
} as const;

export type Timeframe = (typeof TIMEFRAME)[keyof typeof TIMEFRAME];

export const TIMEFRAMES = [
  TIMEFRAME.MINUTES_15,
  TIMEFRAME.HOUR_1,
  TIMEFRAME.HOURS_4,
  TIMEFRAME.DAY_1,
] as const;

export const MARKET = {
  BTC_USDT: "BTCUSDT",
  ETH_USDT: "ETHUSDT",
  BNB_USDT: "BNBUSDT",
} as const;

export type Market = (typeof MARKET)[keyof typeof MARKET];

export const MARKETS = [
  { symbol: MARKET.BTC_USDT, label: "BTC / USDT" },
  { symbol: MARKET.ETH_USDT, label: "ETH / USDT" },
  { symbol: MARKET.BNB_USDT, label: "BNB / USDT" },
] as const;
