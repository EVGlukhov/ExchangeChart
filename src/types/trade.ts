import type { TradeSide } from '../constants/chart'

export interface Trade {
  id: number
  time: number
  price: number
  quantity: number
  side: TradeSide
}
