import type { Market, Timeframe } from "../constants/chart";
import type { Candle } from "../types/candle";

function toFiniteNumber(value: unknown, field: string): number {
  const number =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim() !== ""
        ? Number(value)
        : Number.NaN;

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid Binance candle field: ${field}`);
  }

  return number;
}

function parseKline(row: unknown): Candle {
  if (!Array.isArray(row) || row.length < 6) {
    throw new Error("Invalid Binance kline response");
  }

  const time = toFiniteNumber(row[0], "open time");
  const open = toFiniteNumber(row[1], "open");
  const high = toFiniteNumber(row[2], "high");
  const low = toFiniteNumber(row[3], "low");
  const close = toFiniteNumber(row[4], "close");
  const volume = toFiniteNumber(row[5], "volume");

  if (
    !Number.isInteger(time) ||
    time <= 0 ||
    low > high ||
    low > Math.min(open, close) ||
    high < Math.max(open, close) ||
    volume < 0
  ) {
    throw new Error("Invalid OHLCV values in Binance response");
  }

  return { time, open, high, low, close, volume };
}

export async function fetchCandles(
  market: Market,
  timeframe: Timeframe,
  signal?: AbortSignal,
): Promise<Candle[]> {
  const baseUrl = import.meta.env.VITE_BINANCE_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("VITE_BINANCE_API_BASE_URL is not configured");
  }

  const url = new URL("/api/v3/klines", baseUrl);
  url.search = new URLSearchParams({
    symbol: market,
    interval: timeframe,
    limit: "500",
  }).toString();

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(
      `Binance request failed: ${response.status} ${response.statusText}`,
    );
  }

  const data: unknown = await response.json();

  if (!Array.isArray(data)) {
    throw new Error("Unexpected Binance kline response");
  }

  return data.map(parseKline);
}
