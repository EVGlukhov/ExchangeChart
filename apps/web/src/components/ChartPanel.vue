<script setup lang="ts">
import { TIMEFRAMES, type Timeframe, type Market } from '../constants/chart'
import TimeframeButton from './TimeframeButton.vue'
import FullscreenButton from './FullscreenButton.vue';
import PriceChart from './PriceChart.vue'
import { ref } from 'vue';
import { useFullscreen } from '../composables/useFullscreen';

defineProps<{ market: Market }>()

const timeframe = defineModel<Timeframe>({ required: true })

const panel = ref<HTMLElement | null>(null)
const { isFullscreen, toggleFullscreen } = useFullscreen(panel)
</script>

<template>
  <section ref="panel"
    class="chart-panel overflow-hidden rounded-xl border border-binance-border bg-binance-surface shadow-xl shadow-black/20"
  >
    <div
      class="flex min-h-14 items-center justify-between gap-4 border-b border-binance-border bg-binance-surface/80 px-4"
    >
      <div class="flex gap-2" aria-label="Chart controls">
        <div class="flex gap-2" aria-label="Chart timeframe">
          <TimeframeButton
            v-for="interval in TIMEFRAMES"
            :key="interval"
            :pressed="timeframe === interval"
            @click="timeframe = interval"
          >
            {{ interval }}
          </TimeframeButton>
        </div>

        <FullscreenButton :is-fullscreen="isFullscreen" @click="toggleFullscreen()" />
      </div>

      <span class="text-sm font-semibold text-gray-100">{{ market }} / {{ timeframe }}</span>
    </div>

    <PriceChart class="chart-content" :market="market" :timeframe="timeframe" />
  </section>
</template>
