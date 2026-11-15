import type { Candle } from '../types/candle'
import type { ChartTheme } from '../types/chartTheme'
import {
  AXIS_LABEL_GAP,
  CANDLE_BODY_WIDTH_RATIO,
  CHART_MARGIN,
  VOLUME_PANEL_HEIGHT,
  createChartScales,
} from './chartScales'

export interface ChartCursor {
  x: number
  y: number
}

/**
 * Redraws the entire canvas chart: axes, candles, volume bars, and the crosshair
 * when the cursor is over the chart. The canvas dimensions account for the
 * display pixel ratio.
 *
 * @param element The canvas element to render into.
 * @param candles The candles displayed on the chart.
 * @param cursor The cursor position in local coordinates, or `null`.
 * @param chartTheme The chart colors and font settings.
 */
export function renderChart(
  element: HTMLCanvasElement,
  candles: readonly Candle[],
  cursor: ChartCursor | null,
  chartTheme: ChartTheme,
): void {
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

  drawPriceAxis(context, scales, width, chartTheme)
  drawTimeAxis(context, scales, height, chartTheme)
  drawVolumeAxis(context, scales, width, height, chartTheme)
  drawVolume(context, candles, scales, width, height, chartTheme)
  drawCandles(context, candles, scales, width, chartTheme)

  if (cursor) {
    drawCrosshair(context, cursor, scales, height, chartTheme)
  }
}

/**
 * Draws the volume scale grid and labels, as well as the top boundary of the
 * volume panel.
 *
 * @param context The canvas 2D rendering context.
 * @param scales The calculated price, time, and volume scales.
 * @param width The canvas width in CSS pixels.
 * @param height The canvas height in CSS pixels.
 * @param chartTheme The chart colors and font settings.
 */
function drawVolumeAxis(
  context: CanvasRenderingContext2D,
  scales: NonNullable<ReturnType<typeof createChartScales>>,
  width: number,
  height: number,
  chartTheme: ChartTheme,
) {
  const baseline = height - CHART_MARGIN.bottom
  const volumeTop = baseline - VOLUME_PANEL_HEIGHT
  const volumeFormatter = new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  })

  context.font = chartTheme.axis.font
  context.textAlign = 'left'
  context.textBaseline = 'middle'

  for (const volume of scales.yVolume.ticks(3)) {
    const y = scales.yVolume(volume)

    context.strokeStyle = chartTheme.grid
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(CHART_MARGIN.left, y)
    context.lineTo(width - CHART_MARGIN.right, y)
    context.stroke()

    context.fillStyle = chartTheme.axis.text
    context.fillText(volumeFormatter.format(volume), width - CHART_MARGIN.right + AXIS_LABEL_GAP, y)
  }

  context.strokeStyle = chartTheme.grid
  context.beginPath()
  context.moveTo(CHART_MARGIN.left, volumeTop)
  context.lineTo(width - CHART_MARGIN.right, volumeTop)
  context.stroke()
}

/**
 * Draws each candle's volume in the lower panel, choosing the bar color based
 * on price direction.
 *
 * @param context The canvas 2D rendering context.
 * @param candles The candles and their volumes to display.
 * @param scales The calculated chart scales.
 * @param width The canvas width, used to calculate bar width.
 * @param height The canvas height, used to position the volume panel.
 * @param chartTheme The chart colors.
 */
function drawVolume(
  context: CanvasRenderingContext2D,
  candles: readonly Candle[],
  scales: NonNullable<ReturnType<typeof createChartScales>>,
  width: number,
  height: number,
  chartTheme: ChartTheme,
) {
  const plotWidth = width - CHART_MARGIN.left - CHART_MARGIN.right
  const firstCandle = candles[0]
  const secondCandle = candles[1]

  const candleSpacing =
    firstCandle && secondCandle
      ? Math.abs(scales.x(new Date(secondCandle.time)) - scales.x(new Date(firstCandle.time)))
      : plotWidth

  const barWidth = Math.max(1, Math.min(20, candleSpacing * CANDLE_BODY_WIDTH_RATIO))

  const baseline = height - CHART_MARGIN.bottom
  const volumeTop = baseline - VOLUME_PANEL_HEIGHT

  context.save()

  context.strokeStyle = chartTheme.grid
  context.lineWidth = 1
  context.beginPath()
  context.moveTo(CHART_MARGIN.left, volumeTop)
  context.lineTo(width - CHART_MARGIN.right, volumeTop)
  context.stroke()

  for (const candle of candles) {
    const x = scales.x(new Date(candle.time))
    const y = scales.yVolume(candle.volume)
    const color =
      candle.close >= candle.open ? chartTheme.candles.rising : chartTheme.candles.falling

    context.fillStyle = color
    context.globalAlpha = 0.5
    context.fillRect(x - barWidth / 2, y, barWidth, baseline - y)
  }

  context.restore()
}

