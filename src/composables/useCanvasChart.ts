import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import type { Candle } from '../types/candle'
import { renderChart, type ChartCursor } from '../utils/chartRenderer'

export function useCanvasChart(
  canvas: Ref<HTMLCanvasElement | null>,
  candles: Ref<Candle[]>,
  cursor: Ref<ChartCursor | null>,
) {
  let resizeObserver: ResizeObserver | undefined

  function redraw() {
    const element = canvas.value
    if (!element) return

    renderChart(element, candles.value, cursor.value)
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
