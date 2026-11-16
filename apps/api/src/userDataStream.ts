import { isRecord, SpotUserDataStreamMessage } from '@exchange-chart/shared'
import WebSocket, { type RawData } from 'ws'
import { createTestnetUserDataStreamSubscriptionRequest } from './binance'
import { randomUUID } from 'node:crypto'

export type TestnetUserDataMessage = SpotUserDataStreamMessage

type Listener = (message: TestnetUserDataMessage) => void

const listeners = new Set<Listener>()

const BASE_RETRY_DELAY_MS = 1_000
const MAX_RETRY_DELAY_MS = 30_000
const MAX_BACKOFF_LEVEL = 5
const SUBSCRIPTION_TIMEOUT_MS = 10_000

let socket: WebSocket | undefined
let connecting = false
let subscribed = false
let reconnectTimer: NodeJS.Timeout | undefined
let subscriptionTimer: NodeJS.Timeout | undefined
let reconnectAttempt = 0

/**
 * Broadcasts a connection status or Binance event to all active SSE subscribers.
 *
 * @param message The private stream message to send to subscribers.
 */
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

/**
 * Schedules a Binance reconnect with exponential backoff capped at the
 * maximum delay.
 */
function scheduleReconnect(): void {
  if (reconnectTimer) return

  const delay = Math.min(BASE_RETRY_DELAY_MS * 2 ** reconnectAttempt, MAX_RETRY_DELAY_MS)
  reconnectAttempt = Math.min(reconnectAttempt + 1, MAX_BACKOFF_LEVEL)

  reconnectTimer = setTimeout(() => {
    reconnectTimer = undefined
    connectToBinance()
  }, delay)
}

/**
 * Clears the timer waiting for Binance to acknowledge the stream subscription.
 */
function clearSubscriptionTimer(): void {
  if (!subscriptionTimer) return

  clearTimeout(subscriptionTimer)
  subscriptionTimer = undefined
}

/**
 * Converts the supported `ws` raw data formats to UTF-8 text for JSON parsing.
 *
 * @param data A WebSocket message in one of the `RawData` formats.
 * @returns The message contents as text.
 */
function decodeMessage(data: RawData): string {
  if (Array.isArray(data)) {
    return Buffer.concat(data).toString('utf-8')
  }

  if (data instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(data)).toString()
  }

  return data.toString('utf-8')
}

/**
 * Validates the configured Binance Spot Testnet WebSocket API URL.
 *
 * @returns The validated Testnet WebSocket API URL.
 * @throws {Error} If the URL is missing, invalid, or does not point to Testnet.
 */
function getTestnetWebSocketUrl(): URL {
  const baseUrl = process.env.BINANCE_SPOT_TESTNET_WS_BASE_URL

  if (!baseUrl) {
    throw new Error('Missing environment variable: BINANCE_SPOT_TESTNET_WS_BASE_URL')
  }

  const url = new URL(baseUrl)

  if (
    url.origin !== 'wss://ws-api.testnet.binance.vision' ||
    url.pathname !== '/ws-api/v3' ||
    url.search ||
    url.hash
  ) {
    throw new Error('Binance WebSocket URL must be the Spot Testnet WebSocket API endpoint')
  }

  return url
}

/**
 * Connects to the Binance WebSocket API, subscribes to the private account stream,
 * and forwards account events to active SSE subscribers.
 */
function connectToBinance(): void {
  if (connecting || subscribed || socket?.readyState === WebSocket.OPEN || reconnectTimer) return

  connecting = true

  try {
    const request = createTestnetUserDataStreamSubscriptionRequest(randomUUID())
    const currentSocket = new WebSocket(getTestnetWebSocketUrl())

    socket = currentSocket

    currentSocket.on('open', () => {
      subscriptionTimer = setTimeout(() => {
        if (socket === currentSocket && !subscribed) {
          console.error('Timed out waiting for Binance Testnet stream subscription')
          currentSocket.close(1011, 'Subscription timed out')
        }
      }, SUBSCRIPTION_TIMEOUT_MS)

      currentSocket.send(JSON.stringify(request), (cause) => {
        if (!cause) return

        console.error('Failed to send Binance Testnet stream subscription:', cause)
        currentSocket.close()
      })
    })

    currentSocket.on('message', (data) => {
      let message: unknown

      try {
        message = JSON.parse(decodeMessage(data))
      } catch (cause) {
        console.error('Failed to parse Binance Testnet WebSocket API message:', cause)
        return
      }

      if (!isRecord(message)) {
        console.error('Unexpected Binance Testnet WebSocket API message:', message)
        return
      }

      if (message.id === request.id) {
        if (
          message.status !== 200 ||
          !isRecord(message.result) ||
          typeof message.result.subscriptionId !== 'number'
        ) {
          console.error('Binance Testnet stream subscription failed:', message.error ?? message)
          currentSocket.close(1011, 'Subscription failed')
          return
        }

        clearSubscriptionTimer()
        connecting = false
        subscribed = true
        reconnectAttempt = 0
        publish({ type: 'connection', connected: true })
        return
      }

      if (!isRecord(message.event)) {
        console.error('Unexpected Binance Testnet stream event:', message)
        return
      }

      const event = message.event

      if (event.e === 'serverShutdown') {
        console.warn('Binance Testnet WebSocket API is shutting down; reconnecting')
        currentSocket.close(1012, 'Server shutdown')
      }

      publish({ type: 'event', event })
    })

    currentSocket.on('error', (cause) => {
      console.error('Binance Testnet WebSocket error:', cause)
    })

    currentSocket.on('close', () => {
      if (socket !== currentSocket) return

      socket = undefined
      connecting = false
      subscribed = false
      clearSubscriptionTimer()
      publish({ type: 'connection', connected: false })
      scheduleReconnect()
    })
  } catch (cause) {
    connecting = false
    subscribed = false
    console.error('Failed to connect to Binance Testnet user stream:', cause)
    publish({ type: 'connection', connected: false })
    scheduleReconnect()
  }
}

/**
 * Adds a listener to the shared Testnet event stream and starts the connection
 * if it has not started yet.
 *
 * @param listener Receives Binance events and connection status updates.
 * @returns A function that removes this listener; the shared server socket keeps running.
 */
export function subscribeToTestnetUserDataStream(listener: Listener): () => void {
  listeners.add(listener)
  publish({ type: 'connection', connected: socket?.readyState === WebSocket.OPEN })
  connectToBinance()

  return () => {
    listeners.delete(listener)
  }
}
