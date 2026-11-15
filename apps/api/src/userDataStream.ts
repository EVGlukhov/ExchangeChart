import { isRecord } from '@exchange-chart/shared'
import WebSocket, { type RawData } from 'ws'
import { createTestnetListenKey, keepAliveTestnetListenKey } from './binance'

export type TestnetUserDataMessage =
  { type: 'connection'; connected: boolean } | { type: 'event'; event: Record<string, unknown> }

type Listener = (message: TestnetUserDataMessage) => void

const listeners = new Set<Listener>()

const BASE_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 30_000
const MAX_BACKOFF_LEVEL = 5

let socket: WebSocket | undefined
let connecting = false
let reconnectTimer: NodeJS.Timeout | undefined
let keepAliveTimer: NodeJS.Timeout | undefined
let reconnectAttempt = 0

function publish(message: TestnetUserDataMessage): void {
  for (const listener of listeners) {
    try {
      listener(message)
    } catch (cause) {
      console.error('Failed to deliver Testnet user stream event:', cause)
      listeners.delete(listener)
    }
  }
}

function scheduleReconnect(): void {
  if (reconnectTimer) return

  const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** reconnectAttempt, MAX_RETRY_DELAY_MS)
  reconnectAttempt = Math.min(reconnectAttempt + 1, MAX_BACKOFF_LEVEL)

  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined
    void connectToBinance()
  }, delay)
}

function decodeMessage(data: RawData): string {
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString('utf-8')
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(data)).toString()
  }

  return data.toString('utf-8')
}

function getTestnetWebSocketUrl(listenKey: string): URL {
  const baseUrl = process.env.BINANCE_SPOT_TESTNET_WS_BASE_URL

  if (!baseUrl) {
    throw new Error('Missing environment variable: BINANCE_SPOT_TESTNET_WS_BASE_URL')
  }

  const url = new URL(`/ws/${encodeURIComponent(listenKey)}`, baseUrl)

  if (url.origin !== 'wss://stream.testnet.binance.vision') {
    throw new Error('Binance WebSocket URL must be the Spot Testnet')
  }

  return url
}

async function connectToBinance(): Promise<void> {
  if (connecting || socket?.readyState === WebSocket.OPEN || reconnectTimer) return

  connecting = true

  try {
    const listenKey = await createTestnetListenKey()
    const currentSocket = new WebSocket(getTestnetWebSocketUrl(listenKey))

    socket = currentSocket

    currentSocket.on('open', () => {
      connecting = false
      reconnectAttempt = 0
      publish({ type: 'connection', connected: true })

      keepAliveTimer = setInterval(
        () => {
          void keepAliveTestnetListenKey(listenKey).catch((cause: unknown) => {
            console.error('Failed to keep Testnet user stream alive:', cause)

            if (currentSocket.readyState === WebSocket.OPEN) {
              currentSocket.close()
            }
          })
        },
        30 * 60 * 1_000,
      )
    })

    currentSocket.on('message', (data) => {
      let event: unknown

      try {
        event = JSON.parse(decodeMessage(data))
      } catch (cause) {
        console.error('Failed to parse Binance Testnet user stream message:', cause)
        return
      }

      if (!isRecord(event)) {
        console.error('Unexpected Binance Testnet user stream event:', event)
        return
      }

      publish({ type: 'event', event })
    })

    currentSocket.on('error', (cause) => {
      console.error('Binance Testnet user stream error:', cause)
    })

    currentSocket.on('close', () => {
      if (socket !== currentSocket) return

      socket = undefined
      connecting = false

      if (keepAliveTimer) {
        clearInterval(keepAliveTimer)
        keepAliveTimer = undefined
      }

      publish({ type: 'connection', connected: false })
      scheduleReconnect()
    })
  } catch (cause) {
    connecting = false
    console.error('Failed to connect to Binance Testnet user stream:', cause)
    publish({ type: 'connection', connected: false })
    scheduleReconnect()
  }
}

export function subscribeToTestnetUserDataStream(listener: Listener): () => void {
  listeners.add(listener)
  publish({ type: 'connection', connected: socket?.readyState === WebSocket.OPEN })
  void connectToBinance()

  return () => {
    listeners.delete(listener)
  }
}
