import { isRecord } from '@exchange-chart/shared'
import { TRADE_SIDE, type Market, type Timeframe } from '../constants/chart'
import type { Candle } from '../types/candle'
import type { SpotTicker } from '../types/spotTicker'
import type { Trade } from '../types/trade'
import { subscribeWithReconnect } from './reconnectingWebSocket'

const BINANCE_TICKER_24HR_EVENT = '24hrTicker'

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
