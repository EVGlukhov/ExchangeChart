<script setup lang="ts">
import EnterFullscreenIcon from '../assets/fullscreen-enter.svg?component'
import ExitFullscreenIcon from '../assets/fullscreen-exit.svg?component'

defineProps<{ isFullscreen: boolean }>()
</script>
<template>
  <button
    type="button"
    class="text-binance-muted hover:bg-binance-hover hover:text-binance-text rounded p-2"
    :aria-label="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
    :title="isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'"
  >
    <ExitFullscreenIcon v-if="isFullscreen" class="size-5" aria-hidden="true" />
    <EnterFullscreenIcon v-else class="size-5" aria-hidden="true" />
  </button>
</template>
