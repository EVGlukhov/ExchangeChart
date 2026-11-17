<script setup lang="ts">
import Typography from '../ui/Typography.vue'

defineProps<{ title: string }>()
</script>

<template>
  <section
    class="border-binance-border bg-binance-surface text-binance-text overflow-hidden rounded-lg border shadow-sm shadow-black/30"
  >
    <header
      class="border-binance-border flex h-11 shrink-0 items-center justify-between border-b px-3"
    >
      <Typography as="h2" variant="small" class="font-medium">{{ title }}</Typography>
      <slot name="actions" />
    </header>

    <slot />
  </section>
</template>
