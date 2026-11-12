<script setup lang="ts">
import { ref } from "vue";
import type { Market, Timeframe } from "../constants/chart";
import { useCandles } from "../composables/useCandles";
import { useCanvasChart } from "../composables/useCanvasChart";
import { useChartCrosshair } from "../composables/useChartCrosshair";
import { useCandleTooltip } from "../composables/useCandleTooltip";

const props = defineProps<{
  market: Market;
  timeframe: Timeframe;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);

const { candles, loading, error } = useCandles(
  () => props.market,
  () => props.timeframe
)

const {
  cursor,
  handlePointerMove,
  handlePointerLeave
} = useChartCrosshair(canvas)

const { tooltip } = useCandleTooltip(canvas, candles, cursor);

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
    <div v-if="tooltip && !loading && !error"
      :style="tooltip.style"
      class="pointer-events-none absolute z-10 overflow-hidden rounded-md border border-gray-700 bg-gray-900 p-3 text-xs text-gray-200 shadow-lg"
      role="tooltip"
    >
      <p class="mb-2 truncate font-semibold text-gray-100">
        {{ new Date(tooltip.candle.time).toLocaleString() }}
      </p>

      <dl class="grid grid-cols-2 gap-x-4 gap-y-1">
        <dt class="text-gray-400">Open</dt>
        <dd class="text-right">{{ tooltip.candle.open }}</dd>
        <dt class="text-gray-400">High</dt>
        <dd class="text-right">{{ tooltip.candle.high }}</dd>
        <dt class="text-gray-400">Low</dt>
        <dd class="text-right">{{ tooltip.candle.low }}</dd>
        <dt class="text-gray-400">Close</dt>
        <dd class="text-right">{{ tooltip.candle.close }}</dd>
      </dl>
    </div>
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
