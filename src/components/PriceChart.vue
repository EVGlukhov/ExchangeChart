<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Market, Timeframe } from '../constants/chart'
import type { Candle } from '../types/candle';
import { fetchCandles } from '../services/binance';

const props = defineProps<{
  market: Market
  timeframe: Timeframe
}>()

const canvas = ref<HTMLCanvasElement | null>(null)
const candles = ref<Candle[]>([])
const loading = ref(false)
const error = ref('')

let controller: AbortController | undefined

watch(
  () => [props.market, props.timeframe] as const,
  async ([market, timeframe]) => {
    controller?.abort();

    const request = new AbortController()
    controller = request
    loading.value = true
    error.value = ''

    try {
      candles.value = await fetchCandles(market, timeframe, request.signal)
    } catch (cause) {
      if (request.signal.aborted) return

      error.value = cause instanceof Error ? cause.message : 'Не удалось загрузить свечи'
      candles.value = []
    } finally {
      if (controller === request) {
        loading.value = false
      }
    }
  },
  { immediate: true }
)

onMounted(() => {
  const element = canvas.value;
  if (!element) return;

  const { width, height } = element.getBoundingClientRect()
  if (width === 0 || height === 0) return

  const pixelRatio = window.devicePixelRatio || 1
  element.width = Math.round(width * pixelRatio)
  element.height = Math.round(height * pixelRatio)

  const context = element.getContext('2d')
  if (!context) return

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.strokeStyle = '#f59e0b'
  context.lineWidth = 2
  context.beginPath()
  context.moveTo(24, height / 2)
  context.lineTo(width - 24, height / 2)
  context.stroke()
})
</script>

<template>
  <div class="relative h-[min(65vh,560px)] min-h-80 bg-gray-950">
    <canvas ref="canvas" class="block h-full w-full" :aria-label="`${props.market} / ${props.timeframe} chart`"></canvas>
    <p v-if="loading"
      class="pointer-events-none absolute inset-0 grid place-items-center text-sm text-gray-400"
      role="status">
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
