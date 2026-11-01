<script setup lang="ts">
import { TIMEFRAMES, type Timeframe, type Market } from '../constants/chart';
import TimeframeButton from "./TimeframeButton.vue";
import PriceChart from "./PriceChart.vue";

defineProps<{market: Market}>()

const timeframe = defineModel<Timeframe>({ required: true });
</script>

<template>
  <section class="overflow-hidden rounded-lg border border-gray-800 bg-gray-900">
    <div
      class="
        flex
        min-h-13
        px-4
        border-b border-gray-800
        items-center justify-between
      "
    >
      <div
        class="
          flex
          gap-2
        "
      aria-label="Chart timeframe">
        <TimeframeButton
          v-for="interval in TIMEFRAMES"
          :key="interval"
          :pressed="timeframe === interval"
          @click="timeframe = interval"
        >
          {{ interval }}
        </TimeframeButton>
      </div>

      <span
        class="
          text-sm font-semibold text-gray-100
        "
      >{{market}} / {{timeframe}}</span>
    </div>

    <PriceChart :market="market" :timeframe="timeframe" />
  </section>
</template>
