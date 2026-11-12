import { onBeforeUnmount, onMounted, watch, type Ref } from 'vue'
import type { Candle } from '../types/candle'
import { renderChart } from '../utils/chartRenderer'

export function useCanvasChart(canvas: Ref<HTMLCanvasElement | null>, candles: Ref<Candle[]>) {
  let resizeObserver: ResizeObserver | undefined

  function redraw() {
    const element = canvas.value
    if (!element) return

    renderChart(element, candles.value)
  }

  watch(candles, redraw)

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
