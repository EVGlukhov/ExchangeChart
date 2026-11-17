import { Router, type Request, type Response } from 'express'
import { isSpotSymbol, parseSpotOrder } from '@exchange-chart/shared'
import {
  cancelTestnetOrder,
  fetchTestnetBalances,
  fetchTestnetOpenOrders,
  placeTestnetOrder,
} from '../binance.js'
import { subscribeToTestnetUserDataStream } from '../userDataStream.js'

const router = Router()

const SSE_HEARTBEAT_INTERVAL_MS = 20_000

/**
 * Loads the Testnet account balances and returns them to the client.
 *
 * @param _request Express request; this route does not require a body or parameters.
 * @param response Express response containing the balances or an API error.
 */
async function getTestnetBalances(_request: Request, response: Response): Promise<void> {
  try {
    const balances = await fetchTestnetBalances()
    response.json({ balances })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unknown error'
    console.error('Testnet balance request failed:', message)
    response.status(502).json({ error: message })
  }
}

/**
 * Validates the query symbol and loads the open orders for that market.
 *
 * @param request Express request with the expected string query parameter `symbol`.
 * @param response Express response containing the orders or a validation/API error.
 */
async function getTestnetOpenOrders(request: Request, response: Response): Promise<void> {
  const symbol = request.query.symbol

  if (!isSpotSymbol(symbol)) {
    response.status(400).json({ error: 'Valid symbol is required' })
    return
  }

  try {
    const orders = await fetchTestnetOpenOrders(symbol.toUpperCase())
    response.json({ orders })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unknown error'
    console.error('Testnet open orders request failed:', message)
    response.status(502).json({ error: message })
  }
}

/**
 * Validates the request body, places a Market or Limit order on Testnet,
 * and returns the created order.
 *
 * @param request Express request whose body is validated by `parseSpotOrder`.
 * @param response Express response containing the created order or a validation/API error.
 */
async function postTestnetOrder(request: Request, response: Response): Promise<void> {
  const orderRequest = parseSpotOrder(request.body)

  if (!orderRequest) {
    response.status(400).json({ error: 'Invalid order request' })
    return
  }

  try {
    const order = await placeTestnetOrder(orderRequest)
    response.status(201).json({ order })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unknown error'
    console.error('Testnet order failed:', message)
    response.status(502).json({ error: message })
  }
}

/**
 * Opens an SSE response to forward private Binance stream events to the client.
 * Sends periodic heartbeat comments and releases the subscription when the
 * HTTP connection closes.
 *
 * @param _request Express request; this route does not require parameters.
 * @param response The long-lived SSE response to the client.
 */
function streamTestnetOrderEvents(_request: Request, response: Response): void {
  response.set({
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'Content-Type': 'text/event-stream',
  })

  response.flushHeaders()

  const unsubscribe = subscribeToTestnetUserDataStream((message) => {
    response.write(`data: ${JSON.stringify(message)}\n\n`)
  })

  const heartbeat = setInterval(() => {
    response.write(': keep-alive\n\n')
  }, SSE_HEARTBEAT_INTERVAL_MS)

  response.on('close', () => {
    clearInterval(heartbeat)
    unsubscribe()
  })
}

/**
 * Validates the symbol and order ID, then cancels the order on Testnet.
 *
 * @param request Express request with `orderId` in the path and `symbol` in the query.
 * @param response Express response containing the cancellation result or a validation/API error.
 */
async function deleteTestnetOrder(request: Request, response: Response): Promise<void> {
  const symbol = request.query.symbol
  const rawOrderId = request.params.orderId
  const orderId = Number(rawOrderId)

  if (
    !isSpotSymbol(symbol) ||
    typeof rawOrderId !== 'string' ||
    !/^[1-9]\d*$/.test(rawOrderId) ||
    !Number.isSafeInteger(orderId)
  ) {
    response.status(400).json({ error: 'Valid symbol and orderId are required' })
    return
  }

  try {
    const order = await cancelTestnetOrder(symbol.toUpperCase(), orderId)
    response.json({ order })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unknown error'
    console.error('Testnet order cancellation failed:', message)
    response.status(502).json({ error: message })
  }
}

router.get('/account/balances', getTestnetBalances)
router.get('/orders', getTestnetOpenOrders)
router.post('/orders', postTestnetOrder)
router.get('/orders/events', streamTestnetOrderEvents)
router.delete('/orders/:orderId', deleteTestnetOrder)

export default router
