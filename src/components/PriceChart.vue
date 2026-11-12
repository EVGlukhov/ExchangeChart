<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from "vue";
import type { Market, Timeframe } from "../constants/chart";
import type { Candle } from "../types/candle";
import { fetchCandles } from "../services/binance";
import { renderChart } from "../utils/chartRenderer";

const props = defineProps<{
  market: Market;
  timeframe: Timeframe;
}>();

const canvas = ref<HTMLCanvasElement | null>(null);
const candles = ref<Candle[]>([]);
const loading = ref(false);
const error = ref("");

let controller: AbortController | undefined;
let resizeObserver: ResizeObserver | undefined;

watch(
  () => [props.market, props.timeframe] as const,
  async ([market, timeframe]) => {
    controller?.abort();

    const request = new AbortController();
    controller = request;
    loading.value = true;
    error.value = "";

    try {
      candles.value = await fetchCandles(market, timeframe, request.signal);
    } catch (cause) {
      if (request.signal.aborted) return;

      error.value = cause instanceof Error ? cause.message : "Не удалось загрузить свечи";
      candles.value = [];
    } finally {
      if (controller === request) {
        loading.value = false;
      }
    }
  },
  { immediate: true }
);

function drawChart() {
  const element = canvas.value;
  if (!element) return;

  renderChart(element, candles.value);
}

watch(candles, drawChart);

onMounted(() => {
  const element = canvas.value;
  const container = element?.parentElement;

  if (!container) return;

  resizeObserver = new ResizeObserver(() => {
    drawChart();
  });

  resizeObserver.observe(container);
  drawChart();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  controller?.abort();
});
</script>

<template>
  <div class="relative h-[min(65vh,560px)] min-h-80 bg-gray-950">
    <canvas
      ref="canvas"
      class="block h-full w-full"
      :aria-label="`${props.market} / ${props.timeframe} chart`"
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
