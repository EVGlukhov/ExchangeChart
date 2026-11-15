import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * Controls fullscreen mode for the specified element and synchronizes its state
 * with the browser Fullscreen API.
 *
 * @param element A reference to the element to display in fullscreen.
 * @returns Reactive fullscreen state and error, plus a function to toggle the mode.
 */
export function useFullscreen(element: Ref<HTMLElement | null>) {
  const isFullscreen = ref(false)
  const error = ref('')

  /**
   * Synchronizes the composable state with the document's current fullscreen element.
   */
  function syncFullscreenState() {
    isFullscreen.value = document.fullscreenElement === element.value
  }

  /**
   * Enters or exits fullscreen mode for the target element and exposes any
   * Fullscreen API error to the interface.
   */
  async function toggleFullscreen() {
    const target = element.value
    if (!target) return

    error.value = ''

    try {
      if (document.fullscreenElement === target) {
        await document.exitFullscreen()
      } else {
        await target.requestFullscreen()
      }
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : 'Could not change fullscreen mode'
    }
  }

  onMounted(() => {
    document.addEventListener('fullscreenchange', syncFullscreenState)
    syncFullscreenState()
  })

  onBeforeUnmount(() => {
    document.removeEventListener('fullscreenchange', syncFullscreenState)
  })

  return { isFullscreen, error, toggleFullscreen }
}
