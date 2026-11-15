import { createHmac } from 'node:crypto'
import {
  ORDER_TYPE,
  isRecord,
  isSpotBalance,
  isSpotOpenOrder,
  type SpotBalance,
  type SpotOpenOrder,
  type SpotOrderRequest,
} from '@exchange-chart/shared'
import { URLSearchParams } from 'node:url'

const DEFAULT_RECV_WINDOW_MS = 5_000

/**
 * Returns a required environment variable or fails with an explicit error.
 *
 * @param name The environment variable name.
 * @returns The non-empty variable value.
 * @throws {Error} If the variable is missing or empty.
 */
function requiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) throw new Error(`Missing environment variable: ${name}`)

  return value
}

/**
 * Sends a signed HMAC request to Binance Spot Testnet.
 * Adds a timestamp and recvWindow, signs the parameters with the API secret,
 * and limits the request duration.
 *
 * @param path The Binance API path, such as `/api/v3/account`.
 * @param method The HTTP method supported by this request.
 * @param inputParams Request parameters before the signature is added.
 * @returns The unvalidated JSON body of a successful response.
 * @throws {Error} If the base URL is not Testnet, credentials are missing,
 * the request fails, or Binance returns an unsuccessful status.
 */
async function signedTestnetRequest(
  path: string,
  method: 'GET' | 'POST' | 'DELETE',
  inputParams: URLSearchParams,
): Promise<unknown> {
  const baseUrl = requiredEnv('BINANCE_SPOT_TESTNET_BASE_URL')

  if (new URL(baseUrl).origin !== 'https://testnet.binance.vision') {
    throw new Error('Binance base URL must be the Spot Testnet')
  }

  const params = new URLSearchParams(inputParams)
  params.set('recvWindow', String(DEFAULT_RECV_WINDOW_MS))
  params.set('timestamp', Date.now().toString())

  const signature = createHmac('sha256', requiredEnv('BINANCE_SPOT_TESTNET_API_SECRET'))
    .update(params.toString())
    .digest('hex')

  const url = new URL(path, baseUrl)
  url.search = `${params.toString()}&signature=${signature}`

  const response = await fetch(url, {
    method,
    headers: {
      'X-MBX-APIKEY': requiredEnv('BINANCE_SPOT_TESTNET_API_KEY'),
    },
    signal: AbortSignal.timeout(10_000),
  })

  const data: unknown = await response.json()

  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.msg === 'string' ? data.msg : `HTTP ${response.status}`

    throw new Error(`Binance Testnet request failed: ${message}`)
  }

  return data
}

/**
 * Loads the Spot Testnet account balances and validates each response entry.
 *
 * @returns Balances with their free and locked amounts.
 * @throws {Error} If the request fails or Binance returns an unexpected response.
 */
export async function fetchTestnetBalances(): Promise<SpotBalance[]> {
  const data: unknown = await signedTestnetRequest('/api/v3/account', 'GET', new URLSearchParams())

  if (!isRecord(data) || !Array.isArray(data.balances)) {
    throw new Error('Unexpected Binance Testnet account response')
  }

  return data.balances.map((item, index) => {
    if (!isSpotBalance(item)) {
      throw new Error(`Invalid balance entry at index ${index}`)
    }

    return { asset: item.asset, free: item.free, locked: item.locked }
  })
}

/**
 * Places a Market or Limit order on Spot Testnet.
 *
 * @param order A validated order request containing the symbol, side, type,
 * quantity, and any required Limit order parameters.
 * @returns The created order fields from Binance's response.
 * @throws {Error} If Binance rejects the request or the response lacks a numeric `orderId`.
 */
export async function placeTestnetOrder(order: SpotOrderRequest): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({
    symbol: order.symbol,
    side: order.side,
    type: order.type,
    quantity: order.quantity,
  })

  if (order.type === ORDER_TYPE.LIMIT) {
    params.set('price', order.price)
    params.set('timeInForce', order.timeInForce)
  }

  const data = await signedTestnetRequest('/api/v3/order', 'POST', params)

  if (!isRecord(data) || typeof data.orderId !== 'number') {
    throw new Error('Unexpected Binance Testnet order response')
  }

  return data
}

