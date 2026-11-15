export const ORDER_SIDE = {
  BUY: 'BUY',
  SELL: 'SELL',
} as const

export const ORDER_TYPE = {
  MARKET: 'MARKET',
  LIMIT: 'LIMIT',
} as const

export const TIME_IN_FORCE = {
  GTC: 'GTC',
  IOC: 'IOC',
  FOK: 'FOK',
} as const

export type SpotOrderSide = (typeof ORDER_SIDE)[keyof typeof ORDER_SIDE]
export type SpotOrderType = (typeof ORDER_TYPE)[keyof typeof ORDER_TYPE]
export type SpotTimeInForce = (typeof TIME_IN_FORCE)[keyof typeof TIME_IN_FORCE]

export type SpotBalance = {
  asset: string
  free: string
  locked: string
}

export type SpotOrderRequest =
  | {
      symbol: string
      side: SpotOrderSide
      type: typeof ORDER_TYPE.MARKET
      quantity: string
    }
  | {
      symbol: string
      side: SpotOrderSide
      type: typeof ORDER_TYPE.LIMIT
      quantity: string
      price: string
      timeInForce: SpotTimeInForce
    }

export type SpotOrderBase = Pick<SpotOrderRequest, 'symbol' | 'side' | 'quantity'>

export type SpotOpenOrder = {
  symbol: string
  orderId: number
  side: SpotOrderSide
  type: string
  price: string
  origQty: string
  executedQty: string
  status: string
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

export function isSpotSymbol(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9]+$/.test(value)
}

export function isPositiveDecimal(value: unknown): value is string {
  return (
    typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) && /[1-9]/.test(value)
  )
}

export function isTimeInForce(value: unknown): value is SpotTimeInForce {
  return value === TIME_IN_FORCE.GTC || value === TIME_IN_FORCE.IOC || value === TIME_IN_FORCE.FOK
}

export function isSpotBalance(value: unknown): value is SpotBalance {
  return (
    isRecord(value) &&
    typeof value.asset === 'string' &&
    typeof value.free === 'string' &&
    typeof value.locked === 'string'
  )
}

export function isSpotOpenOrder(value: unknown): value is SpotOpenOrder {
  return (
    isRecord(value) &&
    isSpotSymbol(value.symbol) &&
    typeof value.orderId === 'number' &&
    Number.isSafeInteger(value.orderId) &&
    value.orderId > 0 &&
    (value.side === ORDER_SIDE.BUY || value.side === ORDER_SIDE.SELL) &&
    typeof value.type === 'string' &&
    typeof value.price === 'string' &&
    typeof value.origQty === 'string' &&
    typeof value.executedQty === 'string' &&
    typeof value.status === 'string'
  )
}

export function isSpotOrderBase(value: unknown): value is Record<string, unknown> & SpotOrderBase {
  return (
    isRecord(value) &&
    isSpotSymbol(value.symbol) &&
    (value.side === ORDER_SIDE.BUY || value.side === ORDER_SIDE.SELL) &&
    isPositiveDecimal(value.quantity)
  )
}

export function parseSpotOrder(body: unknown): SpotOrderRequest | null {
  if (!isRecord(body) || !isSpotOrderBase(body)) return null

  const { symbol, side, type, quantity } = body
  const common = { symbol: symbol.toUpperCase(), side, quantity }

  if (type === ORDER_TYPE.MARKET) {
    if (body.price !== undefined || body.timeInForce !== undefined) return null
    return { ...common, type: ORDER_TYPE.MARKET }
  }

  const price = body.price
  if (type !== ORDER_TYPE.LIMIT || !isPositiveDecimal(price)) return null

  const timeInForce = body.timeInForce === undefined ? TIME_IN_FORCE.GTC : body.timeInForce

  if (!isTimeInForce(timeInForce)) return null

  return { ...common, type: ORDER_TYPE.LIMIT, price, timeInForce }
}
