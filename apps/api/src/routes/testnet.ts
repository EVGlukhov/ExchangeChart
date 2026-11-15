import { Router } from 'express'
import { isSpotSymbol, parseSpotOrder } from '@exchange-chart/shared'
import {
  cancelTestnetOrder,
  fetchTestnetBalances,
  fetchTestnetOpenOrders,
  placeTestnetOrder,
} from '../binance'

const router = Router()

router.get('/account/balances', async (req, res) => {
  try {
    const balances = await fetchTestnetBalances()
    res.json({ balances })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unknown error'
    console.error('Testnet balance request failed:', message)
    res.status(502).json({ error: message })
  }
})

router.get('/orders', async (req, res) => {
  const symbol = req.query.symbol

  if (!isSpotSymbol(symbol)) {
    return res.status(400).json({ error: 'Valid symbol is required' })
  }

  try {
    const orders = await fetchTestnetOpenOrders(symbol.toUpperCase())
    return res.json({ orders })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unknown error'
    console.error('Testnet open orders request failed:', message)
    return res.status(502).json({ error: message })
  }
})

router.post('/orders', async (req, res) => {
  const orderRequest = parseSpotOrder(req.body)

  if (!orderRequest) {
    return res.status(400).json({ error: 'Invalid order request' })
  }

  try {
    const order = await placeTestnetOrder(orderRequest)
    return res.status(201).json({ order })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unknown error'
    console.error('Testnet order failed:', message)
    return res.status(502).json({ error: message })
  }
})

router.delete('/orders/:orderId', async (req, res) => {
  const symbol = req.query.symbol
  const rawOrderId = req.params.orderId
  const orderId = Number(rawOrderId)

  if (!isSpotSymbol(symbol) || !/^[1-9]\d*$/.test(rawOrderId) || !Number.isSafeInteger(orderId)) {
    return res.status(400).json({ error: 'Valid symbol and orderId are required' })
  }

  try {
    const order = await cancelTestnetOrder(symbol.toUpperCase(), orderId)
    return res.json({ order })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : 'Unknown error'
    console.error('Testnet order cancellation failed:', message)
    return res.status(502).json({ error: message })
  }
})

export default router
