import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import type { Candle } from '../types/candle'
import { renderChart, type ChartCursor } from '../utils/chartRenderer'
import { useChartTheme } from './useChartTheme'

/**
 * Connects reactive candle and cursor data to canvas rendering, redraws the
 * chart when the data or container size changes, and releases the ResizeObserver.
 *
 * @param canvas A reference to the chart canvas element.
 * @param candles The reactive candle series to render.
 * @param cursor The reactive crosshair position, or `null`.
 * @returns An object containing a function to redraw the chart manually.
 */
export function useCanvasChart(
  canvas: Ref<HTMLCanvasElement | null>,
  candles: Ref<Candle[]>,
  cursor: Ref<ChartCursor | null>,
) {
  const chartTheme = useChartTheme()

  let resizeObserver: ResizeObserver | undefined

  /**
   * Redraws the canvas using the current candles, cursor, and theme.
   */
  function redraw() {
    const element = canvas.value
    if (!element) return

    renderChart(element, candles.value, cursor.value, chartTheme.value)
  }

  watch([candles, cursor], redraw)

  onMounted(() => {
    const element = canvas.value
    const container = element?.parentElement

    if (!container) return

    resizeObserver = new ResizeObserver(redraw)
    resizeObserver.observe(container)
    redraw()
  })

  onBeforeUnmount(() => {
    resizeObserver?.disconnect()
  })

  return { redraw }
}
