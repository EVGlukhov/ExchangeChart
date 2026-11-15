import { isRecord } from '@exchange-chart/shared'
import { TRADE_SIDE, type Market, type Timeframe } from '../constants/chart'
import type { Candle } from '../types/candle'
import type { SpotTicker } from '../types/spotTicker'
import type { Trade } from '../types/trade'
import { subscribeWithReconnect } from './reconnectingWebSocket'

const BINANCE_TICKER_24HR_EVENT = '24hrTicker'

/**
 * Converts a Binance numeric value to a finite number and includes the field
 * name in the error if the value is missing or invalid.
 *
 * @param value A value from a JSON response or WebSocket message.
 * @param field The Binance field name, used for diagnostics.
 * @returns The finite numeric value.
 * @throws {Error} If the value cannot be safely converted to a finite number.
 */
function toFiniteNumber(value: unknown, field: string): number {
  const number =
    typeof value === 'number'
      ? value
      : typeof value === 'string' && value.trim() !== ''
        ? Number(value)
        : Number.NaN

  if (!Number.isFinite(number)) {
    throw new Error(`Invalid Binance numeric field: ${field}`)
  }

  return number
}

/**
 * Validates a Binance OHLCV row and converts it to the candle model.
 *
 * @param row An unvalidated kline row containing time, OHLC values, and volume.
 * @returns A validated candle with numeric fields.
 * @throws {Error} If the row format or its OHLCV values are invalid.
 */
function parseKline(row: unknown): Candle {
  if (!Array.isArray(row) || row.length < 6) {
    throw new Error('Invalid Binance kline response')
  }

  const time = toFiniteNumber(row[0], 'open time')
  const open = toFiniteNumber(row[1], 'open')
  const high = toFiniteNumber(row[2], 'high')
  const low = toFiniteNumber(row[3], 'low')
  const close = toFiniteNumber(row[4], 'close')
  const volume = toFiniteNumber(row[5], 'volume')

  if (
    !Number.isInteger(time) ||
    time <= 0 ||
    low > high ||
    low > Math.min(open, close) ||
    high < Math.max(open, close) ||
    volume < 0
  ) {
    throw new Error('Invalid OHLCV values in Binance response')
  }

  return { time, open, high, low, close, volume }
}

/**
 * Loads candle history for the selected market and timeframe from the Binance REST API.
 *
 * @param market The Binance market symbol, such as `BTCUSDT`.
 * @param timeframe The Binance candle interval, such as `1h`.
 * @param signal An optional signal to abort the HTTP request.
 * @returns Validated candles in the order returned by Binance.
 * @throws {Error} If the URL is not configured, the request fails, or the data
 * has an unexpected format.
 */
