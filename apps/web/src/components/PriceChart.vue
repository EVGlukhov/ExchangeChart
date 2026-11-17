<script setup lang="ts">
import { ref } from 'vue'
import Typography from './ui/Typography.vue'
import type { Market, Timeframe } from '../constants/chart'
import { useCandles } from '../composables/useCandles'
import { useCanvasChart } from '../composables/useCanvasChart'
import { useChartCrosshair } from '../composables/useChartCrosshair'
import { useCandleTooltip } from '../composables/useCandleTooltip'
import { formatTooltipDate } from '../utils/formatters.ts'

const props = defineProps<{
  market: Market
  timeframe: Timeframe
}>()

const canvas = ref<HTMLCanvasElement | null>(null)

const { candles, loading, error } = useCandles(
  () => props.market,
  () => props.timeframe,
)

const { cursor, handlePointerMove, handlePointerLeave } = useChartCrosshair(canvas)

const { tooltip } = useCandleTooltip(canvas, candles, cursor)

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
    <div
      v-if="tooltip && !loading && !error"
      :style="tooltip.style"
      class="pointer-events-none absolute z-10 overflow-hidden rounded-md border border-gray-700 bg-gray-900 p-3 shadow-lg"
      role="tooltip"
    >
      <Typography as="p" variant="small" tone="emphasis" class="mb-2 truncate font-semibold">
        {{ formatTooltipDate(tooltip.candle.time) }}
      </Typography>

      <dl class="grid grid-cols-2 gap-x-4 gap-y-1">
        <dt>
          <Typography variant="small" tone="subtle">Open</Typography>
        </dt>
        <dd class="text-right">
          <Typography variant="small" tone="neutral">
            {{ tooltip.candle.open }}
          </Typography>
        </dd>
        <dt>
          <Typography variant="small" tone="subtle">High</Typography>
        </dt>
        <dd class="text-right">
          <Typography variant="small" tone="neutral">
            {{ tooltip.candle.high }}
          </Typography>
        </dd>
        <dt>
          <Typography variant="small" tone="subtle">Low</Typography>
        </dt>
        <dd class="text-right">
          <Typography variant="small" tone="neutral">
            {{ tooltip.candle.low }}
          </Typography>
        </dd>
        <dt>
          <Typography variant="small" tone="subtle">Close</Typography>
        </dt>
        <dd class="text-right">
          <Typography variant="small" tone="neutral">
            {{ tooltip.candle.close }}
          </Typography>
        </dd>
      </dl>
    </div>
    <Typography
      v-if="loading"
      as="p"
      variant="body"
      tone="subtle"
      class="pointer-events-none absolute inset-0 grid place-items-center"
      role="status"
    >
      Загружаю свечи...
    </Typography>
    <Typography
      v-else-if="error"
      as="p"
      variant="body"
      tone="sell"
      class="pointer-events-none absolute inset-0 grid place-items-center px-4 text-center"
    >
      {{ error }}
    </Typography>
  </div>
</template>
