import type { Candle } from '../types/candle'
import { CANDLE_BODY_WIDTH_RATIO, CHART_MARGIN, createChartScales } from './chartScales'
import { getChartStyles, type ChartStyles } from './chartStyles'

export interface ChartCursor {
  x: number
  y: number
}

export function renderChart(element: HTMLCanvasElement, candles: readonly Candle[]): void {
  const { width, height } = element.getBoundingClientRect()
  if (width === 0 || height === 0) return

  const pixelRatio = window.devicePixelRatio || 1
  element.width = Math.round(width * pixelRatio)
  element.height = Math.round(height * pixelRatio)

  const context = element.getContext('2d')
  if (!context) return

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)

  const scales = createChartScales(candles, { width, height })
  if (!scales) return

  const styles = getChartStyles()

  drawPriceAxis(context, scales, width, styles)
  drawTimeAxis(context, scales, height, styles)
  drawCandles(context, candles, scales, width, styles)
}

function drawCandles(
  context: CanvasRenderingContext2D,
  candles: readonly Candle[],
  scales: NonNullable<ReturnType<typeof createChartScales>>,
  width: number,
  styles: ChartStyles,
) {
  const plotWidth = width - CHART_MARGIN.left - CHART_MARGIN.right

  const firstCandle = candles[0]
  const secondCandle = candles[1]

  const candleSpacing =
    firstCandle && secondCandle
      ? Math.abs(scales.x(new Date(secondCandle.time)) - scales.x(new Date(firstCandle.time)))
      : plotWidth

  const bodyWidth = Math.max(1, Math.min(20, candleSpacing * CANDLE_BODY_WIDTH_RATIO))

  for (const candle of candles) {
    const x = scales.x(new Date(candle.time))
    const openY = scales.y(candle.open)
    const closeY = scales.y(candle.close)
    const isRising = candle.close >= candle.open
    const color = isRising ? styles.candles.rising : styles.candles.falling

    context.strokeStyle = color
    context.beginPath()
    context.moveTo(x, scales.y(candle.high))
    context.lineTo(x, scales.y(candle.low))
    context.stroke()

    context.fillStyle = color
    const bodyTop = Math.min(openY, closeY)
    const bodyHeight = Math.max(1, Math.abs(closeY - openY))
    context.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight)
  }
}

function drawPriceAxis(
  context: CanvasRenderingContext2D,
  scales: NonNullable<ReturnType<typeof createChartScales>>,
  width: number,
  styles: ChartStyles,
) {
  const priceFormatter = new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 6,
  })

  context.font = styles.axis.font
  context.textAlign = 'left'
  context.textBaseline = 'middle'

  for (const price of scales.y.ticks(6)) {
    const y = scales.y(price)

    context.strokeStyle = styles.grid
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(CHART_MARGIN.left, y)
    context.lineTo(width - CHART_MARGIN.right, y)
    context.stroke()

    context.fillStyle = styles.axis.text
    context.fillText(priceFormatter.format(price), width - CHART_MARGIN.right + 8, y)
  }
}

function drawTimeAxis(
  context: CanvasRenderingContext2D,
  scales: NonNullable<ReturnType<typeof createChartScales>>,
  height: number,
  styles: ChartStyles,
) {
  const [plotLeft, plotRight] = scales.x.range()
  const plotWidth = plotRight - plotLeft
  const targetTickSpacing = 100

  const tickCount = Math.max(1, Math.floor(plotWidth / targetTickSpacing))
  const tickSpacing = plotWidth / tickCount

  const [start, end] = scales.x.domain()
  const timeRange = end.getTime() - start.getTime()

  const timeFormatter = new Intl.DateTimeFormat(
    undefined,
    timeRange <= 2 * 24 * 60 * 60 * 1000
      ? { hour: '2-digit', minute: '2-digit' }
      : timeRange <= 365 * 24 * 60 * 60 * 1000
        ? { month: 'short', day: 'numeric' }
        : { month: 'short', year: 'numeric' },
  )

  context.font = styles.axis.font
  context.textAlign = 'center'
  context.textBaseline = 'top'

  for (let index = 0; index <= tickCount; index++) {
    const x = plotLeft + index * tickSpacing
    const time = scales.x.invert(x)

    context.strokeStyle = styles.grid
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(x, CHART_MARGIN.top)
    context.lineTo(x, height - CHART_MARGIN.bottom)
    context.stroke()

    context.fillStyle = styles.axis.text
    context.fillText(timeFormatter.format(time), x, height - CHART_MARGIN.bottom + 6)
  }
}
