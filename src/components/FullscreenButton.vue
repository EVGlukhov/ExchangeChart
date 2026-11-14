<script setup lang="ts">
import EnterFullscreenIcon from '../assets/fullscreen-enter.svg?component'
import ExitFullscreenIcon from '../assets/fullscreen-exit.svg?component'

defineProps<{ isFullscreen: boolean }>()
</script>
<template>
  <button
    type="button"
    class="rounded p-2 text-binance-muted hover:bg-binance-hover hover:text-binance-text"
    :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
    :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
  >

    <ExitFullscreenIcon v-if="isFullscreen" class="size-5" aria-hidden="true" />
    <EnterFullscreenIcon v-else class="size-5" aria-hidden="true" />
  </button>
</template>
