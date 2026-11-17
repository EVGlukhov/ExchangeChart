<script setup lang="ts">
import Typography from './ui/Typography.vue'

defineProps<{
  pressed: boolean
}>()
</script>

<template>
  <button
    type="button"
    :aria-pressed="pressed"
    :class="[
      'rounded px-2.5 py-1.5 transition-colors',
      pressed
        ? 'bg-binance-hover text-binance-accent'
        : 'text-binance-muted hover:bg-binance-hover hover:text-binance-text',
    ]"
  >
    <Typography variant="control" tone="inherit">
      <slot />
    </Typography>
  </button>
</template>
