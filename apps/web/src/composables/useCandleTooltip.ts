import { computed, type CSSProperties, type Ref } from 'vue'
import type { Candle } from '../types/candle'
import type { ChartCursor } from '../utils/chartRenderer'
import { CHART_MARGIN, createChartScales } from '../utils/chartScales'
import { useChartTheme } from './useChartTheme'

const TOOLTIP_VIEWPORT_PADDING = 8

/**
 * Finds the candle with the nearest open time in an array sorted by time.
 * If two candles are equally close, selects the earlier one.
 *
 * @param candles Candles sorted by ascending `time`.
 * @param targetTime The open time in milliseconds to find the nearest candle for.
 * @returns The nearest candle, or `null` if the array is empty.
 */
function findNearestCandle(candles: readonly Candle[], targetTime: number): Candle | null {
  let low = 0
  let high = candles.length

  while (low < high) {
    const middle = Math.floor((low + high) / 2)
    const candle = candles[middle]

    if (candle && candle.time < targetTime) {
      low = middle + 1
    } else {
      high = middle
    }
  }

  const after = candles[low]
  const before = candles[low - 1]

  if (!before) return after ?? null
  if (!after) return before

  return targetTime - before.time <= after.time - targetTime ? before : after
}

/**
 * Creates reactive tooltip state for the candle under the cursor.
 * Converts the cursor position to a time, selects the nearest candle, and keeps
 * the tooltip within the canvas bounds.
 *
 * @param canvas A reference to the chart canvas, or `null` before the element is created.
 * @param candles The reactive list of displayed candles.
 * @param cursor Reactive cursor coordinates in the canvas's local coordinate system.
 * @returns An object containing the computed tooltip and its CSS position, or `null`.
 */
export function useCandleTooltip(
  canvas: Ref<HTMLCanvasElement | null>,
  candles: Ref<Candle[]>,
  cursor: Ref<ChartCursor | null>,
) {
  const chartTheme = useChartTheme()

  const tooltip = computed<{
    candle: Candle
    style: CSSProperties
  } | null>(() => {
    const element = canvas.value
    const position = cursor.value
    const data = candles.value

    if (!element || !position || data.length === 0) return null

    const { width, height } = element.getBoundingClientRect()
    const scales = createChartScales(data, { width, height })

    if (!scales) return null

    const [plotLeft, plotRight] = scales.x.range()
    const plotTop = CHART_MARGIN.top
    const plotBottom = height - CHART_MARGIN.bottom

    if (
      position.x < plotLeft ||
      position.x > plotRight ||
      position.y < plotTop ||
      position.y > plotBottom
    ) {
      return null
    }

    const targetTime = scales.x.invert(position.x).getTime()
    const candle = findNearestCandle(data, targetTime)

    if (!candle) return null

    const { tooltip } = chartTheme.value

    const tooltipWidth = Math.min(tooltip.width, width - TOOLTIP_VIEWPORT_PADDING * 2)
    const tooltipHeight = Math.min(tooltip.height, height - TOOLTIP_VIEWPORT_PADDING * 2)

    const left = Math.max(
      TOOLTIP_VIEWPORT_PADDING,
      Math.min(position.x + tooltip.offset, width - tooltipWidth - TOOLTIP_VIEWPORT_PADDING),
    )

    const top = Math.max(
      TOOLTIP_VIEWPORT_PADDING,
      Math.min(position.y + tooltip.offset, height - tooltipHeight - TOOLTIP_VIEWPORT_PADDING),
    )

    return {
      candle,
      style: {
        left: `${left}px`,
        top: `${top}px`,
        width: `${tooltipWidth}px`,
        height: `${tooltipHeight}px`,
      },
    }
  })

  return { tooltip }
}
