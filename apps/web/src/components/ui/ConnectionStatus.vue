<script setup lang="ts">
import Typography from './Typography.vue'

withDefaults(
  defineProps<{
    connected: boolean
    size?: 'compact' | 'normal'
    title?: string
  }>(),
  {
    size: 'compact',
  },
)
</script>

<template>
  <span class="flex items-center" :class="size === 'normal' ? 'gap-2' : 'gap-1.5'" :title="title">
    <span
      class="rounded-full"
      :class="[
        size === 'normal' ? 'size-2' : 'size-1.5',
        connected ? 'bg-binance-buy' : 'bg-binance-muted',
        connected && size === 'normal' && 'animate-pulse',
      ]"
    ></span>

    <Typography :variant="size === 'normal' ? 'small' : 'caption'" tone="muted">
      {{ connected ? 'Live' : 'Connecting' }}
    </Typography>
  </span>
</template>
