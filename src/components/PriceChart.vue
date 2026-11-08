<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Market, Timeframe } from '../constants/chart'
import type { Candle } from '../types/candle';
import { fetchCandles } from '../services/binance';
import { CHART_MARGIN, createChartScales } from '../utils/chartScales'
import { CANDLE_BODY_WIDTH_RATIO } from '../../.history/src/utils/chartScales_20261108221720';

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

function drawChart() {
  const element = canvas.value;
  if (!element) return;

  const { width, height } = element.getBoundingClientRect()
  if (width === 0 || height === 0) return

  const pixelRatio = window.devicePixelRatio || 1
  element.width = Math.round(width * pixelRatio)
  element.height = Math.round(height * pixelRatio)

  const context = element.getContext('2d')
  if (!context) return

  const styles = getComputedStyle(document.documentElement)
  const risingColor = styles.getPropertyValue('--chart-candle-up').trim()
  const fallingColor = styles.getPropertyValue('--chart-candle-down').trim()

  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)

  const scales = createChartScales(candles.value, { width, height })
  if (!scales) return

  const plotWidth = width - CHART_MARGIN.left - CHART_MARGIN.right;

  const candleSpacing =
    candles.value.length > 1
      ? Math.abs(
        scales.x(new Date(candles.value[1]!.time)) -
        scales.x(new Date(candles.value[0]!.time)),
      )
      : plotWidth

  const bodyWidth = Math.max(1, Math.min(20, candleSpacing * CANDLE_BODY_WIDTH_RATIO))

  for (const candle of candles.value) {
    const x = scales.x(new Date(candle.time))
    const openY = scales.y(candle.open)
    const closeY = scales.y(candle.close)
    const isRising = candle.close >= candle.open
    const color = isRising ? risingColor : fallingColor;

    context.strokeStyle = color
    context.beginPath()
    context.moveTo(x, scales.y(candle.high))
    context.lineTo(x, scales.y(candle.low))
    context.stroke()

    context.fillStyle = color
    const bodyTop = Math.min(openY, closeY)
    const bodyHeight = Math.max(1, Math.abs(closeY - openY))
    context.fillRect(x - bodyWidth / 2, bodyTop, bodyWidth, bodyHeight)
  }
}

watch(candles, drawChart);

onMounted(() => {
  drawChart()
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
