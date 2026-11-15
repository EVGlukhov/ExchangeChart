import { ref, type Ref } from 'vue'
import type { ChartCursor } from '../utils/chartRenderer'

/**
 * Creates reactive crosshair state and pointer-movement handlers relative to
 * the canvas boundaries.
 *
 * @param canvas A reference to the canvas used as the coordinate origin.
 * @returns The cursor coordinates and pointer event handlers.
 */
export function useChartCrosshair(canvas: Ref<HTMLCanvasElement | null>) {
  const cursor = ref<ChartCursor | null>(null)

  /**
   * Converts the pointer event's screen coordinates to local canvas coordinates.
   *
   * @param event The browser pointer event.
   */
  function handlePointerMove(event: PointerEvent) {
    const element = canvas.value
    if (!element) return

    const bounds = element.getBoundingClientRect()

    cursor.value = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    }
  }

  /**
   * Hides the crosshair when the pointer leaves the canvas.
   */
  function handlePointerLeave() {
    cursor.value = null
  }

  return { cursor, handlePointerMove, handlePointerLeave }
}
