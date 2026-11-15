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

export type SpotUserDataStreamMessage =
  { type: 'connection'; connected: boolean } | { type: 'event'; event: Record<string, unknown> }

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

/**
 * Checks whether a value is a non-null object that can be inspected for
 * API response or input fields.
 *
 * @param value Any value, such as a parsed JSON result.
 * @returns `true` when the value is an object and is not `null`.
 */
export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Checks whether a value is a Spot market symbol containing only Latin letters
 * and digits.
 *
 * @param value A symbol value received from a request or exchange data.
 * @returns `true` when the value has the expected type and format.
 */
export function isSpotSymbol(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9]+$/.test(value)
}

/**
 * Checks whether a decimal string represents a strictly positive number.
 * Exponential notation and zero are not accepted.
 *
 * @param value The value to validate as a decimal string.
 * @returns `true` when the string has the expected format and contains a non-zero digit.
 */
export function isPositiveDecimal(value: unknown): value is string {
  return (
    typeof value === 'string' && /^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) && /[1-9]/.test(value)
  )
}

/**
 * Checks whether a value is one of Binance's supported Time in Force values.
 *
 * @param value Any value supplied for an order's time-in-force parameter.
 * @returns `true` for `GTC`, `IOC`, or `FOK`.
 */
export function isTimeInForce(value: unknown): value is SpotTimeInForce {
  return value === TIME_IN_FORCE.GTC || value === TIME_IN_FORCE.IOC || value === TIME_IN_FORCE.FOK
}

/**
 * Checks the minimum required structure of a Spot API balance.
 *
 * @param value Any value from an account response.
 * @returns `true` when `asset`, `free`, and `locked` are strings.
 */
export function isSpotBalance(value: unknown): value is SpotBalance {
  return (
    isRecord(value) &&
    typeof value.asset === 'string' &&
    typeof value.free === 'string' &&
    typeof value.locked === 'string'
  )
}

/**
 * Checks the minimum Spot open-order structure shared by the web and API apps.
 *
 * @param value Any value from a Binance response.
 * @returns `true` when the order fields have the expected types and `orderId`
 * is a positive safe integer.
 */
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

/**
 * Checks the common required fields of a Spot order request.
 *
 * @param value Any request body.
 * @returns `true` when the symbol, side, and positive quantity are valid.
 */
export function isSpotOrderBase(value: unknown): value is Record<string, unknown> & SpotOrderBase {
  return (
    isRecord(value) &&
    isSpotSymbol(value.symbol) &&
    (value.side === ORDER_SIDE.BUY || value.side === ORDER_SIDE.SELL) &&
    isPositiveDecimal(value.quantity)
  )
}

/**
 * Validates and normalizes a Spot order request body.
 * Defaults Limit orders to `GTC` and rejects extra Market order fields or
 * unsupported parameters.
 *
 * @param body An unvalidated HTTP request body.
 * @returns A valid `SpotOrderRequest` with an uppercase symbol, or `null` if
 * the body does not match the contract.
 */
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
