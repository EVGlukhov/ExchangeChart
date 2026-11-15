import {
  isRecord,
  isSpotOpenOrder,
  type SpotOpenOrder,
  type SpotUserDataStreamMessage,
} from '@exchange-chart/shared'
import type { Market } from '../constants/chart'

/**
 * Sends a request to the local Testnet API, parses its JSON response, and turns
 * unsuccessful HTTP statuses into readable errors.
 *
 * @param path API path relative to the current origin, such as `/api/testnet/orders`.
 * @param init Optional `fetch` options, such as the method, headers, or abort signal.
 * @returns The JSON response body without assuming its structure.
 * @throws {Error} If the request fails at the network level, the response is not JSON,
 * or the API returns an unsuccessful HTTP status.
 */
async function requestJson(path: string, init?: RequestInit): Promise<unknown> {
  const response = await fetch(path, init)
  const data: unknown = await response.json()

  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.error === 'string'
        ? data.error
        : `Testnet API request failed (${response.status})`

    throw new Error(message)
  }

  return data
}

/**
 * Validates one open-order entry returned by the API.
 *
 * @param order An unknown value from the API response.
 * @param index The entry's array position, used to identify invalid data.
 * @returns The order narrowed to the `SpotOpenOrder` structure.
 * @throws {Error} If the entry does not match the `SpotOpenOrder` contract.
 */
function parseOpenOrder(order: unknown, index: number): SpotOpenOrder {
  if (!isSpotOpenOrder(order)) {
    throw new Error(`Invalid open order at index ${index}`)
  }

  return order
}

/**
 * Loads open orders for the selected market from the local Testnet API and
 * validates the structure of each response entry.
 *
 * @param symbol The market symbol, such as `BTCUSDT`.
 * @param signal An optional signal to abort the HTTP request, for example when the market changes.
 * @returns The selected market's open orders.
 * @throws {Error} If the request fails, the response has an invalid shape, or it contains
 * an invalid order entry.
 */
export async function fetchTestnetOpenOrders(
  symbol: Market,
  signal?: AbortSignal,
): Promise<SpotOpenOrder[]> {
  const params = new URLSearchParams({ symbol })
  const data = await requestJson(`/api/testnet/orders?${params}`, { signal })

  if (!isRecord(data) || !Array.isArray(data.orders)) {
    throw new Error('Invalid open orders response from Testnet API')
  }

  const orders: unknown[] = data.orders
  return orders.map(parseOpenOrder)
}

/**
 * Cancels a Testnet order through the local API and verifies that the response
 * contains the canceled order's ID.
 *
 * @param symbol The market symbol associated with the order.
 * @param orderId The numeric Binance order ID.
 * @returns A promise that resolves after the API confirms the cancellation.
 * @throws {Error} If the request fails or the API returns an unexpected response shape.
 */
export async function cancelTestnetOrder(symbol: Market, orderId: number): Promise<void> {
  const params = new URLSearchParams({ symbol })
  const data = await requestJson(`/api/testnet/orders/${orderId}?${params}`, { method: 'DELETE' })

  if (!isRecord(data) || !isRecord(data.order) || typeof data.order.orderId !== 'number') {
    throw new Error('Invalid cancellation response from Testnet API')
  }
}

/**
 * Validates an unknown SSE JSON value and narrows it to a supported order-stream
 * message type.
 *
 * @param value The value parsed from an SSE message.
 * @returns A validated connection-status or Binance-event message.
 * @throws {Error} If the value does not match the `SpotUserDataStreamMessage` contract.
 */
function parseUserDataMessage(value: unknown): SpotUserDataStreamMessage {
  if (!isRecord(value)) {
    throw new Error('Invalid Testnet user stream message')
  }

  if (value.type === 'connection' && typeof value.connected === 'boolean') {
    return { type: 'connection', connected: value.connected }
  }

  if (value.type === 'event' && isRecord(value.event)) {
    return { type: 'event', event: value.event }
  }

  throw new Error('Unexpected Testnet user stream message')
}

/**
 * Subscribes to the server-sent event stream of private Binance Testnet events.
 * The browser's `EventSource` reconnects automatically after network failures;
 * calling the returned function closes the stream and stops those retries.
 *
 * @param handlers Callbacks for valid messages, stream open/recovery, and connection or data errors.
 * @param handlers.onMessage Called for each validated stream message.
 * @param handlers.onOpen Optional callback for a successful SSE connection or reconnection.
 * @param handlers.onError Called for network errors or invalid messages.
 * @returns An unsubscribe function that closes the `EventSource`.
 */
export function subscribeTestnetUserDataStream(handlers: {
  onMessage: (message: SpotUserDataStreamMessage) => void
  onOpen?: () => void
  onError: (error: Error) => void
}): () => void {
  const source = new EventSource('/api/testnet/orders/events')

  /**
   * Notifies the caller that the SSE connection has opened or recovered.
   */
  function handleOpen(): void {
    handlers.onOpen?.()
  }

  /**
   * Parses and validates an SSE message before passing it to the caller.
   *
   * @param event A browser event whose `data` field contains a JSON string.
   */
  function handleMessage(event: MessageEvent<string>): void {
    try {
      const message: unknown = JSON.parse(event.data)
      handlers.onMessage(parseUserDataMessage(message))
    } catch (cause) {
      source.close()
      handlers.onError(
        cause instanceof Error ? cause : new Error('Invalid Testnet user stream data'),
      )
    }
  }

  /**
   * Reports a network error while leaving `EventSource` open to retry automatically.
   */
  function handleError(): void {
    handlers.onError(new Error('Testnet order updates disconnected; reconnecting'))
  }

  /**
   * Closes the SSE connection and disables the browser's automatic reconnection.
   */
  function unsubscribe(): void {
    source.close()
  }

  source.onopen = handleOpen
  source.onmessage = handleMessage
  source.onerror = handleError

  return unsubscribe
}