/**
 * Cancels an order on Spot Testnet by its symbol and ID.
 *
 * @param symbol The market symbol associated with the order.
 * @param orderId The Binance order ID.
 * @returns The canceled order fields from Binance's response.
 * @throws {Error} If Binance rejects the cancellation or returns an unexpected response.
 */
export async function cancelTestnetOrder(
  symbol: string,
  orderId: number,
): Promise<Record<string, unknown>> {
  const params = new URLSearchParams({
    symbol,
    orderId: String(orderId),
  })

  const data = await signedTestnetRequest('/api/v3/order', 'DELETE', params)

  if (!isRecord(data) || typeof data.orderId !== 'number' || typeof data.status !== 'string') {
    throw new Error('Unexpected Binance Testnet cancel response')
  }

  return data
}

/**
 * Loads open orders for the specified Spot market and validates each response entry.
 *
 * @param symbol The market symbol, such as `BTCUSDT`.
 * @returns Validated open orders for the symbol.
 * @throws {Error} If the request fails or the response contains an invalid order entry.
 */
export async function fetchTestnetOpenOrders(symbol: string): Promise<SpotOpenOrder[]> {
  const data = await signedTestnetRequest(
    '/api/v3/openOrders',
    'GET',
    new URLSearchParams({ symbol }),
  )

  if (!Array.isArray(data)) {
    throw new Error('Unexpected Binance Testnet open orders response')
  }

  return data.map((item, index) => {
    if (!isSpotOpenOrder(item)) {
      throw new Error(`Invalid open order at index ${index}`)
    }

    return {
      symbol: item.symbol,
      orderId: item.orderId,
      side: item.side,
      type: item.type,
      price: item.price,
      origQty: item.origQty,
      executedQty: item.executedQty,
      status: item.status,
    }
  })
}

/**
 * Creates or keeps alive a Binance Spot Testnet User Data Stream.
 * This endpoint uses the API key but does not require an HMAC signature.
 *
 * @param method `POST` to create a listenKey or `PUT` to keep it alive.
 * @param listenKey The existing stream key; required for `PUT`.
 * @returns The unvalidated JSON response body, or `null` if the body is empty.
 * @throws {Error} If the base URL is not Testnet, Binance rejects the request,
 * or the response cannot be parsed as JSON.
 */
async function requestTestnetUserDataStream(method: 'POST' | 'PUT', listenKey?: string) {
  const baseUrl = requiredEnv('BINANCE_SPOT_TESTNET_BASE_URL')

  if (new URL(baseUrl).origin !== 'https://testnet.binance.vision') {
    throw new Error('Binance base URL must be the Spot Testnet')
  }

  const url = new URL('/api/v3/userDataStream', baseUrl)

  if (listenKey) {
    url.searchParams.set('listenKey', listenKey)
  }

  const response = await fetch(url, {
    method,
    headers: {
      'X-MBX-APIKEY': requiredEnv('BINANCE_SPOT_TESTNET_API_KEY'),
    },
    signal: AbortSignal.timeout(10_000),
  })

  const responseText = await response.text()
  const data: unknown = responseText ? JSON.parse(responseText) : null

  if (!response.ok) {
    const message =
      isRecord(data) && typeof data.msg === 'string' ? data.msg : `HTTP ${response.status}`

    throw new Error(`Binance Testnet user stream request failed: ${message}`)
  }

  return data
}

/**
 * Creates a listenKey for the private Spot Testnet account event stream.
 *
 * @returns The listenKey used by the server to connect to the Binance WebSocket.
 * @throws {Error} If the request fails or Binance does not return a listenKey.
 */
export async function createTestnetListenKey(): Promise<string> {
  const data = await requestTestnetUserDataStream('POST')

  if (!isRecord(data) || typeof data.listenKey !== 'string' || data.listenKey.length === 0) {
    throw new Error('Unexpected Binance Testnet listenKey response')
  }

  return data.listenKey
}

/**
 * Keeps a private Binance Spot Testnet stream from expiring.
 *
 * @param listenKey The key previously returned by `createTestnetListenKey`.
 * @returns A promise that resolves after Binance confirms the keepalive request.
 * @throws {Error} If the keepalive request fails.
 */
export async function keepAliveTestnetListenKey(listenKey: string): Promise<void> {
  await requestTestnetUserDataStream('PUT', listenKey)
}
