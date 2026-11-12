import { ref, type Ref } from 'vue'
import type { ChartCursor } from '../utils/chartRenderer'

export function useChartCrosshair(canvas: Ref<HTMLCanvasElement | null>) {
  const cursor = ref<ChartCursor | null>(null)

  function handlePointerMove(event: PointerEvent) {
    const element = canvas.value
    if (!element) return

    const bounds = element.getBoundingClientRect()

    cursor.value = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }
  }

  function handlePointerLeave() {
    cursor.value = null
  }

  return { cursor, handlePointerMove, handlePointerLeave }
}