/**
 * Draws the dashed vertical and horizontal crosshair lines only when the cursor
 * is inside the chart's plotting area.
 *
 * @param context The canvas 2D rendering context.
 * @param cursor The cursor position in local canvas coordinates.
 * @param scales The scales that define the chart's plotting boundaries.
 * @param height The canvas height, used to calculate the bottom of the plotting area.
 * @param chartTheme The crosshair color and line style.
 */
function drawCrosshair(
  context: CanvasRenderingContext2D,
  cursor: ChartCursor,
  scales: NonNullable<ReturnType<typeof createChartScales>>,
  height: number,
  chartTheme: ChartTheme,
) {
  const [plotLeft, plotRight] = scales.x.range()
  const plotTop = CHART_MARGIN.top
  const plotBottom = height - CHART_MARGIN.bottom

  if (cursor.x < plotLeft || cursor.x > plotRight || cursor.y < plotTop || cursor.y > plotBottom) {
    return
  }

  context.save()
  context.strokeStyle = chartTheme.crosshair
  context.lineWidth = 1
  context.setLineDash([4, 4])

  context.beginPath()
  context.moveTo(cursor.x, plotTop)
  context.lineTo(cursor.x, plotBottom)
  context.moveTo(plotLeft, cursor.y)
  context.lineTo(plotRight, cursor.y)
  context.stroke()

  context.restore()
}

/**
 * Draws candles with wicks from low to high and bodies between open and close.
 *
 * @param context The canvas 2D rendering context.
 * @param candles The candles to display.
 * @param scales The time and price scales.
 * @param width The canvas width, used to calculate candle body width.
 * @param chartTheme The colors for rising and falling candles.
 */
function drawCandles(
  context: CanvasRenderingContext2D,
  candles: readonly Candle[],
  scales: NonNullable<ReturnType<typeof createChartScales>>,
  width: number,
  chartTheme: ChartTheme,
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
    const color = isRising ? chartTheme.candles.rising : chartTheme.candles.falling

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

/**
 * Draws the horizontal grid and price-axis labels to the right of the chart area.
 *
 * @param context The canvas 2D rendering context.
 * @param scales The scales containing the price-axis ticks.
 * @param width The canvas width, used to position labels to the right of the chart.
 * @param chartTheme The grid and text colors, and font settings.
 */
function drawPriceAxis(
  context: CanvasRenderingContext2D,
  scales: NonNullable<ReturnType<typeof createChartScales>>,
  width: number,
  chartTheme: ChartTheme,
) {
  const priceFormatter = new Intl.NumberFormat('en-US', {
    maximumSignificantDigits: 6,
  })

  context.font = chartTheme.axis.font
  context.textAlign = 'left'
  context.textBaseline = 'middle'

  for (const price of scales.y.ticks(6)) {
    const y = scales.y(price)

    context.strokeStyle = chartTheme.grid
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(CHART_MARGIN.left, y)
    context.lineTo(width - CHART_MARGIN.right, y)
    context.stroke()

    context.fillStyle = chartTheme.axis.text
    context.fillText(priceFormatter.format(price), width - CHART_MARGIN.right + 8, y)
  }
}

/**
 * Draws the time axis and vertical grid. The label format is selected based on
 * the duration of the displayed range.
 *
 * @param context The canvas 2D rendering context.
 * @param scales The time scale and its domain.
 * @param height The canvas height, used to position lines and labels.
 * @param chartTheme The grid color and font settings.
 */
function drawTimeAxis(
  context: CanvasRenderingContext2D,
  scales: NonNullable<ReturnType<typeof createChartScales>>,
  height: number,
  chartTheme: ChartTheme,
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

  context.font = chartTheme.axis.font
  context.textAlign = 'center'
  context.textBaseline = 'top'

  for (let index = 0; index <= tickCount; index++) {
    const x = plotLeft + index * tickSpacing
    const time = scales.x.invert(x)

    context.strokeStyle = chartTheme.grid
    context.lineWidth = 1
    context.beginPath()
    context.moveTo(x, CHART_MARGIN.top)
    context.lineTo(x, height - CHART_MARGIN.bottom)
    context.stroke()

    context.fillStyle = chartTheme.axis.text
    context.fillText(timeFormatter.format(time), x, height - CHART_MARGIN.bottom + 6)
  }
}
