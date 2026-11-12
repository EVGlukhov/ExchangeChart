<script setup lang="ts">
import { ref } from "vue";
import type { Market, Timeframe } from "../constants/chart";
import { useCandles } from "../composables/useCandles";
import { useCanvasChart } from "../composables/useCanvasChart";
import { useChartCrosshair } from "../composables/useChartCrosshair";

const props = defineProps<{
  market: Market;
  timeframe: Timeframe;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);

const { candles, loading, error } = useCandles(
  () => props.market,
  () => props.timeframe
)

const { cursor, handlePointerMove, handlePointerLeave } = useChartCrosshair(canvas)

useCanvasChart(canvas, candles, cursor)

</script>

<template>
  <div class="relative h-[min(65vh,560px)] min-h-80 bg-gray-950">
    <canvas
      ref="canvas"
      class="block h-full w-full"
      :aria-label="`${props.market} / ${props.timeframe} chart`"
      @pointermove="handlePointerMove"
      @pointerleave="handlePointerLeave"
    ></canvas>
    <p
      v-if="loading"
      class="pointer-events-none absolute inset-0 grid place-items-center text-sm text-gray-400"
      role="status"
    >
      Загружаю свечи...
    </p>
    <p
      v-else-if="error"
      class="pointer-events-none absolute inset-0 grid place-items-center px-4 text-center text-sm text-red-400"
    >
      {{ error }}
    </p>
  </div>
</template>
