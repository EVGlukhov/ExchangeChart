<script setup lang="ts">
import type { Market, Timeframe } from '../constants/chart.ts';

defineProps<{
  market: Market,
  timeframe: Timeframe
}>()
</script>
<template>
  <div
    class="relative h-[min(65vh,560px)] min-h-80 bg-gray-950"
  >
      <canvas
        class="
          block
          h-full w-full
        "
       :aria-label="`${market} / ${timeframe} chart`"></canvas>
      <p
        class="
          grid
          text-sm text-gray-500
          pointer-events-none
          absolute inset-0 place-items-center
        "
      >
        Chart will render here
      </p>
    </div>
</template>
