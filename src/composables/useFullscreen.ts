import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

export function useFullscreen(element: Ref<HTMLElement | null>) {
  const isFullscreen = ref(false)
  const error = ref('')

  function syncFullscreenState() {
    isFullscreen.value = document.fullscreenElement === element.value
  }

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
