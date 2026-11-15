<script setup lang="ts">
defineProps<{
  pressed: boolean
}>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="pressed"
    :class="[
      'rounded px-2.5 py-1.5 text-sm uppercase transition-colors',
      pressed
        ? 'bg-binance-hover text-binance-accent'
        : 'text-binance-muted hover:bg-binance-hover hover:text-binance-text',
    ]"
  >
    <slot />
  </button>
</template>
