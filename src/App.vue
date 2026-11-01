<script setup lang="ts">
  import { ref } from "vue";
  import HeaderBar from './components/HeaderBar.vue'
  import ChartPanel from './components/ChartPanel.vue';
  import { MARKET, TIMEFRAME } from './constants/chart.ts';

  const market = ref(MARKET.BTC_USDT);
  const timeframe = ref(TIMEFRAME.HOUR_1);
</script>
<template>
  <main class="min-h-screen bg-gray-950 p-4 text-gray-100 sm:p-6">
    <HeaderBar v-model="market" />
    <ChartPanel v-model="timeframe" :market="market" />
  </main>
</template>
