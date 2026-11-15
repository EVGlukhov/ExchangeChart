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

function requiredEnv(name: string): string {
  const value = process.env[name]

  if (!value) throw new Error(`Missing environment variable: ${name}`)

  return value
}

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
