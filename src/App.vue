<script setup lang="ts">
  import { ref } from "vue";
  import HeaderBar from './components/HeaderBar.vue'
  import ChartPanel from './components/ChartPanel.vue';
  import { MARKET, TIMEFRAME } from './constants/chart.ts';

  const market = ref(MARKET.BTC_USDT);
  const timeframe = ref(TIMEFRAME.HOUR_1);
</script>
<template>
  <main class="min-h-screen bg-gray-950 px-4 py-6 text-gray-100 sm:px-6 lg:px-8">
    <div class="mx-auto max-w-screen-2xl">
      <HeaderBar v-model="market" />
      <ChartPanel v-model="timeframe" :market="market" />
    </div>
  </main>
</template>
