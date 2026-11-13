import { scaleLinear, scaleTime, type ScaleLinear, type ScaleTime } from 'd3-scale'
import type { Candle } from '../types/candle'

export const CHART_MARGIN = {
  top: 16,
  right: 72,
  bottom: 28,
  left: 12,
} as const

export const CANDLE_BODY_WIDTH_RATIO = 0.65
export const CHART_X_INSET = 12
export const VOLUME_PANEL_HEIGHT = 64
export const VOLUME_PANEL_GAP = 12
export const AXIS_LABEL_GAP = 8

type ChartScales = {
  x: ScaleTime<number, number>
  y: ScaleLinear<number, number>
  yVolume: ScaleLinear<number, number>
}

interface ChartSize {
  width: number
  height: number
}

export function createChartScales(
  candles: readonly Candle[],
  { width, height }: ChartSize,
): ChartScales | null {
  const { top, right, bottom, left } = CHART_MARGIN

  if (
    candles.length === 0 ||
    width <= left + right + CHART_X_INSET * 2 ||
    height <= top + bottom + VOLUME_PANEL_HEIGHT + VOLUME_PANEL_GAP
  ) {
    return null
  }

  const firstCandle = candles[0]
  const lastCandle = candles[candles.length - 1]

  if (!firstCandle || !lastCandle) {
    return null
  }

  const lowestPrice = Math.min(...candles.map((candle) => candle.low))
  const highestPrice = Math.max(...candles.map((candle) => candle.high))
  const volumeTop = height - bottom - VOLUME_PANEL_HEIGHT
  const priceBottom = volumeTop - VOLUME_PANEL_GAP
  const maxVolume = Math.max(...candles.map((candle) => candle.volume))
  const priceRange = highestPrice - lowestPrice
  const padding = priceRange * 0.05 || Math.abs(highestPrice) * 0.005 || 1

  const x = scaleTime()
    .domain([new Date(firstCandle.time), new Date(lastCandle.time)])
    .range([left + CHART_X_INSET, width - right - CHART_X_INSET])

  const y = scaleLinear()
    .domain([lowestPrice - padding, highestPrice + padding])
    .nice()
    .range([priceBottom, top])

  const yVolume = scaleLinear()
    .domain([0, maxVolume || 1])
    .range([height - bottom, volumeTop])

  return { x, y, yVolume }
}