export async function fetchCandles(
  market: Market,
  timeframe: Timeframe,
  signal?: AbortSignal,
): Promise<Candle[]> {
  const baseUrl = import.meta.env.VITE_BINANCE_API_BASE_URL

  if (!baseUrl) {
    throw new Error('VITE_BINANCE_API_BASE_URL is not configured')
  }

  const url = new URL('/api/v3/klines', baseUrl)
  url.search = new URLSearchParams({
    symbol: market,
    interval: timeframe,
    limit: '50',
  }).toString()

  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Binance request failed: ${response.status} ${response.statusText}`)
  }

  const data: unknown = await response.json()

  if (!Array.isArray(data)) {
    throw new Error('Unexpected Binance kline response')
  }

  return data.map(parseKline)
}

/**
 * Subscribes to the Binance kline stream and passes each validated candle to
 * the caller. Returns a function to cancel the subscription.
 *
 * @param market The Binance market symbol.
 * @param timeframe The candle timeframe.
 * @param onCandle Callback for a new or updated candle.
 * @param onError Callback for connection errors or invalid messages.
 * @param onOpen Optional callback for a successful socket open, including reconnections.
 * @returns A function that closes the socket and stops reconnection attempts.
 * @throws {Error} If the base WebSocket URL is not configured.
 */
export function subscribeCandles(
  market: Market,
  timeframe: Timeframe,
  onCandle: (candle: Candle) => void,
  onError: (error: Error) => void,
  onOpen?: () => void,
): () => void {
  const baseUrl = import.meta.env.VITE_BINANCE_WS_BASE_URL

  if (!baseUrl) {
    throw new Error('VITE_BINANCE_WS_BASE_URL is not configured')
  }

  const streamName = `${market.toLowerCase()}@kline_${timeframe}`
  const url = new URL(`/ws/${streamName}`, baseUrl)
  let unsubscribe = () => {}

  unsubscribe = subscribeWithReconnect(url, {
    onOpen,
    onError,
    onMessage(data) {
      try {
        const message: unknown = JSON.parse(data)

        if (!isRecord(message) || message.e !== 'kline' || !isRecord(message.k)) {
          throw new Error('Unexpected Binance WebSocket message')
        }

        const kline = message.k
        onCandle(parseKline([kline.t, kline.o, kline.h, kline.l, kline.c, kline.v]))
      } catch (cause) {
        onError(cause instanceof Error ? cause : new Error('Invalid Binance WebSocket data'))
        unsubscribe()
      }
    },
  })

  return unsubscribe
}

/**
 * Subscribes to the public Binance trade stream for the selected market.
 * Converts exchange messages to `Trade` values and closes the subscription
 * if message data is invalid.
 *
 * @param market The Binance market symbol.
 * @param handlers Callbacks for trades, errors, and connection open events.
 * @param handlers.onTrade Called for each validated trade.
 * @param handlers.onError Called when the socket fails or a message cannot be parsed.
 * @param handlers.onOpen Optional callback for a successful open, including reconnections.
 * @returns A function that stops the stream and reconnection attempts.
 * @throws {Error} If the base WebSocket URL is not configured.
 */
export function subscribeTrades(
  market: Market,
  handlers: {
    onTrade: (trade: Trade) => void
    onError: (error: Error) => void
    onOpen?: () => void
  },
): () => void {
  const baseUrl = import.meta.env.VITE_BINANCE_WS_BASE_URL

  if (!baseUrl) {
    throw new Error('VITE_BINANCE_WS_BASE_URL is not configured')
  }

  const url = new URL(`/ws/${market.toLowerCase()}@trade`, baseUrl)
  let unsubscribe = () => {}

  unsubscribe = subscribeWithReconnect(url, {
    onOpen: handlers.onOpen,
    onError: handlers.onError,
    onMessage(data) {
      try {
        const message: unknown = JSON.parse(data)

        if (!isRecord(message) || message.e !== 'trade' || typeof message.m !== 'boolean') {
          throw new Error('Unexpected Binance trade message')
        }

        const trade: Trade = {
          id: toFiniteNumber(message.t, 'trade id'),
          time: toFiniteNumber(message.T, 'trade time'),
          price: toFiniteNumber(message.p, 'trade price'),
          quantity: toFiniteNumber(message.q, 'trade quantity'),
          side: message.m ? TRADE_SIDE.SELL : TRADE_SIDE.BUY,
        }

        handlers.onTrade(trade)
      } catch (cause) {
        handlers.onError(cause instanceof Error ? cause : new Error('Invalid Binance trade data'))
        unsubscribe()
      }
    },
  })

  return unsubscribe
}

/**
 * Subscribes to the Binance 24-hour ticker stream and converts messages to
 * the compact `SpotTicker` model.
 *
 * @param market The market symbol for which to receive ticker data.
 * @param handlers Callbacks for ticker data, errors, and connection open events.
 * @param handlers.onTicker Called for each valid ticker message.
 * @param handlers.onError Called when the socket fails or the data is invalid.
 * @param handlers.onOpen Optional callback for a successful open, including reconnections.
 * @returns A function that stops the stream and reconnection attempts.
 * @throws {Error} If the base WebSocket URL is not configured.
 */
export function subscribeSpotTicker(
  market: Market,
  handlers: {
    onTicker: (ticker: SpotTicker) => void
    onError: (error: Error) => void
    onOpen?: () => void
  },
): () => void {
  const baseUrl = import.meta.env.VITE_BINANCE_WS_BASE_URL

  if (!baseUrl) {
    throw new Error('VITE_BINANCE_WS_BASE_URL is not configured')
  }

  const url = new URL(`/ws/${market.toLowerCase()}@ticker`, baseUrl)
  let unsubscribe = () => {}

  unsubscribe = subscribeWithReconnect(url, {
    onOpen: handlers.onOpen,
    onError: handlers.onError,
    onMessage(data) {
      try {
        const message: unknown = JSON.parse(data)

        if (!isRecord(message) || message.e !== BINANCE_TICKER_24HR_EVENT || message.s !== market) {
          throw new Error('Unexpected Binance Spot ticker message')
        }

        handlers.onTicker({
          lastPrice: toFiniteNumber(message.c, 'ticker price'),
          changePercent: toFiniteNumber(message.P, '24h change'),
          highPrice: toFiniteNumber(message.h, '24h high'),
          lowPrice: toFiniteNumber(message.l, '24h low'),
          quoteVolume: toFiniteNumber(message.q, '24h quote volume'),
        })
      } catch (cause) {
        handlers.onError(
          cause instanceof Error ? cause : new Error('Invalid Binance Spot ticker data'),
        )
        unsubscribe()
      }
    },
  })

  return unsubscribe
}
